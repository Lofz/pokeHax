import { useState, useEffect, useRef, useMemo } from "react";
import { newSeed, hashSeed } from "./engine/rng";
import { simulateBattle } from "./engine/battle";
import { rollCandidates, evolveMon, TEAM_SIZE, CANDIDATES_PER_ROUND } from "./data/pool";
import { rollConsumables, getConsumable } from "./data/consumables";
import { LEAGUES, getLeague, DEFAULT_LEAGUE_ID } from "./data/elite";
import { getMon } from "./data/dex";
import { MonCard } from "./components/MonCard";
import { Intro } from "./components/Intro";
import { ItemPick } from "./components/ItemPick";
import { Bench } from "./components/Arena";
import { Sprite } from "./components/bits";
import { MatchRow } from "./components/MatchRow";
import { ChampionBox, DefeatBox } from "./components/Finale";
import { SiteFooter, SupportBanner } from "./components/About";
import { track } from "./analytics/track";
import { useT, Rich } from "./i18n";

const freshResults = (roster) =>
  roster.map(() => ({ status: "pending", score: [0, 0], koBy: {}, feed: [] }));

/**
 * DEBUG — força a tela de vitória (Hall da Fama) para desenvolvimento rápido.
 * Ative com `?win` na URL (só em dev) ou buildando com VITE_FORCE_WIN=1.
 */
const DEBUG_WIN =
  import.meta.env.VITE_FORCE_WIN === "1" ||
  (import.meta.env.DEV &&
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).has("win"));

/** Monta um time + resultados fictícios de campanha vencida (só p/ o DEBUG_WIN). */
function buildDebugWin() {
  const LEG = new Set([144, 145, 146, 150, 151, 243, 244, 245, 249, 250, 251]);
  const picks = [
    [157, 96], [149, 88], [94, 73], [65, 81], [143, 67], [249, 92],
    // Typhlosion, Dragonite, Gengar, Alakazam, Snorlax, Lugia
  ];
  const team = picks.map(([id, potential]) => ({ ...getMon(id), potential, rare: LEG.has(id) }));
  const n = team.map((m) => m.name);
  const koByPer = [
    { [n[0]]: 3, [n[1]]: 2 },
    { [n[2]]: 2, [n[3]]: 3 },
    { [n[4]]: 4, [n[0]]: 1 },
    { [n[5]]: 3, [n[1]]: 2 },
    { [n[0]]: 2, [n[1]]: 2, [n[5]]: 2 },
  ];
  const losses = [1, 0, 2, 1, 3];
  const roster = getLeague(DEFAULT_LEAGUE_ID).roster;
  const results = roster.map((tr, i) => ({
    status: "win",
    score: [tr.team.length, losses[i]],
    koBy: koByPer[i],
    feed: [],
  }));
  return { team, results };
}
const DEBUG = DEBUG_WIN ? buildDebugWin() : null;

export default function App() {
  const { t, lang, setLang } = useT();
  const [seed, setSeed] = useState(() => newSeed());
  const [leagueId, setLeagueId] = useState(DEFAULT_LEAGUE_ID); // qual Elite enfrentar (carrossel)
  const league = useMemo(() => getLeague(leagueId), [leagueId]);
  const [phase, setPhase] = useState(DEBUG ? "champion" : "intro"); // intro | roll | run | champion | defeat
  const [team, setTeam] = useState(() => (DEBUG ? DEBUG.team : [])); // preenchido pick a pick no draft
  const [results, setResults] = useState(() =>
    DEBUG ? DEBUG.results : freshResults(getLeague(DEFAULT_LEAGUE_ID).roster)
  );
  const [current, setCurrent] = useState(-1);
  const [snap, setSnap] = useState(null);
  const [mode, setMode] = useState("auto"); // auto | manual
  const [speed, setSpeed] = useState("fast"); // fast | normal
  const [lens, setLens] = useState("rocket"); // rocket (revela poder) | oak (oculta)
  const [dragId, setDragId] = useState(null); // id do Pokémon sendo arrastado
  const dragRef = useRef(null); // { id } — estável durante o arrasto
  const gridRef = useRef(null); // container do grid: captura o ponteiro aqui
  const [paused, setPaused] = useState(false); // congela o playback p/ capturar telas
  // pulos gastos por rodada (re-sorteia os candidatos daquela rodada)
  const [skips, setSkips] = useState(() => Array(TEAM_SIZE).fill(0));
  // consumível escolhido (etapa entre draft e reordenação): { id, target(monId) }
  const [consumable, setConsumable] = useState(null);
  // item selecionado aguardando a escolha do alvo (passo 2 da etapa)
  const [pendingItem, setPendingItem] = useState(null);
  const [nextIdx, setNextIdx] = useState(null);
  const eventsRef = useRef([]);
  const [evIdx, setEvIdx] = useState(0);
  const runCount = useRef(0); // nº de partidas iniciadas nesta sessão (sequência)
  const reduced =
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Duração de 1 tick do playback — também dá o compasso das animações da
  // Arena (vira a CSS var --tick). A "rápida" é o padrão do jogo; com os FX
  // ela roda a 220ms (era 130ms) pra cada golpe ainda ser legível.
  const tickMs = reduced ? 40 : speed === "fast" ? 220 : 360;

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

  /* --- etapa de consumível: derivada (draft feito, item ainda não escolhido) --- */
  const itemChosen = !!consumable;
  const itemStep = draftComplete && !itemChosen;
  // Alvos válidos do Doce Raro: mon que ainda evolui E cuja evolução NÃO está já
  // no time (evita dois mons idênticos, o que quebraria a key/reorder/mira).
  const evoTargets = useMemo(
    () =>
      new Set(
        team
          .filter((m) => m.evolvesTo != null && !team.some((o) => o.id === m.evolvesTo))
          .map((m) => m.id)
      ),
    [team]
  );
  const canEvolve = evoTargets.size > 0;
  // 3 opções determinísticas por (seed, canEvolve) — sem re-sorteio.
  const itemOptions = useMemo(
    () => (itemStep ? rollConsumables(seed, { canEvolve }) : []),
    [itemStep, seed, canEvolve]
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

  /* --- etapa de consumível --- */
  /** Passo 1: escolhe um item. Se mira 1 mon, vai pro passo 2; senão fixa já. */
  function pickItem(id) {
    const it = getConsumable(id);
    if (it?.targeted) setPendingItem(id);
    else setConsumable({ id, target: null });
  }
  /** Passo 2: aplica o item pendente ao mon escolhido → avança pra reordenação. */
  function assignItem(monId) {
    if (!pendingItem) return;
    const it = getConsumable(pendingItem);
    // Doce Raro (item `evolves`): evolui o mon-alvo na hora (preservando a
    // condição) em vez de virar buff. O `consumable.target` passa a ser o NOVO id.
    if (it?.evolves) {
      const target = team.find((m) => m.id === monId);
      if (!target || !evoTargets.has(monId)) return; // só evolutivos válidos
      const evo = evolveMon(target);
      setTeam((t) => t.map((m) => (m.id === monId ? evo : m)));
      setConsumable({ id: pendingItem, target: evo.id });
      setPendingItem(null);
      return;
    }
    setConsumable({ id: pendingItem, target: monId });
    setPendingItem(null);
  }
  /** Volta do passo 2 para as cartas de item. */
  const cancelItem = () => setPendingItem(null);

  /**
   * Reordenação por Pointer Events (mouse + toque → funciona no iOS, onde o
   * drag-and-drop HTML5 não dispara). Captura o ponteiro na alça e, a cada
   * movimento, descobre a carta sob o dedo via elementFromPoint e move o item
   * arrastado para a posição dela (reorder ao vivo).
   */
  function startDrag(e, id) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.preventDefault();
    // captura no GRID (não na carta): ele não se move quando as cartas
    // reordenam, então a captura não se perde no meio do arrasto.
    gridRef.current?.setPointerCapture?.(e.pointerId);
    dragRef.current = { id };
    setDragId(id);
  }

  function onDragMove(e) {
    if (!dragRef.current) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const card = el && el.closest("[data-mon-id]");
    if (!card) return;
    const overId = Number(card.dataset.monId);
    const id = dragRef.current.id;
    if (!overId || overId === id) return;
    setTeam((t) => {
      const from = t.findIndex((m) => m.id === id);
      const to = t.findIndex((m) => m.id === overId);
      if (from < 0 || to < 0 || from === to) return t;
      const next = [...t];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  // a captura é solta automaticamente no pointerup; aqui só limpamos o estado.
  // Sempre limpa (sem early-return), para a carta nunca ficar presa em "dragging".
  function endDrag() {
    dragRef.current = null;
    setDragId(null);
  }

  /** Recomeça a jornada do zero, parando em `toPhase`. */
  function resetJourney(toPhase) {
    const s = newSeed();
    setSeed(s);
    setTeam([]);
    setSkips(Array(TEAM_SIZE).fill(0));
    setConsumable(null);
    setPendingItem(null);
    setResults(freshResults(league.roster));
    setCurrent(-1);
    setSnap(null);
    setNextIdx(null);
    setEvIdx(0);
    setDragId(null);
    dragRef.current = null;
    setPaused(false);
    eventsRef.current = [];
    setPhase(toPhase);
  }

  const fullReset = () => {
    track("play_again", { from: phase, mode: lens });
    resetJourney("roll");
  };
  const goHome = () => resetJourney("intro");

  /** Troca a liga (no carrossel da intro) e redimensiona os resultados. */
  function chooseLeague(id) {
    setLeagueId(id);
    setResults(freshResults(getLeague(id).roster));
  }

  function startBattle(idx) {
    // Resolve o efeito do consumível (se houver) para o alvo escolhido.
    const cmod = consumable
      ? { target: consumable.target, mod: getConsumable(consumable.id)?.mod }
      : null;
    const sim = simulateBattle(
      team,
      league.roster[idx],
      hashSeed(seed + ":" + idx),
      league.playerLvl,
      cmod
    );
    eventsRef.current = sim.events;
    setEvIdx(0);
    setCurrent(idx);
    setNextIdx(null);
    const first = sim.events[0];
    setSnap({ ...first });
    setResults((rs) =>
      rs.map((r, i) =>
        i === idx ? { ...r, status: "live", score: [0, 0], koBy: {}, feed: [] } : r
      )
    );
  }

  function startRun() {
    runCount.current += 1;
    track("challenge_started", {
      mode: lens,
      seed,
      run_number: runCount.current, // 1ª, 2ª… partida desta sessão
      skips_used: totalSkips,
      team: team.map((m) => m.id),
      item: consumable?.id ?? null,
      item_target: consumable?.target ?? null,
    });
    setPhase("run");
    startBattle(0);
  }

  /* playback da timeline de eventos */
  useEffect(() => {
    if (phase !== "run" || current < 0 || paused) return;
    const evs = eventsRef.current;
    if (evIdx >= evs.length) return;
    const ev = evs[evIdx];
    // O delay diz quanto tempo o evento ANTERIOR fica em cena antes deste
    // aparecer. Depois de um send/faint o próximo evento espera mais: é a
    // janela pra animação de entrada (Pokébola) / K.O. (recall) terminar.
    const prev = evIdx > 0 ? evs[evIdx - 1] : null;
    let mult = ev.k === "faint" ? 3 : ev.k === "send" ? 1.5 : 1;
    if (prev && (prev.k === "send" || prev.k === "faint")) mult = Math.max(mult, 2.2);
    const delay = tickMs * mult;

    const timer = setTimeout(() => {
      setSnap({ ...ev });

      if (ev.k === "turn" && ev.note) {
        setResults((rs) =>
          rs.map((r, i) =>
            i === current
              ? {
                  ...r,
                  feed: [
                    ...r.feed,
                    {
                      turn: ev.turn,
                      kind: "info",
                      text: t("feed." + ev.note.kind, { name: ev.note.name.toUpperCase() }),
                    },
                  ],
                }
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
                  text: t("feed.faint", {
                    name: ev.name.toUpperCase(),
                    by: ev.by.toUpperCase(),
                  }),
                },
              ],
            };
          })
        );
      }

      if (ev.k === "end") {
        const idx = current;
        // `item` = perk usado nesta run (null se nenhum). Vai em stage_result,
        // champion e defeat via o spread de `common` → "qual perk no jogo X".
        const common = { mode: lens, seed, run_number: runCount.current, item: consumable?.id ?? null };
        track("stage_result", {
          ...common,
          stage: idx + 1, // etapa 1..5
          trainer: league.roster[idx].name,
          win: ev.win,
          score_for: ev.score?.[0] ?? null,
          score_against: ev.score?.[1] ?? null,
        });
        setResults((rs) =>
          rs.map((r, i) => (i === idx ? { ...r, status: ev.win ? "win" : "loss" } : r))
        );
        setCurrent(-1);
        if (!ev.win) {
          track("defeat", { ...common, stage: idx + 1, trainer: league.roster[idx].name });
          setPhase("defeat");
        } else if (idx === league.roster.length - 1) {
          track("champion", { ...common });
          setPhase("champion");
        } else setNextIdx(idx + 1);
      }

      setEvIdx((i) => i + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [phase, current, evIdx, speed, reduced, paused, t]);

  /* encadeamento automático entre batalhas */
  useEffect(() => {
    if (phase !== "run" || nextIdx == null || mode !== "auto" || paused) return;
    const t = setTimeout(() => startBattle(nextIdx), reduced ? 100 : 1100);
    return () => clearTimeout(t);
  }, [phase, nextIdx, mode, paused]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Pré-carrega (escalonado) os thumbnails do time durante a run. Evita o burst
     de 6 requisições no Hall da Fama (que tomava 403 do jsDelivr no 5G/CGNAT) e
     deixa o PNG de compartilhar usar o cache. crossOrigin = canvas "limpo". */
  useEffect(() => {
    if (phase !== "run" || !team.length) return;
    const urls = team.map((m) => m.image?.thumbnail).filter(Boolean);
    let i = 0;
    let timer = setTimeout(function tick() {
      if (i >= urls.length) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = urls[i++];
      timer = setTimeout(tick, 1500); // 1 a cada 1,5s — a run dura bem mais
    }, 600);
    return () => clearTimeout(timer);
  }, [phase, team]);

  const finalLoss = phase === "defeat" ? results.findIndex((r) => r.status === "loss") : -1;

  return (
    <div className="page">
      <header className="hdr">
        <div className="lang-switch" role="group" aria-label={t("lang.aria")}>
          <button
            type="button"
            className={"lang-btn" + (lang === "pt" ? " on" : "")}
            onClick={() => setLang("pt")}
            aria-pressed={lang === "pt"}
            aria-label={t("lang.pt")}
          >
            PT
          </button>
          <button
            type="button"
            className={"lang-btn" + (lang === "en" ? " on" : "")}
            onClick={() => setLang("en")}
            aria-pressed={lang === "en"}
            aria-label={t("lang.en")}
          >
            EN
          </button>
        </div>
        <div className="eyebrow">{t("header.eyebrow", { seed })}</div>
        <h1 className="title">
          <button
            type="button"
            className="logo-btn"
            onClick={goHome}
            aria-label={t("header.logoAria")}
          >
            PokéHax
          </button>
        </h1>
        <p className="tagline">
          <Rich text={t("header.tagline")} />
        </p>
        <SupportBanner />
      </header>

      {phase === "intro" && (
        <Intro
          lens={lens}
          setLens={setLens}
          onStart={() => setPhase("roll")}
          league={league}
          leagues={LEAGUES}
          onLeague={chooseLeague}
        />
      )}

      {phase === "roll" && (
        <section>
          <div className="reorder-bar">
            <span className={"lens-chip " + lens}>
              {t("roll.modePrefix")}{" "}
              {lens === "rocket" ? t("intro.modeRocketName") : t("intro.modeOakName")}
            </span>
            <span className="reorder-hint">
              {!draftComplete
                ? t("roll.hintRound", { n: draftRound + 1, total: TEAM_SIZE })
                : itemStep
                ? pendingItem
                  ? getConsumable(pendingItem)?.evolves
                    ? t("items.applyHintEvo")
                    : t("items.applyHint")
                  : t("items.hint")
                : t("roll.hintDone")}
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
                      <span className="tray-empty">
                        {active ? t("roll.trayChoosing") : t("roll.trayEmpty")}
                      </span>
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
                  {t("roll.skipBtn", { n: CANDIDATES_PER_ROUND })}
                  {" — "}
                  {skipsLeft > 0
                    ? lens === "rocket"
                      ? t("roll.skipLeftRound", { n: skipsLeft })
                      : t("roll.skipLeftTotal", { n: skipsLeft })
                    : t("roll.skipNone")}
                </button>
              </div>
            </>
          ) : itemStep ? (
            <ItemPick
              options={itemOptions}
              team={team}
              pending={pendingItem}
              evoTargets={evoTargets}
              onPick={pickItem}
              onAssign={assignItem}
              onCancel={cancelItem}
            />
          ) : (
            <>
              {/* key estável por id (sem índice): o reorder ao vivo move o DOM
                  sem remontar. O grid captura o ponteiro e ouve move/fim. */}
              <div
                className="team-grid"
                ref={gridRef}
                onPointerMove={onDragMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onLostPointerCapture={endDrag}
              >
                {team.map((m, i) => (
                  <MonCard
                    key={m.id}
                    mon={m}
                    lens={lens}
                    slot={i + 1}
                    draggable
                    dragging={dragId === m.id}
                    onDragStart={(e) => startDrag(e, m.id)}
                    itemBadge={
                      consumable && consumable.target === m.id
                        ? getConsumable(consumable.id)
                        : null
                    }
                  />
                ))}
              </div>
              <div className="btn-row">
                <button className="btn btn-gold" onClick={startRun}>
                  {t("roll.challenge")}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {phase !== "roll" && phase !== "intro" && (
        <section>
          <div className="run-bar">
            <div className="seg">
              <button
                className={"seg-btn" + (mode === "manual" ? " on" : "")}
                onClick={() => setMode("manual")}
              >
                {t("run.manual")}
              </button>
              <button
                className={"seg-btn" + (mode === "auto" ? " on" : "")}
                onClick={() => setMode("auto")}
              >
                {t("run.auto")}
              </button>
            </div>
            <div className="seg">
              <button
                className={"seg-btn" + (speed === "normal" ? " on" : "")}
                onClick={() => setSpeed("normal")}
              >
                {t("run.normal")}
              </button>
              <button
                className={"seg-btn" + (speed === "fast" ? " on" : "")}
                onClick={() => setSpeed("fast")}
              >
                {t("run.fast")}
              </button>
            </div>
            <button className="btn btn-ghost small" onClick={fullReset}>
              {t("run.newJourney")}
            </button>
          </div>

          <Bench team={team} consumable={consumable} />

          <div className="matches">
            {league.roster.map((tr, i) => (
              <MatchRow
                key={tr.name}
                trainer={tr}
                result={results[i]}
                live={current === i}
                snap={snap}
                lens={lens}
                consumable={consumable}
                paused={paused}
                onTogglePause={() => setPaused((p) => !p)}
                tickMs={tickMs}
              />
            ))}
          </div>

          {phase === "run" && nextIdx != null && mode === "manual" && (
            <div className="btn-row">
              <button className="btn btn-gold" onClick={() => startBattle(nextIdx)}>
                {t("run.nextBattle", { name: league.roster[nextIdx].name })}
              </button>
            </div>
          )}

          {phase === "champion" && (
            <ChampionBox
              team={team}
              results={results}
              onReset={fullReset}
              seed={seed}
              lens={lens}
              region={t("leagues." + leagueId + ".region")}
            />
          )}

          {phase === "defeat" && finalLoss >= 0 && (
            <DefeatBox
              trainer={league.roster[finalLoss]}
              result={results[finalLoss]}
              stage={finalLoss + 1}
              onReset={fullReset}
            />
          )}
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
