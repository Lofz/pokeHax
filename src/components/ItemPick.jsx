import { Sprite, ItemSprite } from "./bits";
import { useT } from "../i18n";

/**
 * ItemPick — o CORPO da etapa de consumível (entre montar o time e reordenar).
 * O cabeçalho (chip de modo + dica) fica no App; aqui só a escolha.
 *
 * Dois passos, controlados pelo App via `pending`:
 *  1. Sem `pending`: grid de opções sorteadas; clicar escolhe o item.
 *  2. Com `pending`: escolhe em QUAL Pokémon aplicar (ou volta em "trocar item").
 *
 * Determinístico: as `options` vêm de rollConsumables(seed) no App. O efeito de
 * cada item vive em consumables.js/battle.js; aqui é só a UI de escolha.
 */
export function ItemPick({ options, team, pending, onPick, onAssign, onCancel }) {
  const { t } = useT();

  // Passo 2 — escolher o alvo do item já selecionado.
  if (pending) {
    return (
      <>
        <div className={"item-chosen item-" + pending}>
          <ItemSprite id={pending} size={22} />
          {t("items." + pending + ".name")}
        </div>
        <div className="target-grid">
          {team.map((m) => (
            <button
              key={m.id}
              type="button"
              className="target-mon"
              onClick={() => onAssign(m.id)}
            >
              <Sprite src={m.image.sprite} alt={m.name} size={56} />
              <span className="target-name">{m.name.toUpperCase()}</span>
              <span className="target-cta">{t("items.applyCta")}</span>
            </button>
          ))}
        </div>
        <div className="btn-row">
          <button type="button" className="btn btn-ghost small" onClick={onCancel}>
            {t("items.swap")}
          </button>
        </div>
      </>
    );
  }

  // Passo 1 — escolher 1 item dentre as opções.
  return (
    <div className="item-grid">
      {options.map((it) => (
        <button
          key={it.id}
          type="button"
          className={"item-card item-" + it.id}
          onClick={() => onPick(it.id)}
        >
          <span className="item-emblem"><ItemSprite id={it.id} size={42} /></span>
          <span className="item-name">{t("items." + it.id + ".name")}</span>
          <span className="item-desc">{t("items." + it.id + ".desc")}</span>
          <span className="pick-cta">{t("items.pickCta")}</span>
        </button>
      ))}
    </div>
  );
}
