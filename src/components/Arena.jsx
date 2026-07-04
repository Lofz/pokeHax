import { useState, useEffect } from "react";
import { Sprite, HPBar, BallTray, ItemSprite, Pokeball } from "./bits";
import { TEAM_SIZE } from "../data/pool";
import { getConsumable } from "../data/consumables";
import { useT } from "../i18n";

export function Bench({ team, consumable }) {
  return (
    <div className="bench">
      {team.map((m, i) => {
        const item =
          consumable && consumable.target === m.id ? getConsumable(consumable.id) : null;
        return (
          <span className="bench-mon" key={m.id + "-" + i} title={m.name}>
            <Sprite src={m.image.sprite} alt={m.name} size={34} />
            <span className="bench-name">{m.name.toUpperCase()}</span>
            {item?.mod && <ItemSprite id={item.id} size={16} className="bench-item" />}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Arena viva — moldura de diálogo do Game Boy, na orientação autêntica de
 * batalha: VOCÊ à ESQUERDA e a Elite à DIREITA. As bandejas de Pokébolas ficam
 * acima de cada Pokémon, no estilo do jogo padrão.
 *
 * FX: cada snapshot do motor é um "ato" (contador fxs.n). O número entra nas
 * keys dos elementos de efeito → o React remonta → o @keyframes re-executa.
 * Só momentos de CENA animam: entrada (Pokébola + materialização, em `send`),
 * K.O. (recall, em `faint`), cura da Poção e o idle bob. Golpes de turno NÃO
 * animam de propósito — testamos lunge/blink/impacto e, no ritmo do playback,
 * ficou exagerado. A cadência vem da CSS var --tick (= tick do playback; ver
 * App), então o modo rápido comprime as animações junto.
 */
export function Arena({ snap, feed, enemyTotal, consumable, tickMs = 360 }) {
  const { t } = useT();
  const [enemyKO, yourKO] = snap.score; // inimigos derrubados / seus caídos

  // PIN de buff: aparece quando o mon ATIVO do jogador é o alvo do consumível.
  const buff =
    consumable && snap.pId != null && snap.pId === consumable.target
      ? getConsumable(consumable.id)
      : null;

  // Contadores de FX: heal só incrementa quando o motor marca fx:"heal".
  const [fxs, setFxs] = useState({ n: 0, heal: 0 });
  useEffect(() => {
    if (!snap) return;
    setFxs((f) => ({ n: f.n + 1, heal: snap.fx === "heal" ? f.heal + 1 : f.heal }));
  }, [snap]);

  /** Animação de cena de um lado ("p" = você, "e" = Elite) neste ato. */
  const actFor = (me) => {
    if (snap.k === "faint") return snap.side === me ? "act-faint" : "";
    if (snap.k === "send")
      return snap.side === me || snap.side === "both" ? "act-enter" : "";
    return "";
  };

  const renderSlot = (me, img, name, spriteCls) => {
    const act = actFor(me);
    return (
      <span className={"mon-slot" + (act ? " " + act : "")}>
        <Sprite src={img} alt={name} size={52} className={spriteCls} />
        {act === "act-enter" && (
          <span key={"ball" + fxs.n} className="fx-ball" aria-hidden="true">
            <Pokeball />
          </span>
        )}
        {me === "p" && fxs.heal > 0 && (
          <span key={"heal" + fxs.heal} className="fx-heal-burst" aria-hidden="true">
            <i className="glow" />
            <i>＋</i>
            <i>＋</i>
            <i>＋</i>
          </span>
        )}
      </span>
    );
  };

  return (
    <div className="arena" style={{ "--tick": tickMs + "ms" }}>
      <div className="duel">
        <div className="fighter side-left">
          <BallTray total={TEAM_SIZE} fainted={yourKO} className="you" />
          <div className="f-head">
            {renderSlot("p", snap.pImg, snap.pName, "flip")}
            <div className="f-name you">{snap.pName.toUpperCase()}</div>
            {buff?.mod && (
              <span className={"arena-pin item-" + buff.id}>
                <ItemSprite id={buff.id} size={13} />
                {t("items." + buff.id + ".name")}
              </span>
            )}
          </div>
          <HPBar pct={snap.php} />
        </div>

        <div className="vs-pix">VS</div>

        <div className="fighter side-right">
          <BallTray total={enemyTotal} fainted={enemyKO} className="foe" />
          <div className="f-head">
            <div className="f-name foe">{snap.eName.toUpperCase()}</div>
            {renderSlot("e", snap.eImg, snap.eName, "")}
          </div>
          <HPBar pct={snap.ehp} />
        </div>
      </div>
      <div className="feed">
        {feed.length === 0 && (
          <div className="feed-line info">
            <span className="f-turn">1'</span>
            <span className="f-dot">›</span>
            <span>{t("feed.start")}</span>
          </div>
        )}
        {feed.slice(-7).map((f, j) => (
          <div key={j} className={"feed-line " + f.kind}>
            <span className="f-turn">{f.turn}'</span>
            <span className="f-dot">
              {f.kind === "ko-enemy" ? "◓" : f.kind === "ko-player" ? "✕" : "›"}
            </span>
            <span>{f.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
