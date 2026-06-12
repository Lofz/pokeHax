/**
 * CompResult.jsx — o veredito da partida competitiva: pontos ganhos/perdidos,
 * rating novo e mudança de liga (promoção/rebaixamento).
 */
import { LeagueBadge, Delta } from "./bits";

export function CompResultBox({ result, slotsLeft, onSearchAgain, onHub }) {
  const { win, score, delta, ratingAfter, leagueBefore, leagueAfter, opponent } = result;
  const promoted = leagueAfter.min > leagueBefore.min;
  const demoted = leagueAfter.min < leagueBefore.min;

  return (
    <div className={"finale " + (win ? "win-box" : "lose-box")}>
      <div className="finale-eyebrow">LIGA POKÉMON · PARTIDA RANQUEADA</div>
      <div className={"finale-title" + (win ? "" : " red")}>
        {win ? "VITÓRIA!" : "DERROTA"} {score[0]}–{score[1]} vs {opponent.name}
      </div>

      <div className="result-rank">
        <span className="result-delta">
          <Delta value={delta} /> PTS
        </span>
        <span className="result-rating">
          AGORA: <b>{ratingAfter}</b> · <LeagueBadge league={leagueAfter} small />
        </span>
      </div>

      {promoted && (
        <p className="result-league gold">
          ▲ PROMOVIDO! Você subiu para a {leagueAfter.name}.
        </p>
      )}
      {demoted && (
        <p className="result-league red">
          ▼ Rebaixado para a {leagueAfter.name}. Recupere os pontos!
        </p>
      )}

      <div className="btn-row">
        {slotsLeft > 0 && (
          <button className="btn btn-gold" onClick={onSearchAgain}>
            BUSCAR OUTRO ADVERSÁRIO ▸ ({slotsLeft} HOJE)
          </button>
        )}
        <button className="btn btn-ghost" onClick={onHub}>
          VOLTAR AO HUB
        </button>
      </div>
    </div>
  );
}
