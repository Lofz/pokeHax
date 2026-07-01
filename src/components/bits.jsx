import { TYPE_COLOR } from "../data/typeChart";
import { getConsumable } from "../data/consumables";
import { useT } from "../i18n";

export function TypeChip({ t: type }) {
  const { t } = useT();
  return (
    <span className="chip" style={{ background: TYPE_COLOR[type] }}>
      {t("types." + type)}
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

/**
 * Ícone do consumível: uma "cápsula" (estilo dos itens X / poção) desenhada em
 * SVG e tingida pela cor de acento do item (`--item-acc`, definido por `.item-<id>`).
 * Vetor (não pixelado), no mesmo espírito da Pokébola em SVG.
 *
 * DROP-IN de sprite real: se o item tiver `image` (ver consumables.js), renderiza
 * um <img> em vez do vetor — é só soltar o PNG em public/items/ e setar o campo.
 */
export function ItemSprite({ id, size = 32, className = "" }) {
  const it = getConsumable(id);
  if (!it) return null;
  const cls = "item-capsule item-" + id + (className ? " " + className : "");
  if (it.image) {
    return (
      <img
        className={cls}
        src={import.meta.env.BASE_URL + it.image}
        alt=""
        width={size}
        height={size}
        draggable={false}
      />
    );
  }
  return (
    <svg className={cls} viewBox="0 0 32 32" width={size} height={size} aria-hidden="true">
      <g transform="rotate(-22 16 16)">
        <rect x="10" y="4" width="12" height="24" rx="6" fill="currentColor" stroke="#16122b" strokeWidth="2" />
        <path d="M10 10 a6 6 0 0 1 12 0 v5 h-12 z" fill="#f3e9cf" opacity="0.5" />
        <rect x="9" y="14" width="14" height="2.8" rx="1.4" fill="#16122b" />
        <rect x="12.2" y="7" width="2.3" height="16" rx="1.15" fill="#ffffff" opacity="0.7" />
      </g>
    </svg>
  );
}

/**
 * Sprite pixelado, com fallback silencioso. Extras (usados no Hall da Fama):
 *  - `fallbackSrc`: se a imagem principal falhar, troca 1× por ela (ex.:
 *    thumbnail do CDN → sprite local same-origin). Nunca fica quebrado.
 *  - `crossOrigin`: deixa a imagem "limpa" pro canvas do compartilhar (toPng).
 */
export function Sprite({ src, alt, size = 56, className = "", fallbackSrc, crossOrigin }) {
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
      crossOrigin={crossOrigin}
      onError={(e) => {
        const img = e.currentTarget;
        if (fallbackSrc && img.dataset.fb !== "1") {
          img.dataset.fb = "1";
          img.src = fallbackSrc;
        }
      }}
    />
  );
}
