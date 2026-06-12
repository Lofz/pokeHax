/**
 * competitive.js — as regras do modo competitivo, em um lugar só.
 *
 *  - Equipe FIXA de 6 (snapshot imutável — trocar, só quando existir um
 *    conceito de temporada; o gancho é apagar `competitive` e re-draftar).
 *  - Limite de 5 partidas iniciadas por janela móvel de 24h.
 *  - Batalha ASSÍNCRONA: o adversário não está online; lutamos contra o
 *    snapshot salvo da equipe dele.
 *  - Regra 6: só o INICIADOR ganha/perde pontos. O desafiado é só "dado".
 *  - O resultado é simulado e PERSISTIDO no ato do desafio, antes do playback:
 *    fechar a aba no meio da animação não desfaz uma derrota.
 */
import { getAccount, saveAccount, listAccounts, seedIfEmpty } from "./db";
import { makeBots } from "./bots";
import { leagueOf, eloDelta, START_RATING } from "./ranking";
import { simulateBattle, PLAYER_LVL } from "../engine/battle";
import { hashSeed } from "../engine/rng";

export const MAX_DAILY_MATCHES = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;

/** Chamar uma vez na carga do app: garante os bots no "servidor". */
export async function initCompetitive() {
  await seedIfEmpty(makeBots);
}

/** Congela só o que a batalha e a vitrine precisam (snapshot da equipe). */
function snapshotMon(m) {
  return {
    id: m.id,
    name: m.name,
    types: [...m.types],
    stats: { ...m.stats },
    bst: m.bst,
    potential: m.potential ?? 50,
    rare: !!m.rare,
    image: { ...m.image },
  };
}

/** Tipo mais frequente do time — vira a "especialidade" exibida do treinador. */
export function teamSpec(team) {
  const count = {};
  for (const m of team) for (const t of m.types) count[t] = (count[t] || 0) + 1;
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
}

/** Define a equipe competitiva — UMA vez. Depois disso, é fixa. */
export async function lockTeam(code, team) {
  const acc = await getAccount(code);
  if (!acc) throw new Error("Conta não encontrada.");
  if (acc.competitive?.team?.length) {
    throw new Error("Sua equipe competitiva já foi definida — ela é fixa.");
  }
  if (!team || team.length !== 6) throw new Error("A equipe precisa de 6 Pokémon.");
  acc.competitive = {
    team: team.map(snapshotMon),
    lockedAt: new Date().toISOString(),
    rating: START_RATING,
    wins: 0,
    losses: 0,
    matchTimes: [],
    history: [],
  };
  return saveAccount(acc);
}

/** Quantas partidas restam na janela de 24h e quando libera a próxima. */
export function dailyStatus(acc, now = Date.now()) {
  const times = (acc?.competitive?.matchTimes ?? [])
    .map((t) => Date.parse(t))
    .filter((t) => now - t < WINDOW_MS);
  const left = Math.max(0, MAX_DAILY_MATCHES - times.length);
  const nextFreeAt = left > 0 ? null : new Date(Math.min(...times) + WINDOW_MS);
  return { used: times.length, left, nextFreeAt };
}

/**
 * Visão PÚBLICA de um competidor (regra 4): a composição da equipe (quais 6,
 * tipos, poder da espécie) é aberta; a CONDIÇÃO (potencial do indivíduo) e o
 * estado interno ficam de fora — ninguém espia a forma do seu time.
 */
export function publicView(acc) {
  const c = acc.competitive;
  return {
    code: acc.code,
    name: acc.name,
    isBot: !!acc.isBot,
    rating: c.rating,
    league: leagueOf(c.rating),
    wins: c.wins,
    losses: c.losses,
    team: c.team.map((m) => ({
      id: m.id,
      name: m.name,
      types: [...m.types],
      bst: m.bst,
      image: { ...m.image },
    })),
  };
}

/** Adversários disponíveis (todos com equipe definida, menos você). */
export async function listOpponents(myCode) {
  const all = await listAccounts();
  return all
    .filter((a) => a.code !== myCode && a.competitive?.team?.length)
    .map(publicView)
    .sort((a, b) => b.rating - a.rating);
}

/** Converte um competidor no formato de treinador que o battle.js entende. */
function toTrainer(acc) {
  const c = acc.competitive;
  const league = leagueOf(c.rating);
  return {
    name: acc.name,
    title: `${league.name} · ${c.rating}`,
    spec: teamSpec(c.team),
    // avatar = Pokémon da frente (não há arte de treinador para jogadores)
    sprite: c.team[0]?.image?.sprite ?? null,
    buff: 1, // jogador contra jogador: sem compensação de dificuldade
    team: c.team.map((m) => ({ ...m, lvl: PLAYER_LVL })),
  };
}

/**
 * O desafio inteiro numa chamada: valida limite e equipes, simula, aplica o
 * Elo SÓ no desafiante, consome a tentativa diária e grava o histórico.
 * Devolve a timeline p/ playback + o resumo do resultado já persistido.
 */
export async function playMatch(myCode, oppCode) {
  const me = await getAccount(myCode);
  const opp = await getAccount(oppCode);
  if (!me?.competitive?.team?.length) {
    throw new Error("Defina sua equipe competitiva antes de desafiar.");
  }
  if (!opp?.competitive?.team?.length) throw new Error("Adversário indisponível.");
  if (dailyStatus(me).left <= 0) {
    throw new Error("Limite de 5 partidas em 24h atingido. Volte mais tarde.");
  }

  // Seed única por desafio: cada partida é uma rolagem nova.
  const seedInt = hashSeed(
    `comp:${myCode}:${oppCode}:${Date.now()}:${Math.floor(Math.random() * 1e9)}`
  );
  const trainer = toTrainer(opp);
  const sim = simulateBattle(me.competitive.team, trainer, seedInt);

  const before = me.competitive.rating;
  const delta = eloDelta(before, opp.competitive.rating, sim.win);
  const after = Math.max(0, before + delta);

  me.competitive.rating = after;
  if (sim.win) me.competitive.wins += 1;
  else me.competitive.losses += 1;
  me.competitive.matchTimes.push(new Date().toISOString());
  me.competitive.history.unshift({
    at: new Date().toISOString(),
    opponentCode: opp.code,
    opponentName: opp.name,
    win: sim.win,
    delta,
    score: sim.score,
  });
  me.competitive.history = me.competitive.history.slice(0, 30);
  await saveAccount(me);
  // Regra 6: nada é gravado na conta do desafiado — o rating dele não se move.

  return {
    events: sim.events,
    win: sim.win,
    score: sim.score,
    delta,
    ratingBefore: before,
    ratingAfter: after,
    leagueBefore: leagueOf(before),
    leagueAfter: leagueOf(after),
    trainer,
    opponent: publicView(opp),
    account: me,
  };
}
