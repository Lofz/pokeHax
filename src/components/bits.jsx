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
