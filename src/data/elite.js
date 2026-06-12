/**
 * elite.js — a Elite dos 4 de Johto + Campeão (Pokémon Gold/Silver).
 *
 * Cada Pokémon é referenciado pelo NÚMERO da Pokédex nacional e
 * hidratado a partir do dataset — nomes, tipos, stats e sprites
 * vêm todos do pokedex.json.
 */
import { getMon } from "./dex";

const slot = (id, lvl) => ({ ...getMon(id), lvl });

/** Sprites dos treinadores (artes Gold/Silver, self-hosted em public/trainers). */
const SPRITE_BASE = "/trainers";

/**
 * `buff` multiplica HP e ataque do time daquele treinador (ver battle.js).
 * Compensa o draft (o jogador monta um time bem mais forte que 6 sorteados).
 *
 * Os valores foram CALIBRADOS por Monte Carlo (sim.mjs) para achatar a curva:
 * a taxa de vitória do jogador cai de forma suave (Will ~84% → Lance ~45%),
 * com ~14% de campeões no bot esperto. Por isso são NÃO-monotônicos: o time do
 * Bruno é fraco (precisa de buff alto), o do Lance já é brutal (quase nenhum).
 * 1 = neutro. Recalibre rodando o sim se mudar times/níveis/draft.
 */
export const ELITE = [
  {
    name: "WILL",
    title: "ELITE 1",
    spec: "Psychic",
    buff: 1.11,
    sprite: `${SPRITE_BASE}/Spr_GS_Will.png`,
    team: [slot(178, 40), slot(124, 41), slot(103, 41), slot(80, 41), slot(178, 42)],
    // Xatu, Jynx, Exeggutor, Slowbro, Xatu
  },
  {
    name: "KOGA",
    title: "ELITE 2",
    spec: "Poison",
    buff: 1.34,
    sprite: `${SPRITE_BASE}/Spr_GS_Koga.png`,
    team: [slot(168, 40), slot(49, 41), slot(205, 43), slot(89, 42), slot(169, 44)],
    // Ariados, Venomoth, Forretress, Muk, Crobat
  },
  {
    name: "BRUNO",
    title: "ELITE 3",
    spec: "Fighting",
    buff: 1.67,
    sprite: `${SPRITE_BASE}/Spr_GS_Bruno.png`,
    team: [slot(237, 42), slot(106, 42), slot(107, 42), slot(95, 43), slot(68, 46)],
    // Hitmontop, Hitmonlee, Hitmonchan, Onix, Machamp
  },
  {
    name: "KAREN",
    title: "ELITE 4",
    spec: "Dark",
    buff: 1.31,
    sprite: `${SPRITE_BASE}/Spr_GS_Karen.png`,
    team: [slot(197, 42), slot(45, 42), slot(94, 45), slot(198, 44), slot(229, 47)],
    // Umbreon, Vileplume, Gengar, Murkrow, Houndoom
  },
  {
    name: "LANCE",
    title: "CAMPEÃO",
    spec: "Dragon",
    buff: 1.02,
    sprite: `${SPRITE_BASE}/Spr_GS_Lance.png`,
    team: [slot(130, 44), slot(149, 47), slot(149, 47), slot(142, 46), slot(6, 46), slot(149, 50)],
    // Gyarados, Dragonite, Dragonite, Aerodactyl, Charizard, Dragonite
  },
];
