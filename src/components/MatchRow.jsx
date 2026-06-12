import { TYPE_COLOR, TYPE_PT } from "../data/typeChart";
import { MODE_SPRITE } from "../data/modes";
import { Arena } from "./Arena";
import { Sprite } from "./bits";

export function MatchRow({ trainer, result, live, snap, lens, paused, onTogglePause }) {
  const r = result;
  return (
    <div className={"match " + r.status + (trainer.title === "CAMPEÃO" ? " champ-row" : "")}>
      <div className="match-head">
        <div className="mh-enemy">
          <Sprite src={trainer.sprite} alt={trainer.name} size={40} className="trainer-spr" />
          <span className="match-eyebrow">{trainer.title}</span>
          <span className="match-vs">
            <em>vs</em>{" "}
            <b style={{ color: TYPE_COLOR[trainer.spec] }}>{trainer.name}</b>
            <span className="match-spec">{TYPE_PT[trainer.spec].toUpperCase()}</span>
          </span>
        </div>

        {r.status === "live" && (
          <button
            className={"pause-btn" + (paused ? " on" : "")}
            onClick={onTogglePause}
            title={paused ? "Continuar" : "Pausar"}
            aria-label={paused ? "Continuar batalha" : "Pausar batalha"}
          >
            {paused ? "▶" : "❚❚"}
          </button>
        )}

        <span className="match-side">
          {r.status === "live" && (
            <>
              <span className="you-tag">VOCÊ</span>
              <Sprite src={MODE_SPRITE[lens]} alt="Você" size={40} className="trainer-spr" />
            </>
          )}
          {(r.status === "win" || r.status === "loss") && (
            <span className={"result-badge " + r.status}>
              <span className="rb-tag">{r.status === "win" ? "GANHOU" : "PERDEU"}</span>
              <span className="rb-score">
                <b className="rb-you">{r.score[0]}</b>
                <span className="rb-x">×</span>
                <b className="rb-foe">{r.score[1]}</b>
                <span className="rb-ko">K.O.</span>
              </span>
            </span>
          )}
          {r.status === "pending" && <span className="next-tag">A SEGUIR</span>}
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

      {live && snap && <Arena snap={snap} feed={r.feed} enemyTotal={trainer.team.length} />}
    </div>
  );
}
