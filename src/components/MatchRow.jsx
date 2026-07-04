import { TYPE_COLOR } from "../data/typeChart";
import { MODE_SPRITE } from "../data/modes";
import { Arena } from "./Arena";
import { Sprite } from "./bits";
import { useT } from "../i18n";

export function MatchRow({ trainer, result, live, snap, lens, consumable, paused, onTogglePause, tickMs }) {
  const { t } = useT();
  const r = result;
  return (
    <div className={"match " + r.status + (trainer.champion ? " champ-row" : "")}>
      <div className="match-head">
        <div className="mh-enemy">
          <Sprite src={trainer.sprite} alt={trainer.name} size={40} className="trainer-spr" />
          <span className="match-eyebrow">
            {trainer.champion ? t("roles.champion") : trainer.title}
          </span>
          <span className="match-vs">
            <em>{t("match.vs")}</em>{" "}
            <b style={{ color: TYPE_COLOR[trainer.spec] }}>{trainer.name}</b>
            <span className="match-spec">{t("types." + trainer.spec).toUpperCase()}</span>
          </span>
        </div>

        {r.status === "live" && (
          <button
            className={"pause-btn" + (paused ? " on" : "")}
            onClick={onTogglePause}
            title={paused ? t("match.resumeTitle") : t("match.pauseTitle")}
            aria-label={paused ? t("match.resumeAria") : t("match.pauseAria")}
          >
            {paused ? "▶" : "❚❚"}
          </button>
        )}

        <span className="match-side">
          {r.status === "live" && (
            <>
              <span className="you-tag">{t("match.you")}</span>
              <Sprite
                src={MODE_SPRITE[lens]}
                alt={t("match.youAria")}
                size={40}
                className="trainer-spr"
              />
            </>
          )}
          {(r.status === "win" || r.status === "loss") && (
            <span className={"result-badge " + r.status}>
              <span className="rb-tag">{r.status === "win" ? t("match.won") : t("match.lost")}</span>
              <span className="rb-score">
                <b className="rb-you">{r.score[0]}</b>
                <span className="rb-x">×</span>
                <b className="rb-foe">{r.score[1]}</b>
                <span className="rb-ko">{t("match.ko")}</span>
              </span>
            </span>
          )}
          {r.status === "pending" && <span className="next-tag">{t("match.next")}</span>}
        </span>
      </div>

      {r.status !== "pending" && !live && Object.keys(r.koBy).length > 0 && (
        <div className="kos-line">
          <span className="kos-label">{t("match.ko")}</span>{" "}
          {Object.entries(r.koBy)
            .map(([n, c]) => (c > 1 ? `${n} ×${c}` : n))
            .join(", ")}
        </div>
      )}

      {live && snap && (
        <Arena
          snap={snap}
          feed={r.feed}
          enemyTotal={trainer.team.length}
          consumable={consumable}
          tickMs={tickMs}
        />
      )}
    </div>
  );
}
