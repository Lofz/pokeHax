import { useState } from "react";
import { getMon } from "../data/dex";
import { ELITE } from "../data/elite";
import { MODE_SPRITE } from "../data/modes";
import { MonCard } from "./MonCard";
import { TypeChip, Sprite } from "./bits";
import { useT, Rich } from "../i18n";

/** Pokémon de vitrine do tutorial (Typhlosion, com um potencial alto de exemplo). */
const DEMO = { ...getMon(157), potential: 84 };

export function Intro({ lens, setLens, onStart }) {
  const { t } = useT();
  const [openElite, setOpenElite] = useState(null);
  return (
    <section className="intro">
      <div className="intro-block">
        <div className="intro-eyebrow">{t("intro.howTitle")}</div>
        <ol className="how-steps">
          <li><Rich text={t("intro.step1")} /></li>
          <li><Rich text={t("intro.step2")} /></li>
          <li><Rich text={t("intro.step3")} /></li>
          <li><Rich text={t("intro.step4")} /></li>
        </ol>
      </div>

      <div className="intro-block intro-split">
        <MonCard mon={DEMO} lens={lens} />
        <div className="intro-copy">
          <div className="intro-eyebrow">{t("intro.cardEyebrow")}</div>
          <p><Rich text={t("intro.cardP1")} /></p>
          <p><Rich text={t("intro.cardP2")} /></p>
          <p className="intro-tip">{t("intro.cardTip")}</p>
        </div>
      </div>

      <div className="intro-block">
        <div className="intro-eyebrow">{t("intro.enemiesTitle")}</div>
        <div className="elite-lineup">
          {ELITE.map((tr, i) => {
            const open = openElite === i;
            return (
              <button
                key={tr.name}
                className={
                  "elite-card" +
                  (tr.champion ? " champ" : "") +
                  (open ? " open" : "")
                }
                onClick={() => setOpenElite(open ? null : i)}
                aria-expanded={open}
              >
                <Sprite src={tr.sprite} alt={tr.name} size={64} className="trainer-spr" />
                <div className="elite-title">
                  {tr.champion ? "👑 " + t("roles.champion") + " 👑" : tr.title}
                </div>
                <div className="elite-name">{tr.name}</div>
                <TypeChip t={tr.spec} />
                <span className="elite-toggle">
                  {open ? t("intro.toggleOpen") : t("intro.toggleClosed")}
                </span>
              </button>
            );
          })}
        </div>

        {openElite != null && (
          <div className="elite-team">
            {ELITE[openElite].team.map((m, j) => (
              <div className="elite-mon" key={j}>
                <Sprite src={m.image.sprite} alt={m.name} size={48} />
                <span className="elite-mon-name">{m.name.toUpperCase()}</span>
                <span className="elite-mon-pow">{t("intro.elitePower", { bst: m.bst })}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="intro-block">
        <div className="intro-eyebrow">{t("intro.modeTitle")}</div>
        <div className="mode-grid">
          <button
            className={"mode-card" + (lens === "rocket" ? " on" : "")}
            onClick={() => setLens("rocket")}
            aria-pressed={lens === "rocket"}
          >
            <div className="mode-head">
              <Sprite src={MODE_SPRITE.rocket} alt="Giovanni" size={56} className="trainer-spr" />
              <div className="mode-name">{t("intro.modeRocketName")}</div>
            </div>
            <p>{t("intro.modeRocketDesc")}</p>
            <span className="mode-skip">{t("intro.modeRocketSkip")}</span>
          </button>
          <button
            className={"mode-card" + (lens === "oak" ? " on" : "")}
            onClick={() => setLens("oak")}
            aria-pressed={lens === "oak"}
          >
            <div className="mode-head">
              <Sprite src={MODE_SPRITE.oak} alt="Professor Oak" size={56} className="trainer-spr" />
              <div className="mode-name">{t("intro.modeOakName")}</div>
            </div>
            <p>{t("intro.modeOakDesc")}</p>
            <span className="mode-skip">{t("intro.modeOakSkip")}</span>
          </button>
        </div>
      </div>

      <div className="btn-row">
        <button className="btn btn-gold" onClick={onStart}>
          {t("intro.start")}
        </button>
      </div>
    </section>
  );
}
