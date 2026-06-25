/**
 * elite.js — as Ligas enfrentáveis (Elite dos 4 + Campeão de cada região).
 *
 * Antes era um único array `ELITE` (só Johto). Agora é um REGISTRO de ligas
 * (`LEAGUES`), pensado para o carrossel de adversários: cada liga é um objeto
 * autocontido com seu próprio roster e nível do jogador. Adicionar uma região
 * = adicionar um objeto aqui (sem feature toggle espalhado pelo código).
 *
 * Cada Pokémon é referenciado pelo NÚMERO da Pokédex nacional e hidratado a
 * partir do dataset — nomes, tipos, stats e sprites vêm todos do pokedex.json.
 */
import { getMon } from "./dex";

const slot = (id, lvl) => ({ ...getMon(id), lvl });

/** Sprites dos treinadores (self-hosted em public/trainers).
 *  BASE_URL respeita o subcaminho do deploy (ex: /pokeHax/) — ver vite.config. */
const SPRITE_BASE = import.meta.env.BASE_URL + "trainers";

/**
 * `buff` multiplica HP e ataque do time daquele treinador (ver battle.js).
 * Compensa o draft (o jogador monta um time bem mais forte que 6 sorteados).
 *
 * IMPORTANTE: `playerLvl` (por liga) E `buff` (por treinador) AFETAM o
 * equilíbrio. Player e inimigo têm níveis DIFERENTES, então os fatores de nível
 * NÃO se cancelam — a vantagem do player escala ~quadraticamente com a razão de
 * níveis. O ajuste fino do dia a dia é o `buff`; recalibre rodando o sim
 * (sim.mjs), que usa o `playerLvl` certo de cada liga.
 */

/* ──────────────────────────────────────────────────────────────────────────
 * JOHTO — Elite dos 4 + Campeão (Pokémon Gold/Silver).
 *
 * Buffs CALIBRADOS por Monte Carlo (sim.mjs) para achatar a curva: a taxa de
 * vitória cai de forma suave (Will ~84% → Lance ~45%), com ~14% de campeões no
 * bot esperto. São NÃO-monotônicos de propósito: o time do Bruno é fraco
 * (precisa de buff alto), o do Lance já é brutal (quase nenhum). 1 = neutro.
 * ────────────────────────────────────────────────────────────────────────── */
const JOHTO = [
  {
    name: "WILL",
    title: "ELITE 1",
    spec: "Psychic",
    buff: 1.12,
    sprite: `${SPRITE_BASE}/Spr_GS_Will.png`,
    team: [slot(178, 40), slot(124, 41), slot(103, 41), slot(80, 41), slot(178, 42)],
    // Xatu, Jynx, Exeggutor, Slowbro, Xatu
  },
  {
    name: "KOGA",
    title: "ELITE 2",
    spec: "Poison",
    buff: 1.32,
    sprite: `${SPRITE_BASE}/Spr_GS_Koga.png`,
    team: [slot(168, 40), slot(49, 41), slot(205, 43), slot(89, 42), slot(169, 44)],
    // Ariados, Venomoth, Forretress, Muk, Crobat
  },
  {
    name: "BRUNO",
    title: "ELITE 3",
    spec: "Fighting",
    buff: 1.64,
    sprite: `${SPRITE_BASE}/Spr_GS_Bruno.png`,
    team: [slot(237, 42), slot(106, 42), slot(107, 42), slot(95, 43), slot(68, 46)],
    // Hitmontop, Hitmonlee, Hitmonchan, Onix, Machamp
  },
  {
    name: "KAREN",
    title: "ELITE 4",
    spec: "Dark",
    buff: 1.33,
    sprite: `${SPRITE_BASE}/Spr_GS_Karen.png`,
    team: [slot(197, 42), slot(45, 42), slot(94, 45), slot(198, 44), slot(229, 47)],
    // Umbreon, Vileplume, Gengar, Murkrow, Houndoom
  },
  {
    name: "LANCE",
    title: "ELITE 5",
    champion: true, // flag estável; o rótulo exibido vem do i18n (roles.champion)
    spec: "Dragon",
    buff: 1.05,
    sprite: `${SPRITE_BASE}/Spr_GS_Lance.png`,
    team: [slot(130, 44), slot(149, 47), slot(149, 47), slot(142, 46), slot(6, 46), slot(149, 50)],
    // Gyarados, Dragonite, Dragonite, Aerodactyl, Charizard, Dragonite
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * KANTO — Elite dos 4 + Campeão (Pokémon Red/Blue/Yellow · FireRed/LeafGreen).
 *
 * Arte dos treinadores em estilo FRLG (Bruno e Lance reaparecem aqui, com a
 * arte FRLG própria — distinta da GSC usada em Johto). Os mons são todos da
 * Gen 1, então NÃO mexem na pool do draft.
 *
 * Buffs CALIBRADOS por Monte Carlo (sim.mjs) com player lvl 58 — alvo ~14% de
 * campeão no bot esperto, a mesma régua do Johto. A curva é suave: Lorelei
 * ~85% de passagem → Blue (Campeão) ~42%, a parede final. Não-monotônicos de
 * propósito (Bruno luta → buff alto). Recalibre se mudar times/níveis/draft.
 * ────────────────────────────────────────────────────────────────────────── */
const KANTO = [
  {
    name: "LORELEI",
    title: "ELITE 1",
    spec: "Ice",
    buff: 1.16,
    sprite: `${SPRITE_BASE}/Spr_FRLG_Lorelei.png`,
    team: [slot(87, 52), slot(91, 51), slot(80, 52), slot(124, 54), slot(131, 54)],
    // Dewgong, Cloyster, Slowbro, Jynx, Lapras
  },
  {
    name: "BRUNO",
    title: "ELITE 2",
    spec: "Fighting",
    buff: 1.59,
    sprite: `${SPRITE_BASE}/Spr_FRLG_Bruno.png`,
    team: [slot(95, 51), slot(107, 53), slot(106, 53), slot(95, 54), slot(68, 56)],
    // Onix, Hitmonchan, Hitmonlee, Onix, Machamp
  },
  {
    name: "AGATHA",
    title: "ELITE 3",
    spec: "Ghost",
    buff: 1.32,
    sprite: `${SPRITE_BASE}/Spr_FRLG_Agatha.png`,
    team: [slot(94, 53), slot(42, 54), slot(93, 53), slot(24, 56), slot(94, 58)],
    // Gengar, Golbat, Haunter, Arbok, Gengar
  },
  {
    name: "LANCE",
    title: "ELITE 4",
    spec: "Dragon",
    buff: 1.18,
    sprite: `${SPRITE_BASE}/Spr_FRLG_Lance.png`,
    team: [slot(130, 56), slot(148, 54), slot(148, 54), slot(142, 58), slot(149, 60)],
    // Gyarados, Dragonair, Dragonair, Aerodactyl, Dragonite
  },
  {
    name: "BLUE",
    title: "ELITE 5",
    champion: true,
    spec: "Water", // ace Blastoise
    buff: 1.20,
    sprite: `${SPRITE_BASE}/Spr_FRLG_Blue.png`,
    team: [slot(18, 59), slot(65, 57), slot(112, 59), slot(59, 58), slot(103, 59), slot(9, 63)],
    // Pidgeot, Alakazam, Rhydon, Arcanine, Exeggutor, Blastoise
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * HOENN — Elite dos 4 + Campeão (Pokémon Ruby/Sapphire/Emerald).
 *
 * Mons da Gen 3 (+ Skarmory, da Gen 2, no time do Steven). Arte de treinador
 * em estilo RS. Buffs CALIBRADOS por Monte Carlo (sim.mjs, pool de 386) no alvo
 * ~14% de campeão — mesma régua das outras ligas. Níveis canônicos de Emerald.
 * ────────────────────────────────────────────────────────────────────────── */
const HOENN = [
  {
    name: "SIDNEY",
    title: "ELITE 1",
    spec: "Dark",
    buff: 1.17,
    sprite: `${SPRITE_BASE}/Spr_RS_Sidney.png`,
    team: [slot(262, 46), slot(275, 48), slot(332, 46), slot(319, 48), slot(359, 49)],
    // Mightyena, Shiftry, Cacturne, Sharpedo, Absol
  },
  {
    name: "PHOEBE",
    title: "ELITE 2",
    spec: "Ghost",
    buff: 1.52,
    sprite: `${SPRITE_BASE}/Spr_RS_Phoebe.png`,
    team: [slot(356, 48), slot(354, 49), slot(302, 50), slot(354, 49), slot(356, 51)],
    // Dusclops, Banette, Sableye, Banette, Dusclops
  },
  {
    name: "GLACIA",
    title: "ELITE 3",
    spec: "Ice",
    buff: 1.47,
    sprite: `${SPRITE_BASE}/Spr_RS_Glacia.png`,
    team: [slot(363, 50), slot(363, 50), slot(362, 52), slot(362, 52), slot(365, 53)],
    // Sealeo, Sealeo, Glalie, Glalie, Walrein
  },
  {
    name: "DRAKE",
    title: "ELITE 4",
    spec: "Dragon",
    buff: 1.21,
    sprite: `${SPRITE_BASE}/Spr_RS_Drake.png`,
    team: [slot(372, 52), slot(334, 54), slot(330, 53), slot(330, 53), slot(373, 55)],
    // Shelgon, Altaria, Flygon, Flygon, Salamence
  },
  {
    name: "STEVEN",
    title: "ELITE 5",
    champion: true,
    spec: "Steel", // ace Metagross
    buff: 1.11,
    sprite: `${SPRITE_BASE}/Spr_RS_Steven.png`,
    team: [slot(227, 57), slot(344, 55), slot(306, 56), slot(346, 56), slot(348, 56), slot(376, 58)],
    // Skarmory, Claydol, Aggron, Cradily, Armaldo, Metagross
  },
];

/**
 * O REGISTRO de ligas. A ordem aqui é a ordem do carrossel: por GERAÇÃO
 * (Kanto → Johto → Hoenn). `playerLvl` É lever de equilíbrio (ver nota sobre
 * nível acima), calibrado junto dos buffs: Kanto ~58, Johto 46, Hoenn ~54. Os
 * rótulos exibidos vêm do i18n (`leagues.<id>.*`) — aqui ficam só os dados.
 */
export const LEAGUES = [
  { id: "kanto", playerLvl: 58, roster: KANTO },
  { id: "johto", playerLvl: 46, roster: JOHTO },
  { id: "hoenn", playerLvl: 54, roster: HOENN },
];

/** Liga inicial (e fallback). */
export const DEFAULT_LEAGUE_ID = "kanto";

/** Busca uma liga por id; cai na primeira se o id não existir. */
export function getLeague(id) {
  return LEAGUES.find((l) => l.id === id) ?? LEAGUES[0];
}
