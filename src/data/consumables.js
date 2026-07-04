/**
 * consumables.js — o arsenal de consumíveis (itens) do jogo.
 *
 * Fonte ÚNICA dos itens (espelha o padrão de pool.js / elite.js). Ao fim do
 * draft o jogador escolhe 1 item dentre OPTIONS_PER_ROLL sorteados e o aplica a
 * 1 Pokémon do time — o efeito vale nas 5 batalhas da run.
 *
 * Cada item carrega:
 *  - `id`       — chave estável (também a chave do i18n: items.<id>.name/.desc).
 *  - `icon`     — GLIFO GEOMÉTRICO (não emoji, ver CLAUDE.md). Fallback textual;
 *                 hoje o ícone visível é a cápsula SVG (ver `ItemSprite` em bits.jsx).
 *  - `image`    — (opcional) caminho de uma SPRITE real relativa a public/ (ex.:
 *                 "items/potion.png"). Se presente, `ItemSprite` usa o <img> no
 *                 lugar da cápsula SVG. Drop-in: solte o PNG e aponte aqui.
 *  - `targeted` — se precisa escolher 1 mon (todos, por ora).
 *  - `evoOnly`  — (opcional) só entra no sorteio se o time tiver um mon que ainda
 *                 pode evoluir (Doce Raro). Ver `rollConsumables(seed,{canEvolve})`.
 *  - `evolves`  — (opcional) item INSTANTÂNEO: ao aplicar, evolui o mon-alvo em vez
 *                 de virar um buff de batalha (não tem `mod`; o App faz a troca).
 *  - `mod`      — COMO o item altera o "fighter" do alvo. É lido em battle.js
 *                 (toFighter + loop de turno). Chaves suportadas:
 *                   atkMul       — multiplica o ataque final.
 *                   hpMul        — multiplica o HP máximo (e enche o HP).
 *                   alwaysFirst  — o mon sempre age primeiro no turno.
 *                   dmgTakenMul  — multiplica o dano RECEBIDO (<1 = tanka mais).
 *                   critBonus    — soma à chance de crítico do mon (0.15 = +15%).
 *                   heal         — { threshold, frac }: 1×/batalha, ao cair
 *                                  abaixo de `threshold` (fração do HP máx),
 *                                  cura `frac` do HP máx.
 *  Itens SEM `mod` (ex.: Doce Raro) não deixam rastro na batalha (sem pin/selo).
 */
import { mulberry32, hashSeed } from "../engine/rng";

/** Quantas opções de item aparecem na etapa de escolha. */
export const OPTIONS_PER_ROLL = 3;

/** O arsenal. Adicionar item = só empurrar um objeto aqui (+ strings no i18n).
 *  `image`: sprites self-hosted em public/items/ (mesma origem de mons/treinadores,
 *  vindas do repo PokeAPI/sprites). O `icon` glifo fica de fallback. */
export const CONSUMABLES = [
  { id: "potion", icon: "✚", image: "items/potion.png", targeted: true, mod: { heal: { threshold: 0.2, frac: 0.35 } } },
  { id: "xspeed", icon: "»", image: "items/x-speed.png", targeted: true, mod: { alwaysFirst: true } },
  { id: "xattack", icon: "▲", image: "items/x-attack.png", targeted: true, mod: { atkMul: 1.25 } },
  { id: "xdefense", icon: "◆", image: "items/x-defense.png", targeted: true, mod: { dmgTakenMul: 0.8 } },
  { id: "scopelens", icon: "◎", image: "items/scope-lens.png", targeted: true, mod: { critBonus: 0.15 } },
  { id: "rarecandy", icon: "★", image: "items/rare-candy.png", targeted: true, evoOnly: true, evolves: true },
];

const BY_ID = Object.fromEntries(CONSUMABLES.map((c) => [c.id, c]));

/** Busca um item pelo id (ou null). */
export function getConsumable(id) {
  return BY_ID[id] ?? null;
}

/**
 * Sorteia N opções de item, determinístico por (seed, canEvolve). Usa um stream
 * de RNG PRÓPRIO (`item:<seed>`) para não colidir com o do draft. Itens `evoOnly`
 * (Doce Raro) só entram no pool se `canEvolve` — assim não aparecem quando não há
 * alvo válido. Fisher-Yates sobre a cópia do pool → sem repetição.
 */
export function rollConsumables(seed, { canEvolve = false, n = OPTIONS_PER_ROLL } = {}) {
  const rng = mulberry32(hashSeed(`item:${seed}`));
  const pool = CONSUMABLES.filter((c) => !c.evoOnly || canEvolve);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(n, pool.length));
}
