/**
 * typeChart.js — tabela de efetividade da Gen 2, cores oficiais
 * aproximadas de cada tipo e nomes em português.
 */

export const TYPE_PT = {
  Normal: "Normal", Fire: "Fogo", Water: "Água", Electric: "Elétrico", Grass: "Planta",
  Ice: "Gelo", Fighting: "Lutador", Poison: "Veneno", Ground: "Terra", Flying: "Voador",
  Psychic: "Psíquico", Bug: "Inseto", Rock: "Pedra", Ghost: "Fantasma", Dragon: "Dragão",
  Dark: "Sombrio", Steel: "Aço", Fairy: "Fada",
};

export const TYPE_COLOR = {
  Normal: "#a8a090", Fire: "#f08030", Water: "#6890f0", Electric: "#f8d030", Grass: "#78c850",
  Ice: "#98d8d8", Fighting: "#c03028", Poison: "#a86ab8", Ground: "#e0c068", Flying: "#a890f0",
  Psychic: "#f85888", Bug: "#a8b820", Rock: "#b8a038", Ghost: "#705898", Dragon: "#7038f8",
  Dark: "#6f5848", Steel: "#b8b8d0", Fairy: "#ee99ac",
};

const CHART = {
  Normal:   { x2: [], x05: ["Rock", "Steel"], x0: ["Ghost"] },
  Fire:     { x2: ["Grass", "Ice", "Bug", "Steel"], x05: ["Fire", "Water", "Rock", "Dragon"], x0: [] },
  Water:    { x2: ["Fire", "Ground", "Rock"], x05: ["Water", "Grass", "Dragon"], x0: [] },
  Electric: { x2: ["Water", "Flying"], x05: ["Electric", "Grass", "Dragon"], x0: ["Ground"] },
  Grass:    { x2: ["Water", "Ground", "Rock"], x05: ["Fire", "Grass", "Poison", "Flying", "Bug", "Dragon", "Steel"], x0: [] },
  Ice:      { x2: ["Grass", "Ground", "Flying", "Dragon"], x05: ["Fire", "Water", "Ice", "Steel"], x0: [] },
  Fighting: { x2: ["Normal", "Ice", "Rock", "Dark", "Steel"], x05: ["Poison", "Flying", "Psychic", "Bug", "Fairy"], x0: ["Ghost"] },
  Poison:   { x2: ["Grass", "Fairy"], x05: ["Poison", "Ground", "Rock", "Ghost"], x0: ["Steel"] },
  Ground:   { x2: ["Fire", "Electric", "Poison", "Rock", "Steel"], x05: ["Grass", "Bug"], x0: ["Flying"] },
  Flying:   { x2: ["Grass", "Fighting", "Bug"], x05: ["Electric", "Rock", "Steel"], x0: [] },
  Psychic:  { x2: ["Fighting", "Poison"], x05: ["Psychic", "Steel"], x0: ["Dark"] },
  Bug:      { x2: ["Grass", "Psychic", "Dark"], x05: ["Fire", "Fighting", "Poison", "Flying", "Ghost", "Steel", "Fairy"], x0: [] },
  Rock:     { x2: ["Fire", "Ice", "Flying", "Bug"], x05: ["Fighting", "Ground", "Steel"], x0: [] },
  Ghost:    { x2: ["Psychic", "Ghost"], x05: ["Dark", "Steel"], x0: ["Normal"] },
  Dragon:   { x2: ["Dragon"], x05: ["Steel"], x0: ["Fairy"] },
  Dark:     { x2: ["Psychic", "Ghost"], x05: ["Fighting", "Dark", "Steel", "Fairy"], x0: [] },
  Steel:    { x2: ["Ice", "Rock", "Fairy"], x05: ["Fire", "Water", "Electric", "Steel"], x0: [] },
  Fairy:    { x2: ["Fighting", "Dragon", "Dark"], x05: ["Fire", "Poison", "Steel"], x0: [] },
};

/** Multiplicador de um tipo de ataque contra a combinação defensiva. */
export function effOne(atkType, defTypes) {
  let m = 1;
  for (const d of defTypes) {
    if (CHART[atkType].x0.includes(d)) m *= 0;
    else if (CHART[atkType].x2.includes(d)) m *= 2;
    else if (CHART[atkType].x05.includes(d)) m *= 0.5;
  }
  return m;
}

/** Melhor multiplicador entre os tipos do atacante (STAB simplificado). */
export function bestEff(atkTypes, defTypes) {
  return Math.max(...atkTypes.map((t) => effOne(t, defTypes)));
}
