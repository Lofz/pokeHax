/**
 * modes.js — identidade visual dos dois modos de jogo.
 *
 * O sprite do modo é também o avatar "VOCÊ" na arena de batalha: em Equipe
 * Rocket você é o Giovanni; em Professor Oak, o Oak. (Arte FRLG, em public/trainers.)
 */
// BASE_URL respeita o subcaminho do deploy (ex: /pokeHax/) — ver vite.config.
const B = import.meta.env.BASE_URL;
export const MODE_SPRITE = {
  rocket: B + "trainers/Spr_FRLG_Giovanni.png",
  oak: B + "trainers/Spr_FRLG_Oak.png",
};
