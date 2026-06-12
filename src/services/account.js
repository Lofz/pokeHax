/**
 * account.js — conta sem cadastro: código + PIN.
 *
 * O jogador não cria login nem informa e-mail. Na primeira vez, o jogo gera
 * um CÓDIGO único (8 caracteres legíveis) e o jogador define um PIN numérico.
 * O acesso futuro é pelo link `?conta=CODIGO` + PIN. Não há recuperação:
 * guardar o link é responsabilidade do jogador (a UI martela isso).
 */
import { getAccount, saveAccount, setSessionCode } from "./db";

/** Mesmo alfabeto legível das seeds: sem 0/O, 1/I/L. */
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LENGTH = 8;

/** Gera um código de conta aleatório (não determinístico — é identidade). */
export function genAccountCode() {
  const buf = new Uint32Array(CODE_LENGTH);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < CODE_LENGTH; i++) s += CODE_CHARS[buf[i] % CODE_CHARS.length];
  return s;
}

/** PIN: numérico, 4 a 6 dígitos. */
export function validPin(pin) {
  return /^\d{4,6}$/.test(pin);
}

/** SHA-256 de (código:PIN) — o código entra como sal por conta. */
export async function hashPin(code, pin) {
  const data = new TextEncoder().encode(`${code}:${pin}:pokehax`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** Cria a conta, abre sessão e devolve o registro. */
export async function createAccount(name, pin) {
  if (!validPin(pin)) throw new Error("O PIN deve ter de 4 a 6 dígitos.");
  let code;
  do {
    code = genAccountCode();
  } while (await getAccount(code)); // colisão é raríssima, mas custa nada

  const account = {
    code,
    name:
      (name || "").trim().toUpperCase().slice(0, 18) || `TREINADOR ${code.slice(0, 4)}`,
    pinHash: await hashPin(code, pin),
    createdAt: new Date().toISOString(),
    isBot: false,
    competitive: null,
  };
  await saveAccount(account);
  setSessionCode(code);
  return account;
}

/** Confere código + PIN e abre sessão. */
export async function login(code, pin) {
  const account = await getAccount((code || "").trim().toUpperCase());
  if (!account || account.isBot) {
    throw new Error("Conta não encontrada. Confira o código do seu link.");
  }
  const hash = await hashPin(account.code, pin);
  if (hash !== account.pinHash) throw new Error("PIN incorreto.");
  setSessionCode(account.code);
  return account;
}

/** O link que o jogador precisa guardar: seusite.com/jogo?conta=CODIGO */
export function accountLink(code) {
  const { origin, pathname } = window.location;
  return `${origin}${pathname}?conta=${code}`;
}
