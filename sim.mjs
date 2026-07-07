/**
 * sim.mjs — Monte Carlo de dificuldade do PokéHax (multi-liga).
 *
 * Usa a ENGINE DE BATALHA REAL (src/engine/battle.js, com os buffs atuais).
 * O draft, a normalização do dataset e os times da Elite são reconstruídos
 * aqui (são "dados/plumbing"); a simulação de combate é a do jogo.
 *
 * Cobre as DUAS ligas (Kanto e Johto) e — crucial — passa o `playerLvl` de
 * cada uma. O nível do jogador É um lever de equilíbrio: player e inimigo têm
 * níveis diferentes, então os fatores de nível NÃO se cancelam.
 *
 * Rodar:
 *   ./node_modules/.bin/esbuild sim.mjs --bundle --platform=node --format=esm --outfile=sim.bundle.mjs && node sim.bundle.mjs 4000
 */
import { readFileSync } from "fs";
import { mulberry32, hashSeed } from "./src/engine/rng.js";
import { simulateBattle } from "./src/engine/battle.js";

const N = Number(process.argv[2] ?? 5000);

/* ---- dataset normalizado (cópia fiel de dex.js normalize) ---- */
const pokedex = JSON.parse(readFileSync(new URL("./src/data/pokedex.json", import.meta.url)));
function normalize(entry) {
  const base = entry.base ?? {};
  const bst =
    (base["HP"] ?? 0) + (base["Attack"] ?? 0) + (base["Defense"] ?? 0) +
    (base["Sp. Attack"] ?? 0) + (base["Sp. Defense"] ?? 0) + (base["Speed"] ?? 0);
  return {
    id: entry.id,
    name: entry.name.english,
    types: entry.type,
    stats: {
      hp: base["HP"] ?? 50, atk: base["Attack"] ?? 50, def: base["Defense"] ?? 50,
      spa: base["Sp. Attack"] ?? 50, spd: base["Sp. Defense"] ?? 50, spe: base["Speed"] ?? 50,
    },
    bst,
    image: entry.image ?? {},
  };
}
const byId = new Map(pokedex.map((e) => [e.id, normalize(e)]));
const getMon = (id) => byId.get(id);
const FULL_POOL = [...byId.values()];

/* ---- draft (cópia fiel de pool.js) ---- */
const TEAM_SIZE = 6;
const CANDIDATES_PER_ROUND = 3;
const POTENTIAL_MIN = 50, POTENTIAL_MAX = 100;
const LEGENDARY_IDS = new Set([
  144, 145, 146, 150, 151,
  243, 244, 245, 249, 250, 251,
  377, 378, 379, 380, 381, 382, 383, 384, 385, 386,
]);
const LEGENDARY_POTENTIAL = 110;
const LEGENDARY_KEEP = 1 / 3;
function draw(rng) {
  let pick = FULL_POOL[Math.floor(rng() * FULL_POOL.length)];
  while (LEGENDARY_IDS.has(pick.id) && rng() >= LEGENDARY_KEEP) {
    pick = FULL_POOL[Math.floor(rng() * FULL_POOL.length)];
  }
  const potential = LEGENDARY_IDS.has(pick.id)
    ? LEGENDARY_POTENTIAL
    : POTENTIAL_MIN + Math.floor(rng() * (POTENTIAL_MAX - POTENTIAL_MIN + 1));
  return { ...pick, potential };
}
function rollCandidates(seed, round, pickedIds, nonce = 0) {
  const rng = mulberry32(hashSeed(`draft:${seed}:${round}:${nonce}`));
  const used = new Set(pickedIds);
  const out = [];
  while (out.length < CANDIDATES_PER_ROUND) {
    const c = draw(rng);
    if (used.has(c.id)) continue;
    used.add(c.id);
    out.push(c);
  }
  return out;
}

/* ---- Ligas (ids/níveis/buff espelhados de elite.js) ---- */
const LEAGUE_DEFS = {
  kanto: {
    playerLvl: 58,
    trainers: [
      { name: "LORELEI", buff: 1.16, team: [[87, 52], [91, 51], [80, 52], [124, 54], [131, 54]] },
      { name: "BRUNO", buff: 1.59, team: [[95, 51], [107, 53], [106, 53], [95, 54], [68, 56]] },
      { name: "AGATHA", buff: 1.32, team: [[94, 53], [42, 54], [93, 53], [24, 56], [94, 58]] },
      { name: "LANCE", buff: 1.18, team: [[130, 56], [148, 54], [148, 54], [142, 58], [149, 60]] },
      { name: "BLUE", buff: 1.20, team: [[18, 59], [65, 57], [112, 59], [59, 58], [103, 59], [9, 63]] },
    ],
  },
  johto: {
    playerLvl: 46,
    trainers: [
      { name: "WILL", buff: 1.12, team: [[178, 40], [124, 41], [103, 41], [80, 41], [178, 42]] },
      { name: "KOGA", buff: 1.32, team: [[168, 40], [49, 41], [205, 43], [89, 42], [169, 44]] },
      { name: "BRUNO", buff: 1.64, team: [[237, 42], [106, 42], [107, 42], [95, 43], [68, 46]] },
      { name: "KAREN", buff: 1.33, team: [[197, 42], [45, 42], [94, 45], [198, 44], [229, 47]] },
      { name: "LANCE", buff: 1.05, team: [[130, 44], [149, 47], [149, 47], [142, 46], [6, 46], [149, 50]] },
    ],
  },
  hoenn: {
    playerLvl: 54,
    trainers: [
      { name: "SIDNEY", buff: 1.17, team: [[262, 46], [275, 48], [332, 46], [319, 48], [359, 49]] },
      { name: "PHOEBE", buff: 1.52, team: [[356, 48], [354, 49], [302, 50], [354, 49], [356, 51]] },
      { name: "GLACIA", buff: 1.47, team: [[363, 50], [363, 50], [362, 52], [362, 52], [365, 53]] },
      { name: "DRAKE", buff: 1.21, team: [[372, 52], [334, 54], [330, 53], [330, 53], [373, 55]] },
      { name: "STEVEN", buff: 1.11, team: [[227, 57], [344, 55], [306, 56], [346, 56], [348, 56], [376, 58]] },
    ],
  },
};
const hydrate = (def) =>
  def.trainers.map((t) => ({
    name: t.name,
    buff: t.buff,
    team: t.team.map(([id, lvl]) => ({ ...getMon(id), lvl })),
  }));

/* ---- estratégias de draft (compartilhadas entre ligas) ---- */
const score = (m) => m.bst + (m.potential - 50) * 2; // força + peso ao potencial
const STRATS = {
  "aleatório": (c) => c[Math.floor(Math.random() * c.length)],
  "força (BST)": (c) => c.reduce((a, b) => (b.bst > a.bst ? b : a)),
  "esperto (BST+pot)": (c) => c.reduce((a, b) => (score(b) > score(a) ? b : a)),
};
function draftTeam(seed, choose) {
  const team = [];
  for (let round = 0; round < TEAM_SIZE; round++) {
    const cands = rollCandidates(seed, round, team.map((m) => m.id), 0);
    team.push(choose(cands));
  }
  return team;
}

/** Roda os confrontos de UMA liga; devolve o estágio alcançado (0..len). */
function runCampaign(ELITE, playerLvl, seed, team) {
  for (let i = 0; i < ELITE.length; i++) {
    const sim = simulateBattle(team, ELITE[i], hashSeed(seed + ":" + i), playerLvl);
    if (!sim.win) return i;
  }
  return ELITE.length;
}

/* ---- relatório por estratégia (estado ATUAL dos buffs de elite.js) ---- */
function report(name, ELITE, playerLvl) {
  console.log(`\n══════ LIGA ${name.toUpperCase()} — estado atual · player lvl ${playerLvl} (${N}/estratégia) ══════`);
  const labels = ELITE.map((t) => t.name);
  for (const [sname, choose] of Object.entries(STRATS)) {
    const hist = Array(ELITE.length + 1).fill(0);
    for (let i = 0; i < N; i++) {
      const seed = "S" + i;
      hist[runCampaign(ELITE, playerLvl, seed, draftTeam(seed, choose))]++;
    }
    const champ = hist[ELITE.length];
    console.log(`── ${sname} ──`);
    console.log(`   CAMPEÃO: ${((champ / N) * 100).toFixed(1)}%  (${champ}/${N})`);
    let reached = N;
    const rows = [];
    for (let i = 0; i < ELITE.length; i++) {
      const won = reached - hist[i];
      rows.push(`${labels[i]}: ${((won / reached) * 100).toFixed(0)}%`);
      reached = won;
    }
    console.log(`   vitória por etapa (de quem chegou): ${rows.join("  |  ")}`);
    console.log(`   parou em: ${labels.map((l, i) => `${l} ${((hist[i] / N) * 100).toFixed(0)}%`).join("  ")}`);
  }
}

/* ---- auto-calibração: achatar a curva de dificuldade ---- */
const smart = STRATS["esperto (BST+pot)"];
function makeTeams(prefix, n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const seed = prefix + i;
    arr.push({ seed, team: draftTeam(seed, smart) });
  }
  return arr;
}
function evaluate(ELITE, playerLvl, teams, buffs) {
  let survivors = teams;
  const pass = [];
  for (let i = 0; i < ELITE.length; i++) {
    const tr = { ...ELITE[i], buff: buffs[i] };
    const next = survivors.filter(
      ({ seed, team }) => simulateBattle(team, tr, hashSeed(seed + ":" + i), playerLvl).win
    );
    pass.push(survivors.length ? next.length / survivors.length : 0);
    survivors = next;
  }
  return { champ: survivors.length / teams.length, pass };
}
function calibrate(ELITE, playerLvl, teams, target) {
  let pop = teams;
  const buffs = [];
  for (let i = 0; i < ELITE.length; i++) {
    let lo = 1.0, hi = 2.0;
    for (let it = 0; it < 24; it++) {
      const mid = (lo + hi) / 2;
      const tr = { ...ELITE[i], buff: mid };
      let won = 0;
      for (const { seed, team } of pop)
        if (simulateBattle(team, tr, hashSeed(seed + ":" + i), playerLvl).win) won++;
      const rate = won / pop.length;
      if (rate > target[i]) lo = mid; // fácil demais → mais buff
      else hi = mid;
    }
    const buff = (lo + hi) / 2;
    buffs.push(buff);
    const tr = { ...ELITE[i], buff };
    pop = pop.filter(({ seed, team }) => simulateBattle(team, tr, hashSeed(seed + ":" + i), playerLvl).win);
  }
  return buffs;
}

// Rampas-alvo: cada treinador um pouco mais difícil; o Campeão é o clímax.
const TARGETS = {
  "ATUAL (~14%)": [0.85, 0.80, 0.74, 0.63, 0.43],
  "Médio (~24%)": [0.90, 0.85, 0.80, 0.72, 0.55],
  "Suave (~30%)": [0.91, 0.87, 0.83, 0.76, 0.62],
};
function autoCalibrate(name, ELITE, playerLvl, calTeams, verTeams) {
  const labels = ELITE.map((t) => t.name);
  console.log(`\n══════ AUTO-CALIBRAÇÃO ${name.toUpperCase()} · player lvl ${playerLvl} (estratégia esperta) ══════`);
  for (const [tname, target] of Object.entries(TARGETS)) {
    const buffs = calibrate(ELITE, playerLvl, calTeams, target);
    const ver = evaluate(ELITE, playerLvl, verTeams, buffs);
    console.log(`\n── ${tname} ──`);
    console.log("   buffs:", buffs.map((b) => b.toFixed(2)).join("  "), `(${labels.join("…")})`);
    console.log("   passagem:", labels.map((l, i) => `${l} ${(ver.pass[i] * 100).toFixed(0)}%`).join("  "));
    console.log(`   CAMPEÃO (bot): ${(ver.champ * 100).toFixed(1)}%`);
  }
}

/* ---- execução ---- */
console.log(`PokéHax — Monte Carlo multi-liga\n`);
const kanto = hydrate(LEAGUE_DEFS.kanto);
const johto = hydrate(LEAGUE_DEFS.johto);
const hoenn = hydrate(LEAGUE_DEFS.hoenn);

report("kanto", kanto, LEAGUE_DEFS.kanto.playerLvl);
report("johto", johto, LEAGUE_DEFS.johto.playerLvl);
report("hoenn", hoenn, LEAGUE_DEFS.hoenn.playerLvl);

// Times compartilhados (o draft independe da liga) — reusados nas calibrações.
const calTeams = makeTeams("C", 4000);
const verTeams = makeTeams("V", 8000);
autoCalibrate("kanto", kanto, LEAGUE_DEFS.kanto.playerLvl, calTeams, verTeams);
autoCalibrate("johto", johto, LEAGUE_DEFS.johto.playerLvl, calTeams, verTeams);
autoCalibrate("hoenn", hoenn, LEAGUE_DEFS.hoenn.playerLvl, calTeams, verTeams);
