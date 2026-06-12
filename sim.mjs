/**
 * sim.mjs — Monte Carlo de dificuldade do PokéHax.
 *
 * Usa a ENGINE DE BATALHA REAL (src/engine/battle.js, com os buffs atuais).
 * O draft, a normalização do dataset e os times da Elite são reconstruídos
 * aqui (são "dados/plumbing"); a simulação de combate é a do jogo.
 *
 * Rodar:  node sim.mjs [N]
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
function draw(rng) {
  const pick = FULL_POOL[Math.floor(rng() * FULL_POOL.length)];
  const potential = POTENTIAL_MIN + Math.floor(rng() * (POTENTIAL_MAX - POTENTIAL_MIN + 1));
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

/* ---- Elite (ids/níveis/buff espelhados de elite.js) ---- */
const ELITE_DEF = [
  { name: "WILL", title: "ELITE 1", spec: "Psychic", buff: 1.11, team: [[178,40],[124,41],[103,41],[80,41],[178,42]] },
  { name: "KOGA", title: "ELITE 2", spec: "Poison", buff: 1.34, team: [[168,40],[49,41],[205,43],[89,42],[169,44]] },
  { name: "BRUNO", title: "ELITE 3", spec: "Fighting", buff: 1.67, team: [[237,42],[106,42],[107,42],[95,43],[68,46]] },
  { name: "KAREN", title: "ELITE 4", spec: "Dark", buff: 1.31, team: [[197,42],[45,42],[94,45],[198,44],[229,47]] },
  { name: "LANCE", title: "CAMPEÃO", spec: "Dragon", buff: 1.02, team: [[130,44],[149,47],[149,47],[142,46],[6,46],[149,50]] },
];
const ELITE = ELITE_DEF.map((t) => ({ ...t, team: t.team.map(([id, lvl]) => ({ ...getMon(id), lvl })) }));

/* ---- estratégias de draft ---- */
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

/** Roda os 5 confrontos; devolve o estágio alcançado (0..5). 5 = campeão. */
function runCampaign(seed, team) {
  for (let i = 0; i < ELITE.length; i++) {
    const sim = simulateBattle(team, ELITE[i], hashSeed(seed + ":" + i));
    if (!sim.win) return i;
  }
  return ELITE.length;
}

/* ---- execução ---- */
console.log(`PokéHax — Monte Carlo (${N} campanhas por estratégia)\n`);
const labels = ELITE_DEF.map((t) => t.name);

for (const [name, choose] of Object.entries(STRATS)) {
  const hist = Array(ELITE.length + 1).fill(0); // estágio em que parou
  for (let i = 0; i < N; i++) {
    const seed = "S" + i;
    const team = draftTeam(seed, choose);
    hist[runCampaign(seed, team)]++;
  }
  const champ = hist[ELITE.length];
  console.log(`── Estratégia: ${name} ──`);
  console.log(`   CAMPEÃO: ${((champ / N) * 100).toFixed(1)}%  (${champ}/${N})`);
  // taxa de vitória condicional por confronto (de quem chegou nele)
  let reached = N;
  const rows = [];
  for (let i = 0; i < ELITE.length; i++) {
    const won = reached - hist[i];
    rows.push(`${labels[i]}: ${((won / reached) * 100).toFixed(0)}%`);
    reached = won;
  }
  console.log(`   vitória por etapa (de quem chegou): ${rows.join("  |  ")}`);
  // onde morreu
  const deaths = labels.map((l, i) => `${l} ${((hist[i] / N) * 100).toFixed(0)}%`);
  console.log(`   parou em: ${deaths.join("  ")}\n`);
}

/* ---- auto-calibração: achatar a curva de dificuldade ---- */
const smart = STRATS["esperto (BST+pot)"];

// Pré-gera N times (sortidos pela estratégia esperta), reusados em tudo.
function makeTeams(prefix, n) {
  const arr = [];
  for (let i = 0; i < n; i++) {
    const seed = prefix + i;
    arr.push({ seed, team: draftTeam(seed, smart) });
  }
  return arr;
}
// Avalia um conjunto de buffs: campeão% + passagem condicional por etapa.
function evaluate(teams, buffs) {
  let survivors = teams;
  const pass = [];
  for (let i = 0; i < ELITE.length; i++) {
    const tr = { ...ELITE[i], buff: buffs[i] };
    const next = survivors.filter(
      ({ seed, team }) => simulateBattle(team, tr, hashSeed(seed + ":" + i)).win
    );
    pass.push(survivors.length ? next.length / survivors.length : 0);
    survivors = next;
  }
  return { champ: survivors.length / teams.length, pass };
}

function calibrate(teams, target) {
  let pop = teams;
  const buffs = [];
  for (let i = 0; i < ELITE.length; i++) {
    let lo = 1.0, hi = 2.0;
    for (let it = 0; it < 24; it++) {
      const mid = (lo + hi) / 2;
      const tr = { ...ELITE[i], buff: mid };
      let won = 0;
      for (const { seed, team } of pop)
        if (simulateBattle(team, tr, hashSeed(seed + ":" + i)).win) won++;
      const rate = won / pop.length;
      if (rate > target[i]) lo = mid; // fácil demais → mais buff
      else hi = mid;
    }
    const buff = (lo + hi) / 2;
    buffs.push(buff);
    const tr = { ...ELITE[i], buff };
    pop = pop.filter(({ seed, team }) => simulateBattle(team, tr, hashSeed(seed + ":" + i)).win);
  }
  return buffs;
}

// Rampas-alvo: cada treinador um pouco mais difícil; Lance é o clímax.
const TARGETS = {
  "ATUAL (~14%)": [0.85, 0.80, 0.74, 0.63, 0.43],
  "Médio (~24%)": [0.90, 0.85, 0.80, 0.72, 0.55],
  "Suave (~30%)": [0.91, 0.87, 0.83, 0.76, 0.62],
};

console.log("══ Auto-calibração por nível (estratégia esperta) ══");
const calTeams = makeTeams("C", 4000);
const verTeams = makeTeams("V", 8000);
for (const [name, target] of Object.entries(TARGETS)) {
  const buffs = calibrate(calTeams, target);
  const ver = evaluate(verTeams, buffs);
  console.log(`\n── ${name} ──`);
  console.log("   buffs:", buffs.map((b) => b.toFixed(2)).join("  "), "(Will…Lance)");
  console.log(
    "   passagem:",
    labels.map((l, i) => `${l} ${(ver.pass[i] * 100).toFixed(0)}%`).join("  ")
  );
  console.log(`   CAMPEÃO (bot): ${(ver.champ * 100).toFixed(1)}%`);
}
