/** Peças visuais compartilhadas do modo competitivo. */
import { Sprite, TypeChip } from "../bits";

/** Selo da divisão (Liga Poké → Liga Lendária), na cor da liga. */
export function LeagueBadge({ league, small = false }) {
  return (
    <span
      className={"league-badge" + (small ? " small" : "")}
      style={{ borderColor: league.color, color: league.color }}
    >
      {league.name}
    </span>
  );
}

/** Variação de pontos com sinal e cor (+18 dourado / −12 vermelho). */
export function Delta({ value }) {
  return (
    <span className={"delta " + (value >= 0 ? "delta-pos" : "delta-neg")}>
      {value >= 0 ? `+${value}` : `−${Math.abs(value)}`}
    </span>
  );
}

/**
 * Vitrine pública de uma equipe (regra 4): sprite, nome e tipos de cada um
 * dos 6 — SEM condição/potencial, que é segredo do dono.
 */
export function TeamPeek({ team }) {
  return (
    <div className="team-peek">
      {team.map((m, i) => (
        <div className="peek-mon" key={m.id + "-" + i} title={m.types.join(" / ")}>
          <Sprite src={m.image.sprite} alt={m.name} size={44} />
          <span className="peek-name">{m.name.toUpperCase()}</span>
          <span className="peek-types">
            {m.types.map((t) => (
              <TypeChip key={t} t={t} />
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}
