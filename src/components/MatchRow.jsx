import { TYPE_COLOR, TYPE_PT } from "../data/typeChart";
import { Arena } from "./Arena";
import { Sprite } from "./bits";

export function MatchRow({ trainer, result, live, snap }) {
  const r = result;
  return (
    <div className={"match " + r.status + (trainer.title === "CAMPEÃO" ? " champ-row" : "")}>
      <div className="match-head">
        <Sprite src={trainer.sprite} alt={trainer.name} size={40} className="trainer-spr" />
        <span className="match-eyebrow">{trainer.title}</span>
        <span className="match-vs">
          <em>vs</em>{" "}
          <b style={{ color: TYPE_COLOR[trainer.spec] ?? "var(--cream)" }}>{trainer.name}</b>
          {TYPE_PT[trainer.spec] && (
            <span className="match-spec">{TYPE_PT[trainer.spec].toUpperCase()}</span>
          )}
        </span>
        <span className="match-score">
          {r.status === "pending" ? (
            <span className="dim">— · —</span>
          ) : (
            <>
              <b className={r.status === "loss" ? "red" : "gold"}>{r.score[0]}</b>
              <span className="dash">–</span>
              <b className={r.status === "loss" ? "gold" : "dimnum"}>{r.score[1]}</b>
            </>
          )}
          {r.status === "win" && <span className="mark ok">✓</span>}
          {r.status === "loss" && <span className="mark bad">✕</span>}
          {live && snap && <span className="mark live">{snap.turn}'</span>}
        </span>
      </div>

      {r.status !== "pending" && !live && Object.keys(r.koBy).length > 0 && (
        <div className="kos-line">
          <span className="kos-label">K.O.</span>{" "}
          {Object.entries(r.koBy)
            .map(([n, c]) => (c > 1 ? `${n} ×${c}` : n))
            .join(", ")}
        </div>
      )}

      {live && snap && <Arena snap={snap} feed={r.feed} />}
    </div>
  );
}
