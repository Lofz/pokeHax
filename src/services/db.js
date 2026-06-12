/**
 * db.js — persistência do modo competitivo.
 *
 * HOJE: localStorage, com bots fazendo o papel dos outros jogadores (modo de
 * teste). A API é toda async DE PROPÓSITO: para plugar um backend real
 * (Supabase, Express + SQLite, etc.), basta reimplementar estas funções com
 * fetch() mantendo as assinaturas — UI e lógica de jogo não mudam.
 *
 * Esquema (uma "tabela" de contas, indexada pelo código):
 *   account = {
 *     code,       // ID público de 8 caracteres — identifica a conta na URL
 *     name,       // nome de treinador exibido aos outros jogadores
 *     pinHash,    // SHA-256 de (code:pin) — null para bots
 *     createdAt,
 *     isBot,
 *     competitive: null | {
 *       team: [6 snapshots de Pokémon, com potencial], // FIXA após salvar
 *       lockedAt,
 *       rating, wins, losses,
 *       matchTimes: [ISO...],  // partidas INICIADAS (p/ limite de 5 por 24h)
 *       history: [{at, opponentCode, opponentName, win, delta, score}]
 *     }
 *   }
 *
 * SEGURANÇA: com localStorage o hash do PIN é só um inibidor — quem abre o
 * DevTools lê tudo. A verificação de verdade nasce quando o backend chegar
 * (o PIN passa a ser conferido no servidor e o hash some do cliente).
 */

const DB_KEY = "pokehax:db:v1";
const SESSION_KEY = "pokehax:session:v1";

function loadAll() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* JSON corrompido → recomeça do zero */
  }
  return { accounts: {} };
}

function saveAll(db) {
  localStorage.setItem(DB_KEY, JSON.stringify(db));
}

/** Busca uma conta pelo código. Resolve null se não existir. */
export async function getAccount(code) {
  if (!code) return null;
  return loadAll().accounts[code] ?? null;
}

/** Cria ou atualiza uma conta (upsert pelo código). */
export async function saveAccount(account) {
  const db = loadAll();
  db.accounts[account.code] = account;
  saveAll(db);
  return account;
}

/** Todas as contas (jogadores reais + bots). */
export async function listAccounts() {
  return Object.values(loadAll().accounts);
}

/** Popula o "servidor" com os bots na primeira carga (idempotente). */
export async function seedIfEmpty(makeAccounts) {
  const db = loadAll();
  if (Object.values(db.accounts).some((a) => a.isBot)) return;
  for (const acc of makeAccounts()) db.accounts[acc.code] = acc;
  saveAll(db);
}

/* ---- sessão (este aparelho já provou o PIN desta conta) ---- */

export function getSessionCode() {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionCode(code) {
  localStorage.setItem(SESSION_KEY, code);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}
