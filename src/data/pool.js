/**
 * pool.js — regras de sorteio do draft.
 *
 * Nada de listas de nomes hardcoded: o pool é DERIVADO do dataset.
 * TODOS os Pokémon do dataset (Gen 1–3, 386) entram no sorteio com peso igual —
 * inclusive não-evoluídos e fraquinhos (Charmander, Caterpie...). O que decide
 * se um azarão tem chance é o POTENCIAL sorteado por instância (ver battle.js).
 *
 * Desde a v0.4 o time é montado num DRAFT: 6 rodadas, 5 candidatos por
 * rodada, e o jogador escolhe 1 por rodada.
 */
import { allMons, getMon } from "./dex";
import { mulberry32, hashSeed } from "../engine/rng";

/** Pokémon lendários/míticos das Gen 1, 2 e 3 (ids da Pokédex nacional). */
const LEGENDARY_IDS = new Set([
  144, 145, 146, 150, 151, // Kanto
  243, 244, 245, 249, 250, 251, // Johto
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386, // Hoenn (Regis, Lati@s, Kyogre/Groudon/Rayquaza, Jirachi, Deoxys)
]);

/** Tamanho do time / número de rodadas do draft. */
export const TEAM_SIZE = 6;
/** Quantos candidatos aparecem por rodada do draft. */
export const CANDIDATES_PER_ROUND = 3;

/** Faixa do potencial sorteado por indivíduo (a "sorte" daquele bicho). */
export const POTENTIAL_MIN = 50;
export const POTENTIAL_MAX = 100;

/** Pool único: todos os Pokémon do dataset (386), peso igual. */
export const FULL_POOL = allMons();

/** Hidrata um Pokémon do pool com seu potencial e a flag de raro. */
function draw(rng) {
  const pick = FULL_POOL[Math.floor(rng() * FULL_POOL.length)];
  // Potencial: 50 = força canônica do dataset, 100 = indivíduo excepcional.
  const potential =
    POTENTIAL_MIN + Math.floor(rng() * (POTENTIAL_MAX - POTENTIAL_MIN + 1));
  return { ...pick, rare: LEGENDARY_IDS.has(pick.id), potential };
}

/**
 * Evolui um mon do time para a próxima forma (Doce Raro / Rare Candy),
 * PRESERVANDO a condição (potencial). Recalcula `rare` para o novo id (na
 * prática evoluções nunca são lendárias). Se o mon não evolui, devolve ele mesmo.
 */
export function evolveMon(mon) {
  if (mon.evolvesTo == null) return mon;
  const evo = getMon(mon.evolvesTo);
  return { ...evo, potential: mon.potential, rare: LEGENDARY_IDS.has(evo.id) };
}

/**
 * Sorteia os candidatos de UMA rodada do draft.
 *
 * Determinístico por (seed, rodada, nonce): o stream de RNG é fixo. O `nonce`
 * é o número de PULOS já gastos nessa rodada — incrementá-lo re-sorteia um
 * conjunto novo de candidatos. Os ids já escolhidos (`pickedIds`) são pulados,
 * para o time nunca repetir Pokémon.
 */
export function rollCandidates(seed, round, pickedIds = [], nonce = 0) {
  const rng = mulberry32(hashSeed(`draft:${seed}:${round}:${nonce}`));
  const used = new Set(pickedIds);
  const out = [];
  while (out.length < CANDIDATES_PER_ROUND) {
    const cand = draw(rng);
    if (used.has(cand.id)) continue;
    used.add(cand.id);
    out.push(cand);
  }
  return out;
}
