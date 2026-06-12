import { TYPE_COLOR, TYPE_PT } from "../data/typeChart";

export function TypeChip({ t }) {
  return (
    <span className="chip" style={{ background: TYPE_COLOR[t] }}>
      {TYPE_PT[t]}
    </span>
  );
}

export function HPBar({ pct }) {
  const color = pct > 0.5 ? "var(--hpG)" : pct > 0.2 ? "var(--hpY)" : "var(--hpR)";
  return (
    <div className="hp-track">
      <span className="hp-label">HP</span>
      <div className="hp-rail">
        <div
          className="hp-fill"
          style={{ width: `${Math.round(pct * 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

/** Pokébola da bandeja de status: cheia = Pokémon vivo, X = eliminado. */
export function Pokeball({ fainted = false }) {
  if (fainted) {
    return (
      <svg className="pball faint" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <circle cx="8" cy="8" r="6.4" fill="none" stroke="currentColor" strokeWidth="1.5" />
        <line x1="5" y1="5" x2="11" y2="11" stroke="currentColor" strokeWidth="1.6" />
        <line x1="11" y1="5" x2="5" y2="11" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    );
  }
  return (
    <svg className="pball" viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <circle cx="8" cy="8" r="6.4" fill="#f3e9cf" stroke="#16122b" strokeWidth="1.4" />
      <path d="M1.6 8 a6.4 6.4 0 0 1 12.8 0 z" fill="#e85145" />
      <line x1="1.6" y1="8" x2="14.4" y2="8" stroke="#16122b" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2" fill="#f3e9cf" stroke="#16122b" strokeWidth="1.3" />
    </svg>
  );
}

/** Fileira de Pokébolas: `fainted` últimas aparecem como eliminadas (X). */
export function BallTray({ total, fainted = 0, className = "" }) {
  return (
    <span className={"ball-tray " + className}>
      {Array.from({ length: total }).map((_, i) => (
        <Pokeball key={i} fainted={i >= total - fainted} />
      ))}
    </span>
  );
}

/** Sprite pixelado do dataset, com fallback silencioso. */
export function Sprite({ src, alt, size = 56, className = "" }) {
  if (!src) return <span className={"sprite-fallback " + className} style={{ width: size, height: size }} />;
  return (
    <img
      className={"sprite " + className}
      src={src}
      alt={alt}
      width={size}
      height={size}
      loading="lazy"
      draggable={false}
    />
  );
}
