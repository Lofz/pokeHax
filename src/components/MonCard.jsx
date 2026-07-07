import { TypeChip, Sprite, ItemSprite } from "./bits";
import { useT } from "../i18n";

/**
 * CONDIÇÃO — a "forma" do indivíduo (estilo Winning Eleven). O potencial (50–100)
 * continua existindo por trás para o cálculo, mas na tela vira uma faixa
 * qualitativa, para não condicionar o jogador a min-maxar o número.
 *
 * A seta é UM único triângulo (▲) girado por CSS — mesma forma para todas as
 * condições, só muda a direção. Padroniza o visual e evita o problema de ↑/↓
 * virarem emoji colorido no Windows. O rótulo vem do i18n (`key`).
 *
 * LENDÁRIO: todo lendário (`rare`) tem a condição própria, acima de EXCELENTE —
 * asterisco de 8 pontas (❋, glifo de texto, não emoji) + rótulo arco-íris.
 * A aura animada da carta fica no CSS (.mon-card.rare).
 */
function condition(p, rare) {
  if (rare) return { key: "len", cls: "cond-len", legend: true };
  if (p >= 90) return { key: "exc", deg: 0, cls: "cond-exc" };
  if (p >= 80) return { key: "boa", deg: 45, cls: "cond-boa" };
  if (p >= 70) return { key: "pad", deg: 90, cls: "cond-pad" };
  if (p >= 60) return { key: "reg", deg: 135, cls: "cond-reg" };
  return { key: "ruim", deg: 180, cls: "cond-ruim" };
}

/**
 * Carta do Pokémon sorteado.
 *
 * - `lens` controla o PODER: "rocket" revela (Equipe Rocket), "oak" oculta atrás
 *   de "?" (Professor Oak — teste de conhecimento). A CONDIÇÃO, por ser sorte
 *   aleatória e não conhecimento, fica sempre à mostra.
 * - `draggable` mostra a alça de reordenação (rodapé). O arrasto usa Pointer
 *   Events (mouse + TOQUE) → funciona em desktop E mobile/iOS. A alça só dispara
 *   `onDragStart` (pointerdown); o move/fim ficam no container do grid, que é
 *   estável (a captura do ponteiro não se perde quando as cartas reordenam).
 * - `onPick` transforma a carta num candidato clicável do draft (escolher 1).
 */
export function MonCard({
  mon,
  lens = "rocket",
  slot,
  draggable = false,
  dragging = false,
  onDragStart,
  onPick,
  itemBadge = null,
}) {
  const { t } = useT();
  const blind = lens === "oak";
  const pct = Math.min(1, Math.max(0, (mon.bst - 300) / 400));
  const cond = condition(mon.potential ?? 50, !!mon.rare);
  const pickable = typeof onPick === "function";

  const cls =
    "mon-card" +
    (mon.rare ? " rare" : "") +
    (dragging ? " dragging" : "") +
    (pickable ? " pick" : "") +
    // selo (acento) sempre; heartbeat só se o item for um BUFF de batalha (tem mod)
    (itemBadge ? " item-" + itemBadge.id + (itemBadge.mod ? " has-item" : "") : "");

  return (
    <div
      className={cls}
      data-mon-id={draggable ? mon.id : undefined}
      onClick={pickable ? onPick : undefined}
      role={pickable ? "button" : undefined}
      tabIndex={pickable ? 0 : undefined}
      onKeyDown={
        pickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onPick();
              }
            }
          : undefined
      }
    >
      {itemBadge && (
        <span className={"item-badge item-" + itemBadge.id} title={t("items." + itemBadge.id + ".name")}>
          <ItemSprite id={itemBadge.id} size={14} />
          {t("items." + itemBadge.id + ".name")}
        </span>
      )}
      <div className="mon-top">
        <Sprite src={mon.image.sprite} alt={mon.name} size={64} />
        <div className="mon-id">
          <span className="mon-dex">
            {t("card.dexNo")} {String(mon.id).padStart(3, "0")}
          </span>
          <div className="mon-name">{mon.name.toUpperCase()}</div>
          <div className="mon-types">
            {mon.types.map((t) => (
              <TypeChip key={t} t={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="pow-row">
        <span className="pow-label">{t("card.power")}</span>
        <div className="pow-rail">
          {!blind && (
            <div className="pow-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
          )}
        </div>
        <span className="pow-num">{blind ? "?" : mon.bst}</span>
      </div>
      <div className="pow-row">
        <span className="pow-label">{t("card.condition")}</span>
        <span className={"cond " + cond.cls}>
          {cond.legend ? (
            <span className="cond-aster">❋</span>
          ) : (
            <span className="cond-arrow" style={{ transform: `rotate(${cond.deg}deg)` }}>
              ▲
            </span>
          )}
          {t("card.cond." + cond.key)}
        </span>
      </div>

      {draggable && (
        <div
          className="reorder"
          aria-label={t("card.slotAria", { n: slot })}
          onPointerDown={onDragStart}
        >
          <span className="grip" aria-hidden="true">⠿</span>
          <span className="ord-slot">{t("card.slotDrag", { n: slot })}</span>
        </div>
      )}

      {pickable && <div className="pick-cta">{t("card.choose")}</div>}
    </div>
  );
}
