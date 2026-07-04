import { useEffect, useState } from "react";
import { getMon } from "../data/dex";
import { MODE_SPRITE } from "../data/modes";
import { Sprite, ItemSprite } from "./bits";
import { useT } from "../i18n";

/**
 * HowToPlay.jsx — o "COMO SE JOGA" da intro, como STORYBOARD ANIMADO inline.
 *
 * É o conteúdo principal do bloco (substitui a antiga lista de tópicos): uma
 * "telinha" no dialeto pixel/GBC que passa pelo fluxo da tela inicial —
 * oponente → modo → draft → item → ordem → desafiar. Animação nativa em CSS
 * (NÃO gif): leve, nítida no mobile e i18n. Autoavança (pausa no hover e quando
 * o usuário prefere menos movimento); dá pra navegar à mão (‹ › e pontinhos).
 *
 * Convenções (ver CLAUDE.md): ícones = glifos geométricos (▲ ↻ ▸ ★), NÃO emoji;
 * respeita prefers-reduced-motion (sem autoavanço e sem micro-animações).
 */

/** Passos do storyboard (na ordem do fluxo). Cada id casa com i18n intro.tutorial.steps.<id>. */
const STEPS = ["opponent", "mode", "draft", "item", "order", "start"];

/** Sprites de vitrine (iniciais de Kanto + Pikachu), resolvidos fora do render. */
const CANDS = [getMon(6), getMon(9), getMon(3)];
const TARGET = getMon(25);

/** true se o usuário pediu menos movimento (SO/nav). Desliga autoavanço + motion. */
function usePrefersReducedMotion() {
  const [reduce, setReduce] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener?.("change", sync);
    return () => mq.removeEventListener?.("change", sync);
  }, []);
  return reduce;
}

/** A "telinha" animada de cada passo. Ilustração abstrata, texto vem da legenda. */
function Scene({ id }) {
  const { t } = useT();
  switch (id) {
    case "opponent":
      return (
        <div className="htp-scene htp-opp">
          <div className="htp-carousel">
            <span className="htp-arrow a-l">‹</span>
            <div className="htp-reel">
              <div className="htp-reel-track">
                <span>{t("leagues.johto.region")}</span>
                <span>{t("leagues.kanto.region")}</span>
                <span>{t("leagues.hoenn.region")}</span>
                <span>{t("leagues.johto.region")}</span>
              </div>
            </div>
            <span className="htp-arrow a-r">›</span>
          </div>
          <div className="htp-dots3" aria-hidden="true"><i /><i /><i /></div>
        </div>
      );
    case "mode":
      return (
        <div className="htp-scene htp-mode">
          <div className="htp-mode-card m-a">
            <Sprite src={MODE_SPRITE.rocket} alt="" size={44} />
            <span>{t("intro.tutorial.modeRocket")}</span>
          </div>
          <div className="htp-mode-card m-b">
            <Sprite src={MODE_SPRITE.oak} alt="" size={44} />
            <span>{t("intro.tutorial.modeOak")}</span>
          </div>
        </div>
      );
    case "draft":
      return (
        <div className="htp-scene htp-draft">
          <div className="htp-cands">
            {CANDS.map((m, k) => (
              <div className={"htp-card" + (k === 1 ? " pick" : "")} key={k}>
                <Sprite src={m.image.sprite} alt="" size={38} />
              </div>
            ))}
            <span className="htp-cursor" aria-hidden="true">▲</span>
          </div>
          <span className="htp-skip">↻ {t("intro.tutorial.skip")}</span>
          <div className="htp-slots" aria-hidden="true">
            <i className="on" /><i className="on" /><i className="fill" /><i /><i /><i />
          </div>
        </div>
      );
    case "item":
      return (
        <div className="htp-scene htp-item">
          <div className="htp-items">
            <ItemSprite id="potion" size={30} />
            <span className="pick"><ItemSprite id="xattack" size={30} /></span>
            <ItemSprite id="xspeed" size={30} />
          </div>
          <span className="htp-arrow2" aria-hidden="true">▸</span>
          <div className="htp-card tgt">
            <Sprite src={TARGET.image.sprite} alt="" size={38} />
          </div>
        </div>
      );
    case "order":
      return (
        <div className="htp-scene htp-order">
          <div className="htp-row6">
            {[0, 1, 2, 3, 4, 5].map((k) => (
              <div className={"htp-mcard" + (k === 3 ? " move" : "")} key={k}>
                <span className="grip" aria-hidden="true">⠿</span>
              </div>
            ))}
          </div>
        </div>
      );
    case "start":
      return (
        <div className="htp-scene htp-start">
          <span className="htp-trophy" aria-hidden="true">★</span>
          <div className="htp-vs">
            <span className="you">{t("match.you")}</span>
            <span className="htp-vs-sep">{t("match.vs")}</span>
            <span className="foe">{t("roles.champion")}</span>
          </div>
          <span className="htp-go">{t("intro.tutorial.go")} ▸</span>
        </div>
      );
    default:
      return null;
  }
}

/**
 * O storyboard inline do "COMO SE JOGA": telinha animada + legenda + navegação.
 * É tudo que o bloco renderiza (o eyebrow "COMO SE JOGA" mora na Intro).
 */
export function HowToPlay() {
  const { t } = useT();
  const reduce = usePrefersReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // autoavanço — pausa no hover (pra dar tempo de ler) e quando o usuário
  // prefere menos movimento. Reinicia a cada passo, inclusive na navegação
  // manual (que também mexe em `i`).
  useEffect(() => {
    if (reduce || paused) return undefined;
    const id = setTimeout(() => setI((v) => (v + 1) % STEPS.length), 3800);
    return () => clearTimeout(id);
  }, [i, reduce, paused]);

  const step = STEPS[i];
  const go = (dir) => setI((v) => (v + dir + STEPS.length) % STEPS.length);

  return (
    <div
      className="htp"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <p className="htp-sub">{t("intro.tutorial.subtitle")}</p>

      <div className="htp-screen">
        <div className="htp-stage" key={step}>
          <Scene id={step} />
        </div>
      </div>

      <div className="htp-cap">
        <div className="htp-cap-t">{t("intro.tutorial.steps." + step + ".t")}</div>
        <div className="htp-cap-d">{t("intro.tutorial.steps." + step + ".d")}</div>
      </div>

      <div className="htp-nav">
        <button className="htp-navbtn" onClick={() => go(-1)} aria-label={t("intro.tutorial.prev")}>
          ‹
        </button>
        <div className="htp-nav-dots">
          {STEPS.map((s, k) => (
            <button
              key={s}
              className={"htp-nd" + (k === i ? " on" : "")}
              onClick={() => setI(k)}
              aria-label={t("intro.tutorial.dotAria", { n: k + 1 })}
              aria-current={k === i}
            />
          ))}
        </div>
        <button className="htp-navbtn" onClick={() => go(1)} aria-label={t("intro.tutorial.next")}>
          ›
        </button>
      </div>
    </div>
  );
}
