/**
 * ranking.js — a Liga Pokémon: pontuação Elo + divisões.
 *
 * Elo clássico com K fixo. A fórmula já entrega exatamente o balanceamento
 * pedido: vencer alguém de rating maior rende MAIS pontos; vencer alguém
 * abaixo rende menos; perder para alguém abaixo dói mais; perder para alguém
 * acima dói menos. Tudo numa conta só.
 */

export const START_RATING = 1000;
const K = 32;

/** Divisões da Liga, da base ao topo (min = rating de entrada). */
export const LEAGUES = [
  { id: "poke",     name: "LIGA POKÉ",     min: 0,    color: "#e85145" },
  { id: "grande",   name: "LIGA GRANDE",   min: 1000, color: "#4f8fe0" },
  { id: "ultra",    name: "LIGA ULTRA",    min: 1200, color: "#f2b63d" },
  { id: "master",   name: "LIGA MASTER",   min: 1400, color: "#b06ae0" },
  { id: "lendaria", name: "LIGA LENDÁRIA", min: 1600, color: "#7de8d8" },
];

/** Divisão correspondente a um rating. */
export function leagueOf(rating) {
  let league = LEAGUES[0];
  for (const l of LEAGUES) if (rating >= l.min) league = l;
  return league;
}

/**
 * Variação de pontos do INICIADOR da partida (regra 6: o desafiado não pontua).
 * Garante magnitude mínima de 1 para o resultado nunca "não valer nada".
 */
export function eloDelta(myRating, oppRating, win) {
  const expected = 1 / (1 + 10 ** ((oppRating - myRating) / 400));
  const delta = Math.round(K * ((win ? 1 : 0) - expected));
  return win ? Math.max(1, delta) : Math.min(-1, delta);
}

/** Projeção exibida antes de desafiar: "vitória +X / derrota −Y". */
export function projectDeltas(myRating, oppRating) {
  return {
    win: eloDelta(myRating, oppRating, true),
    loss: eloDelta(myRating, oppRating, false),
  };
}
