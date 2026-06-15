import { Sprite, HPBar, BallTray } from "./bits";
import { TEAM_SIZE } from "../data/pool";
import { useT } from "../i18n";

export function Bench({ team }) {
  return (
    <div className="bench">
      {team.map((m, i) => (
        <span className="bench-mon" key={m.id + "-" + i} title={m.name}>
          <Sprite src={m.image.sprite} alt={m.name} size={34} />
          <span className="bench-name">{m.name.toUpperCase()}</span>
        </span>
      ))}
    </div>
  );
}

/**
 * Arena viva — moldura de diálogo do Game Boy, na orientação autêntica de
 * batalha: VOCÊ à ESQUERDA e a Elite à DIREITA. As bandejas de Pokébolas ficam
 * acima de cada Pokémon, no estilo do jogo padrão.
 */
export function Arena({ snap, feed, enemyTotal }) {
  const { t } = useT();
  const [enemyKO, yourKO] = snap.score; // inimigos derrubados / seus caídos
  return (
    <div className="arena">
      <div className="duel">
        <div className="fighter side-left">
          <BallTray total={TEAM_SIZE} fainted={yourKO} className="you" />
          <div className="f-head">
            <Sprite src={snap.pImg} alt={snap.pName} size={52} className="flip" />
            <div className="f-name you">{snap.pName.toUpperCase()}</div>
          </div>
          <HPBar pct={snap.php} />
        </div>

        <div className="vs-pix">VS</div>

        <div className="fighter side-right">
          <BallTray total={enemyTotal} fainted={enemyKO} className="foe" />
          <div className="f-head">
            <div className="f-name foe">{snap.eName.toUpperCase()}</div>
            <Sprite src={snap.eImg} alt={snap.eName} size={52} />
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
