/**
 * rng.js — RNG determinístico baseado em seed.
 * A mesma seed sempre reproduz o mesmo time e as mesmas batalhas,
 * o que torna campanhas compartilháveis.
 */

/** Hash simples de string para inteiro 32 bits. */
export function hashSeed(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** PRNG mulberry32: rápido e suficiente para um jogo. */
export function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const SEED_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

/** Gera uma seed legível de 5 caracteres (sem 0/O, 1/I/L). */
export function newSeed() {
  let s = "";
  for (let i = 0; i < 5; i++) {
    s += SEED_CHARS[Math.floor(Math.random() * SEED_CHARS.length)];
  }
  return s;
}
