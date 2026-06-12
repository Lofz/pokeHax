/**
 * OpponentSearch.jsx — "Buscar Adversário": a vitrine assíncrona da Liga.
 *
 * Lista as equipes salvas dos outros competidores (snapshot — ninguém precisa
 * estar online). Mostra composição, liga, rating e a projeção de pontos do
 * desafio; esconde a condição dos Pokémon (regra 4).
 */
import { useEffect, useState } from "react";
import { listOpponents, dailyStatus, MAX_DAILY_MATCHES } from "../../services/competitive";
import { projectDeltas } from "../../services/ranking";
import { LeagueBadge, TeamPeek } from "./bits";

export function OpponentSearch({ account, onChallenge, onBack }) {
  const [opponents, setOpponents] = useState(null);
  const [busyCode, setBusyCode] = useState(null);
  const [err, setErr] = useState(null);
  const myRating = account.competitive.rating;
  const daily = dailyStatus(account);

  useEffect(() => {
    let alive = true;
    listOpponents(account.code).then((list) => {
      if (!alive) return;
      // os páreos mais justos primeiro — rating mais próximo do seu
      list.sort(
        (a, b) => Math.abs(a.rating - myRating) - Math.abs(b.rating - myRating)
      );
      setOpponents(list);
    });
    return () => {
      alive = false;
    };
  }, [account.code, myRating]);

  async function challenge(opp) {
    setErr(null);
    setBusyCode(opp.code);
    try {
      await onChallenge(opp);
    } catch (ex) {
      setErr(ex.message);
      setBusyCode(null);
    }
  }

  return (
    <section className="search">
      <div className="reorder-bar">
        <button className="btn btn-ghost small" onClick={onBack}>
          ◂ VOLTAR AO HUB
        </button>
        <span className="reorder-hint">
          Batalha assíncrona: você enfrenta a equipe salva do adversário — os
          páreos mais justos aparecem primeiro. Partidas hoje:{" "}
          <b>{daily.left}</b>/{MAX_DAILY_MATCHES}.
        </span>
      </div>

      {err && <p className="gate-err">{err}</p>}

      {opponents === null ? (
        <p className="mut">Procurando treinadores…</p>
      ) : (
        <div className="opp-list">
          {opponents.map((opp) => {
            const proj = projectDeltas(myRating, opp.rating);
            return (
              <div className="opp-card" key={opp.code}>
                <div className="opp-head">
                  <div className="opp-id">
                    <span className="opp-name">{opp.name}</span>
                    <LeagueBadge league={opp.league} small />
                  </div>
                  <div className="opp-stats">
                    <span className="opp-rating">{opp.rating} PTS</span>
                    <span className="mut">
                      {opp.wins}V · {opp.losses}D
                    </span>
                  </div>
                </div>

                <TeamPeek team={opp.team} />

                <div className="opp-foot">
                  <span className="opp-proj">
                    VITÓRIA <b className="gold">+{proj.win}</b> · DERROTA{" "}
                    <b className="red">{proj.loss}</b>
                  </span>
                  <button
                    className="btn btn-gold small"
                    disabled={daily.left === 0 || busyCode !== null}
                    onClick={() => challenge(opp)}
                  >
                    {busyCode === opp.code ? "SIMULANDO…" : "DESAFIAR ▸"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
