import { useState, useEffect, useRef, useMemo } from "react";
import { newSeed, hashSeed } from "./engine/rng";
import { simulateBattle } from "./engine/battle";
import { rollCandidates, TEAM_SIZE, CANDIDATES_PER_ROUND } from "./data/pool";
import { ELITE } from "./data/elite";
import { MonCard } from "./components/MonCard";
import { Intro } from "./components/Intro";
import { Bench } from "./components/Arena";
import { Sprite } from "./components/bits";
import { MatchRow } from "./components/MatchRow";
import { ChampionBox, DefeatBox } from "./components/Finale";
import { Gate } from "./components/competitive/Gate";
import { Hub } from "./components/competitive/Hub";
import { OpponentSearch } from "./components/competitive/OpponentSearch";
import { CompResultBox } from "./components/competitive/CompResult";
import { initCompetitive, lockTeam, playMatch, dailyStatus } from "./services/competitive";
import { getAccount, getSessionCode, clearSession } from "./services/db";

const freshResults = (n = ELITE.length) =>
  Array.from({ length: n }, () => ({ status: "pending", score: [0, 0], koBy: {}, feed: [] }));

export default function App() {
  const [seed, setSeed] = useState(() => newSeed());
  // intro | roll | run | champion | defeat | gate | hub | search | compdone
  const [phase, setPhase] = useState("intro");
  const [team, setTeam] = useState([]); // preenchido pick a pick no draft
  const [results, setResults] = useState(freshResults);
  const [current, setCurrent] = useState(-1);
  const [snap, setSnap] = useState(null);
  const [mode, setMode] = useState("auto"); // auto | manual
  const [speed, setSpeed] = useState("fast"); // fast | normal
  const [lens, setLens] = useState("rocket"); // rocket (revela poder) | oak (oculta)
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);
  // pulos gastos por rodada (re-sorteia os candidatos daquela rodada)
  const [skips, setSkips] = useState(() => Array(TEAM_SIZE).fill(0));
  const [nextIdx, setNextIdx] = useState(null);
  const eventsRef = useRef([]);
  const [evIdx, setEvIdx] = useState(0);

  /* --- estado do modo competitivo --- */
  const [account, setAccount] = useState(null); // conta logada (ou null)
  const [gateCode, setGateCode] = useState(null); // código vindo de ?conta=
  const [draftFor, setDraftFor] = useState("elite"); // p/ quem é o draft atual
  const [battleMode, setBattleMode] = useState("elite"); // elite | comp
  const [compMatch, setCompMatch] = useState(null); // resultado já persistido
  const [compLineup, setCompLineup] = useState([]); // [treinador adversário]
  const [compErr, setCompErr] = useState(null);

  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* na carga: semeia os bots, lê ?conta= da URL e restaura a sessão */
  useEffect(() => {
    initCompetitive();
    const params = new URLSearchParams(window.location.search);
    const urlCode = (params.get("conta") || "").toUpperCase() || null;
    (async () => {
      const sess = getSessionCode();
      if (sess) {
        const acc = await getAccount(sess);
        if (acc && !acc.isBot) {
          setAccount(acc);
          // link da própria conta + sessão ativa → direto ao hub
          if (urlCode && urlCode === acc.code) {
            setPhase("hub");
            return;
          }
        }
      }
      if (urlCode) {
        setGateCode(urlCode);
        setPhase("gate");
      }
    })();
  }, []);

  /* --- estado do draft (derivado do tamanho do time) --- */
  const draftRound = team.length; // 0..6
  const draftComplete = draftRound >= TEAM_SIZE;
  const roundNonce = skips[draftRound] || 0;
  const candidates = useMemo(
    () =>
      phase === "roll" && !draftComplete
        ? rollCandidates(seed, draftRound, team.map((m) => m.id), roundNonce)
        : [],
    [phase, seed, team, draftComplete, draftRound, roundNonce]
  );

  /* Pulos: Equipe Rocket tem 1 por rodada; Professor Oak tem 1 no draft todo. */
  const totalSkips = skips.reduce((a, b) => a + b, 0);
  const skipsLeft = lens === "rocket" ? 1 - roundNonce : 1 - totalSkips;
  const canSkip = !draftComplete && skipsLeft > 0;

  /** Escolhe um candidato da rodada: preenche a próxima vaga. */
  function pickMon(mon) {
    setTeam((t) => (t.length >= TEAM_SIZE ? t : [...t, mon]));
  }

  /** Pula os candidatos da rodada atual: re-sorteia (gasta um pulo). */
  function doSkip() {
    if (!canSkip) return;
    setSkips((s) => {
      const next = [...s];
      next[draftRound] = (next[draftRound] || 0) + 1;
      return next;
    });
  }

  /** Move um Pokémon da posição `from` para `to` (drag and drop). */
  function reorderTeam(from, to) {
    if (from == null || to == null || from === to) return;
    setTeam((t) => {
      const next = [...t];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  /** Recomeça a jornada do zero, parando em `toPhase`. */
  function resetJourney(toPhase, target = "elite") {
    const s = newSeed();
    setSeed(s);
    setTeam([]);
    setSkips(Array(TEAM_SIZE).fill(0));
    setResults(freshResults());
    setCurrent(-1);
    setSnap(null);
    setNextIdx(null);
    setEvIdx(0);
    setDragIdx(null);
    setOverIdx(null);
    setDraftFor(target);
    setBattleMode("elite");
    setCompMatch(null);
    setCompErr(null);
    eventsRef.current = [];
    setPhase(toPhase);
  }

  const fullReset = () => resetJourney("roll");
  const goHome = () => resetJourney("intro");

  /** Inicia o playback de uma timeline já simulada (Elite ou competitivo). */
  function beginPlayback(events, idx) {
    eventsRef.current = events;
    setEvIdx(0);
    setCurrent(idx);
    setNextIdx(null);
    setSnap({ ...events[0] });
    setResults((rs) =>
      rs.map((r, i) =>
        i === idx ? { ...r, status: "live", score: [0, 0], koBy: {}, feed: [] } : r
      )
    );
  }

  function startBattle(idx) {
    const sim = simulateBattle(team, ELITE[idx], hashSeed(seed + ":" + idx));
    beginPlayback(sim.events, idx);
  }

  function startRun() {
    setBattleMode("elite");
    setPhase("run");
    startBattle(0);
  }

  /* --- ações do modo competitivo --- */

  function enterCompetitive() {
    setPhase(account ? "hub" : "gate");
  }

  function onGateEnter(acc) {
    setAccount(acc);
    setGateCode(null);
    setPhase("hub");
  }

  function logout() {
    clearSession();
    setAccount(null);
    resetJourney("intro");
  }

  /** Salva o draft como equipe competitiva FIXA. */
  async function saveCompTeam() {
    setCompErr(null);
    try {
      const acc = await lockTeam(account.code, team);
      setAccount(acc);
      setPhase("hub");
    } catch (ex) {
      setCompErr(ex.message);
    }
  }

  /**
   * Desafio ranqueado: o serviço simula E PERSISTE o resultado de uma vez
   * (Elo, tentativa diária, histórico) — o playback é só a reprise.
   */
  async function handleChallenge(opp) {
    const res = await playMatch(account.code, opp.code);
    setAccount(res.account);
    setCompMatch(res);
    setCompLineup([res.trainer]);
    setTeam(res.account.competitive.team);
    setResults(freshResults(1));
    setBattleMode("comp");
    setPhase("run");
    beginPlayback(res.events, 0);
  }

  const lineup = battleMode === "comp" ? compLineup : ELITE;

  /* playback da timeline de eventos */
  useEffect(() => {
    if (phase !== "run" || current < 0) return;
    const evs = eventsRef.current;
    if (evIdx >= evs.length) return;
    const ev = evs[evIdx];
    const base = reduced ? 40 : speed === "fast" ? 130 : 360;
    const delay = ev.k === "faint" ? base * 3 : ev.k === "send" ? base * 1.5 : base;

    const t = setTimeout(() => {
      setSnap({ ...ev });

      if (ev.k === "turn" && ev.note) {
        setResults((rs) =>
          rs.map((r, i) =>
            i === current
              ? { ...r, feed: [...r.feed, { turn: ev.turn, kind: "info", text: ev.note.text }] }
              : r
          )
        );
      }

      if (ev.k === "faint") {
        setResults((rs) =>
          rs.map((r, i) => {
            if (i !== current) return r;
            const koBy = { ...r.koBy };
            if (ev.side === "e") koBy[ev.by] = (koBy[ev.by] || 0) + 1;
            return {
              ...r,
              score: ev.score,
              koBy,
              feed: [
                ...r.feed,
                {
                  turn: ev.turn,
                  kind: ev.side === "e" ? "ko-enemy" : "ko-player",
                  text: `${ev.name.toUpperCase()} caiu! K.O. de ${ev.by.toUpperCase()}`,
                },
              ],
            };
          })
        );
      }

      if (ev.k === "end") {
        const idx = current;
        setResults((rs) =>
          rs.map((r, i) => (i === idx ? { ...r, status: ev.win ? "win" : "loss" } : r))
        );
        setCurrent(-1);
        if (battleMode === "comp") setPhase("compdone");
        else if (!ev.win) setPhase("defeat");
        else if (idx === ELITE.length - 1) setPhase("champion");
        else setNextIdx(idx + 1);
      }

      setEvIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [phase, current, evIdx, speed, reduced, battleMode]);

  /* encadeamento automático entre batalhas (só na campanha da Elite) */
  useEffect(() => {
    if (phase !== "run" || nextIdx == null || mode !== "auto") return;
    const t = setTimeout(() => startBattle(nextIdx), reduced ? 100 : 1100);
    return () => clearTimeout(t);
  }, [phase, nextIdx, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const finalLoss = phase === "defeat" ? results.findIndex((r) => r.status === "loss") : -1;
  const inBattleView =
    phase === "run" || phase === "champion" || phase === "defeat" || phase === "compdone";

  return (
    <div className="page">
      <header className="hdr">
        <div className="eyebrow">
          {account ? `CONTA ${account.code} · ` : ""}A JORNADA · SEED #{seed}
        </div>
        <h1 className="title">
          <button
            type="button"
            className="logo-btn"
            onClick={goHome}
            aria-label="PokéHax — voltar à tela inicial"
          >
            PokéHax
          </button>
        </h1>
        <p className="tagline">
          Role o dado: saem 6 Pokémon. Encare a Elite dos 4 de Johto e o Campeão.
          <br />
          Seu time leva a varrida — ou aplica o <strong>6 a 0</strong>?
        </p>
      </header>

      {phase === "intro" && (
        <Intro
          lens={lens}
          setLens={setLens}
          onStart={() => setPhase("roll")}
          onCompetitive={enterCompetitive}
          loggedName={account?.name}
        />
      )}

      {phase === "gate" && (
        <Gate prefillCode={gateCode} onEnter={onGateEnter} onBack={goHome} />
      )}

      {phase === "hub" && account && (
        <Hub
          account={account}
          onBuildTeam={() => resetJourney("roll", "comp")}
          onSearch={() => setPhase("search")}
          onLogout={logout}
        />
      )}

      {phase === "search" && account && (
        <OpponentSearch
          account={account}
          onChallenge={handleChallenge}
          onBack={() => setPhase("hub")}
        />
      )}

      {phase === "roll" && (
        <section>
          <div className="reorder-bar">
            <span className={"lens-chip " + lens}>
              {draftFor === "comp"
                ? "DRAFT COMPETITIVO"
                : `MODO: ${lens === "rocket" ? "EQUIPE ROCKET" : "PROFESSOR OAK"}`}
            </span>
            <span className="reorder-hint">
              {draftComplete
                ? draftFor === "comp"
                  ? "Equipe pronta. Arraste para ordenar — depois de SALVAR, ela é FIXA."
                  : "Time fechado. Arraste as cartas para reordenar quem entra primeiro."
                : `Rodada ${draftRound + 1} de ${TEAM_SIZE} — escolha um Pokémon para a ${draftRound + 1}ª vaga.`}
            </span>
          </div>

          {/* bandeja de vagas: o progresso do draft */}
          {!draftComplete && (
            <div className="draft-tray">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const m = team[i];
                const active = i === draftRound;
                return (
                  <div
                    className={"tray-slot" + (m ? " filled" : "") + (active ? " active" : "")}
                    key={i}
                  >
                    <span className="tray-num">{i + 1}</span>
                    {m ? (
                      <>
                        <Sprite src={m.image.sprite} alt={m.name} size={40} />
                        <span className="tray-name">{m.name.toUpperCase()}</span>
                      </>
                    ) : (
                      <span className="tray-empty">{active ? "ESCOLHENDO" : "VAGA"}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {!draftComplete ? (
            <>
              <div className="draft-pool">
                {candidates.map((m) => (
                  <MonCard key={m.id} mon={m} lens={lens} onPick={() => pickMon(m)} />
                ))}
              </div>
              <div className="btn-row">
                <button
                  className="btn btn-ghost small"
                  onClick={doSkip}
                  disabled={!canSkip}
                >
                  ↻ PULAR ESTES {CANDIDATES_PER_ROUND}
                  {" — "}
                  {skipsLeft > 0
                    ? `resta ${skipsLeft} ${lens === "rocket" ? "nesta rodada" : "no total"}`
                    : "sem pulos"}
                </button>
                {draftFor === "comp" && (
                  <button className="btn btn-ghost small" onClick={() => setPhase("hub")}>
                    ◂ CANCELAR E VOLTAR AO HUB
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="team-grid">
                {team.map((m, i) => (
                  <MonCard
                    key={m.id + "-" + i}
                    mon={m}
                    lens={lens}
                    slot={i + 1}
                    draggable
                    dragging={dragIdx === i}
                    over={overIdx === i && dragIdx !== i}
                    onDragStart={(e) => {
                      setDragIdx(i);
                      e.dataTransfer.effectAllowed = "move";
                      e.dataTransfer.setData("text/plain", String(i));
                    }}
                    onDragEnter={() => setOverIdx(i)}
                    onDrop={(e) => {
                      e.preventDefault();
                      reorderTeam(dragIdx, i);
                      setDragIdx(null);
                      setOverIdx(null);
                    }}
                    onDragEnd={() => {
                      setDragIdx(null);
                      setOverIdx(null);
                    }}
                  />
                ))}
              </div>
              {compErr && <p className="gate-err">{compErr}</p>}
              <div className="btn-row">
                {draftFor === "comp" ? (
                  <>
                    <button className="btn btn-gold" onClick={saveCompTeam}>
                      SALVAR EQUIPE FIXA ▸
                    </button>
                    <button className="btn btn-ghost" onClick={() => setPhase("hub")}>
                      ◂ CANCELAR
                    </button>
                  </>
                ) : (
                  <button className="btn btn-gold" onClick={startRun}>
                    DESAFIAR A ELITE ▸
                  </button>
                )}
              </div>
            </>
          )}
        </section>
      )}

      {inBattleView && (
        <section>
          <div className="run-bar">
            {battleMode === "elite" && (
              <div className="seg">
                <button
                  className={"seg-btn" + (mode === "manual" ? " on" : "")}
                  onClick={() => setMode("manual")}
                >
                  Batalha a batalha
                </button>
                <button
                  className={"seg-btn" + (mode === "auto" ? " on" : "")}
                  onClick={() => setMode("auto")}
                >
                  Automático
                </button>
              </div>
            )}
            <div className="seg">
              <button
                className={"seg-btn" + (speed === "normal" ? " on" : "")}
                onClick={() => setSpeed("normal")}
              >
                Normal
              </button>
              <button
                className={"seg-btn" + (speed === "fast" ? " on" : "")}
                onClick={() => setSpeed("fast")}
              >
                Rápida
              </button>
            </div>
            {battleMode === "elite" && (
              <button className="btn btn-ghost small" onClick={fullReset}>
                NOVA JORNADA
              </button>
            )}
          </div>

          <Bench team={team} />

          <div className="matches">
            {lineup.map((tr, i) => (
              <MatchRow
                key={tr.name + "-" + i}
                trainer={tr}
                result={results[i]}
                live={current === i}
                snap={snap}
              />
            ))}
          </div>

          {phase === "run" && nextIdx != null && mode === "manual" && (
            <div className="btn-row">
              <button className="btn btn-gold" onClick={() => startBattle(nextIdx)}>
                PRÓXIMA BATALHA: {ELITE[nextIdx].name} ▸
              </button>
            </div>
          )}

          {phase === "champion" && (
            <ChampionBox team={team} results={results} onReset={fullReset} />
          )}

          {phase === "defeat" && finalLoss >= 0 && (
            <DefeatBox
              trainer={ELITE[finalLoss]}
              result={results[finalLoss]}
              stage={finalLoss + 1}
              onReset={fullReset}
            />
          )}

          {phase === "compdone" && compMatch && account && (
            <CompResultBox
              result={compMatch}
              slotsLeft={dailyStatus(account).left}
              onSearchAgain={() => setPhase("search")}
              onHub={() => setPhase("hub")}
            />
          )}
        </section>
      )}

      <footer className="foot">
        Simulação não oficial feita por fãs · dados e sprites do pokedex.json ·
        times da Elite baseados em Pokémon Gold/Silver
      </footer>
    </div>
  );
}
