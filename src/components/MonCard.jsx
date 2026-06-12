import { TypeChip, Sprite } from "./bits";

/**
 * CONDIÇÃO — a "forma" do indivíduo (estilo Winning Eleven). O potencial (50–100)
 * continua existindo por trás para o cálculo, mas na tela vira uma faixa
 * qualitativa, para não condicionar o jogador a min-maxar o número.
 *
 * A seta é UM único triângulo (▲) girado por CSS — mesma forma para todas as
 * condições, só muda a direção. Padroniza o visual e evita o problema de ↑/↓
 * virarem emoji colorido no Windows.
 */
function condition(p) {
  if (p >= 90) return { label: "EXCELENTE", deg: 0, cls: "cond-exc" };
  if (p >= 80) return { label: "BOA", deg: 45, cls: "cond-boa" };
  if (p >= 70) return { label: "PADRÃO", deg: 90, cls: "cond-pad" };
  if (p >= 60) return { label: "REGULAR", deg: 135, cls: "cond-reg" };
  return { label: "RUIM", deg: 180, cls: "cond-ruim" };
}

/**
 * Carta do Pokémon sorteado.
 *
 * - `lens` controla o PODER: "rocket" revela (Equipe Rocket), "oak" oculta atrás
 *   de "?" (Professor Oak — teste de conhecimento). A CONDIÇÃO, por ser sorte
 *   aleatória e não conhecimento, fica sempre à mostra.
 * - Props de `drag*` habilitam a reordenação por arrastar e soltar, só presente
 *   na fase de reordenação (depois do draft). Sem elas, a carta é estática.
 * - `onPick` transforma a carta num candidato clicável do draft (escolher 1).
 */
export function MonCard({
  mon,
  lens = "rocket",
  slot,
  draggable = false,
  dragging = false,
  over = false,
  onDragStart,
  onDragEnter,
  onDrop,
  onDragEnd,
  onPick,
}) {
  const blind = lens === "oak";
  const pct = Math.min(1, Math.max(0, (mon.bst - 300) / 400));
  const cond = condition(mon.potential ?? 50);
  const pickable = typeof onPick === "function";

  const cls =
    "mon-card" +
    (mon.rare ? " rare" : "") +
    (draggable ? " grab" : "") +
    (dragging ? " dragging" : "") +
    (over ? " over" : "") +
    (pickable ? " pick" : "");

  return (
    <div
      className={cls}
      draggable={draggable || undefined}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={draggable ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
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
      {mon.rare && <span className="star">★ RARO</span>}
      <div className="mon-top">
        <Sprite src={mon.image.sprite} alt={mon.name} size={64} />
        <div className="mon-id">
          <span className="mon-dex">Nº {String(mon.id).padStart(3, "0")}</span>
          <div className="mon-name">{mon.name.toUpperCase()}</div>
          <div className="mon-types">
            {mon.types.map((t) => (
              <TypeChip key={t} t={t} />
            ))}
          </div>
        </div>
      </div>

      <div className="pow-row">
        <span className="pow-label">PODER</span>
        <div className="pow-rail">
          {!blind && (
            <div className="pow-fill" style={{ width: `${Math.round(pct * 100)}%` }} />
          )}
        </div>
        <span className="pow-num">{blind ? "?" : mon.bst}</span>
      </div>
      <div className="pow-row">
        <span className="pow-label">CONDIÇÃO</span>
        <span className={"cond " + cond.cls}>
          <span className="cond-arrow" style={{ transform: `rotate(${cond.deg}deg)` }}>
            ▲
          </span>
          {cond.label}
        </span>
      </div>

      {draggable && (
        <div className="reorder">
          <span className="grip" aria-hidden="true">⠿</span>
          <span className="ord-slot">{slot}ª VAGA · ARRASTE</span>
        </div>
      )}

      {pickable && <div className="pick-cta">▸ ESCOLHER</div>}
    </div>
  );
}
