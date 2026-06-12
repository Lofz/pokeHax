/**
 * bots.js — jogadores-bot para popular a Liga enquanto não há backend.
 *
 * Geração 100% determinística (seed fixa): limpar o localStorage recria
 * exatamente os mesmos bots, times e ratings — bom para testar. Os ratings
 * são espalhados de ~850 a ~1850 para todas as divisões terem moradores.
 *
 * Bots nunca INICIAM partidas: servem só de adversário (regra 6 — a equipe
 * deles é o "dado" da batalha de quem desafia; o rating deles não se move).
 */
import { FULL_POOL, TEAM_SIZE, POTENTIAL_MIN, POTENTIAL_MAX } from "../data/pool";
import { mulberry32, hashSeed } from "../engine/rng";

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Classe + nome, no espírito dos treinadores de rota de Johto. */
const BOT_NAMES = [
  "MONTANHISTA OTÁVIO", "PESCADOR JONAS", "CIENTISTA TÉO", "ESCOTEIRA LIA",
  "MOLEQUE DANIEL", "NADADORA BRUNA", "DOMADOR CAUÊ", "ENFERMEIRA NEIDE",
  "MESTRE KIMONO NORI", "MARUJO ÍTALO", "MÉDIUM MARINA", "GUARDA BARTO",
  "MOTOQUEIRO ROGE", "MÁGICO ÉRICO", "CAMPISTA GUTO", "ESQUIADORA IVONE",
  "PROFESSOR SAULO", "PIANISTA CLARA", "COLECIONADOR BENTO", "ANDARILHO RUI",
  "JARDINEIRA TAÍS", "CRIADORA NINA", "LUTADOR VITO", "VETERANO OLAVO",
];

/** Sorteia um time de 6 sem repetição, com potencial individual. */
function drawTeam(rng) {
  const team = [];
  const used = new Set();
  while (team.length < TEAM_SIZE) {
    const pick = FULL_POOL[Math.floor(rng() * FULL_POOL.length)];
    if (used.has(pick.id)) continue;
    used.add(pick.id);
    const potential =
      POTENTIAL_MIN + Math.floor(rng() * (POTENTIAL_MAX - POTENTIAL_MIN + 1));
    team.push({
      id: pick.id,
      name: pick.name,
      types: [...pick.types],
      stats: { ...pick.stats },
      bst: pick.bst,
      potential,
      rare: false,
      image: { ...pick.image },
    });
  }
  return team;
}

function drawCode(rng, usedCodes) {
  let code;
  do {
    code = "";
    for (let i = 0; i < 8; i++) {
      code += CODE_CHARS[Math.floor(rng() * CODE_CHARS.length)];
    }
  } while (usedCodes.has(code));
  usedCodes.add(code);
  return code;
}

/** Gera as contas-bot completas, prontas para o seed do db. */
export function makeBots() {
  const usedCodes = new Set();
  return BOT_NAMES.map((name, i) => {
    const rng = mulberry32(hashSeed(`pokehax-bot-v1:${i}`));
    const code = drawCode(rng, usedCodes);
    const rating = 850 + i * 42 + Math.floor(rng() * 30);
    const wins = Math.max(0, Math.floor((rating - 800) / 25 + rng() * 6));
    const losses = Math.floor(6 + rng() * 22);
    return {
      code,
      name,
      pinHash: null, // bots não têm PIN — ninguém loga neles
      createdAt: new Date(2026, 0, 1 + i).toISOString(),
      isBot: true,
      competitive: {
        team: drawTeam(rng),
        lockedAt: new Date(2026, 0, 1 + i).toISOString(),
        rating,
        wins,
        losses,
        matchTimes: [],
        history: [],
      },
    };
  });
}
