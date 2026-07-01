import { useState, useRef } from "react";
import { getMon } from "../data/dex";
import { MODE_SPRITE } from "../data/modes";
import { MonCard } from "./MonCard";
import { TypeChip, Sprite } from "./bits";
import { track } from "../analytics/track";
import { useT, Rich } from "../i18n";

/** Pokémon de vitrine do tutorial (Typhlosion, com um potencial alto de exemplo). */
const DEMO = { ...getMon(157), potential: 84 };

export function Intro({ lens, setLens, onStart, league, leagues, onLeague }) {
  const { t } = useT();
  const [openElite, setOpenElite] = useState(null);
  /** Troca o modo e registra a escolha (só quando muda). */
  function choose(m) {
    if (m !== lens) track("mode_selected", { mode: m });
    setLens(m);
  }
  const multiLeague = leagues.length > 1;
  /** Navega o carrossel de ligas (cíclico). Fecha o time aberto ao trocar. */
  function spinLeague(dir) {
    if (!multiLeague) return;
    const i = leagues.findIndex((l) => l.id === league.id);
    const next = leagues[(i + dir + leagues.length) % leagues.length];
    if (next.id !== league.id) {
      setOpenElite(null);
      onLeague(next.id);
    }
  }

  /**
   * Swipe horizontal (mobile): arrastar p/ a esquerda = próxima liga, p/ a
   * direita = anterior. Pointer Events (igual ao reorder do time → funciona no
   * toque do iOS). Só conta como swipe se o gesto for nitidamente horizontal,
   * pra não roubar o scroll vertical nem o clique de "VER TIME".
   */
  const swipeRef = useRef(null);
  function onSwipeStart(e) {
    swipeRef.current = { x: e.clientX, y: e.clientY };
  }
  function onSwipeEnd(e) {
    const s = swipeRef.current;
    swipeRef.current = null;
    if (!s) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.5) spinLeague(dx < 0 ? 1 : -1);
  }

  return (
    <section className="intro">
      <div className="intro-block">
        <div className="intro-eyebrow">{t("intro.howTitle")}</div>
        <ol className="how-steps">
          <li><Rich text={t("intro.step1")} /></li>
          <li><Rich text={t("intro.step2")} /></li>
          <li><Rich text={t("intro.stepItem")} /></li>
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

        {/* Área de swipe: arraste na horizontal pra trocar de liga (mobile). */}
        <div
          className="league-swipe"
          onPointerDown={onSwipeStart}
          onPointerUp={onSwipeEnd}
          onPointerCancel={() => (swipeRef.current = null)}
        >
          {/* Carrossel de ligas: escolhe qual Elite você vai escalar e enfrentar. */}
          <div className="league-carousel" role="group" aria-label={t("leagues.carouselAria")}>
            <button
              type="button"
              className="league-nav"
              onClick={() => spinLeague(-1)}
              aria-label={t("leagues.prevAria")}
              disabled={!multiLeague}
            >
              ‹
            </button>
            <span className="league-name">{t("leagues." + league.id + ".elite")}</span>
            <button
              type="button"
              className="league-nav"
              onClick={() => spinLeague(1)}
              aria-label={t("leagues.nextAria")}
              disabled={!multiLeague}
            >
              ›
            </button>
          </div>
          {multiLeague && (
            <div className="league-dots" aria-hidden="true">
              {leagues.map((l) => (
                <span key={l.id} className={"league-dot" + (l.id === league.id ? " on" : "")} />
              ))}
            </div>
          )}

          <div className="elite-lineup">
            {league.roster.map((tr, i) => {
              const open = openElite === i;
              return (
                <button
                  key={tr.name + i}
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
        </div>

        {openElite != null && (
          <div className="elite-team">
            {league.roster[openElite].team.map((m, j) => (
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
            onClick={() => choose("rocket")}
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
            onClick={() => choose("oak")}
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
