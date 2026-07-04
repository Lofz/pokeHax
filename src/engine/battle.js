/**
 * battle.js — motor de simulação.
 *
 * Agora usa os STATS REAIS do dataset, não mais o BST agregado:
 *  - HP da batalha deriva do stat base de HP
 *  - poder de ataque deriva de max(Attack, Sp. Attack)
 *  - a ordem do turno é disputada pelo stat de Speed
 *  - efetividade pela tabela da Gen 2 (melhor tipo do atacante)
 *
 * O resultado é uma timeline de eventos que a UI reproduz em
 * "tempo real", no estilo do 7a0.
 */
import { bestEff } from "../data/typeChart";
import { mulberry32 } from "./rng";

/** Nível padrão do jogador (liga de Johto). Cada liga pode sobrescrever. */
export const PLAYER_LVL = 46;

/** Fator de escala por nível (Elite sobe de ~40 até 50 no Lance). */
const lvlFactor = (lvl) => 0.5 + lvl / 90;

/** Constantes de balanceamento — mexa aqui para ajustar o ritmo. */
const TUNING = {
  hpBase: 3.0,      // HP de batalha = (HP base * hpBase + hpFlat) * fator
  hpFlat: 70,
  dmg: 0.42,        // dano = ataque * dmg * efetividade * variação
  critChance: 0.08,
  critMult: 1.75,
  immuneFloor: 0.3, // imunidades viram "quase não afetou" p/ a luta não travar
  maxTurns: 240,
};

/**
 * POTENTIAL — a "sorte" de cada indivíduo (50 = canônico, 100 = excepcional).
 * É RUBBER-BAND: os fortes ganham só um bônus suave (global), enquanto os
 * fracos recuperam parte da lacuna até o "teto de campeão". É isso que faz um
 * Charmander sortudo ter chance — e um Dragonite continuar Dragonite.
 * O time inimigo não tem `potential` → cai no padrão 50 → não muda nada.
 */
const POTENTIAL = {
  global: 0.15,  // bônus multiplicativo máximo p/ qualquer um (potencial 100)
  rubber: 0.7,   // fração da lacuna até o teto que o azarão recupera no 100
  atkCeil: 110,  // stat-base de ataque considerado "nível de campeão"
  hpCeil: 100,
  speCeil: 95,
};

/** Sobe um stat-base fraco em direção ao teto + bônus global; nunca rebaixa os fortes. */
function withPotential(value, ceil, p) {
  const lifted = value + p * POTENTIAL.rubber * Math.max(0, ceil - value);
  return lifted * (1 + p * POTENTIAL.global);
}

/**
 * `buff` multiplica HP e ataque — usado só pelos OPONENTES para compensar o
 * draft (você monta um time bem mais forte que 6 sorteados). 1 = sem buff.
 * Cada treinador define o seu em elite.js, formando uma rampa de dificuldade.
 *
 * `mod` é o efeito de um CONSUMÍVEL (só o alvo do jogador recebe; ver
 * consumables.js). Chaves lidas aqui: atkMul, hpMul, alwaysFirst, dmgTakenMul,
 * critBonus, heal ({ threshold, frac }). Ausente = fighter neutro.
 */
function toFighter(mon, lvl, buff = 1, mod = null) {
  const f = lvlFactor(lvl);
  const p = ((mon.potential ?? 50) - 50) / 50; // 0 = canônico, 1 = potencial 100
  const hp = withPotential(mon.stats.hp, POTENTIAL.hpCeil, p);
  const atk = withPotential(Math.max(mon.stats.atk, mon.stats.spa), POTENTIAL.atkCeil, p);
  const spe = withPotential(mon.stats.spe, POTENTIAL.speCeil, p);
  const max = (hp * TUNING.hpBase + TUNING.hpFlat) * f * buff * (mod?.hpMul ?? 1);
  return {
    id: mon.id,
    name: mon.name,
    types: mon.types,
    image: mon.image,
    atk: atk * f * buff * (mod?.atkMul ?? 1),
    spe,
    hp: max,
    max,
    // efeitos de consumível aplicados no loop de turno:
    alwaysFirst: !!mod?.alwaysFirst,
    dmgTakenMul: mod?.dmgTakenMul ?? 1,
    critBonus: mod?.critBonus ?? 0,
    heal: mod?.heal ? { ...mod.heal, used: false } : null,
  };
}

/**
 * Simula a batalha inteira e devolve { events, win, score, koBy, turns }.
 * Cada evento carrega um snapshot (nomes, ids, HP%) para a UI renderizar.
 */
export function simulateBattle(playerTeam, trainer, seedInt, playerLvl = PLAYER_LVL, consumable = null) {
  const rng = mulberry32(seedInt);
  // O consumível (se houver) só afeta o mon do jogador cujo id === alvo.
  // Ids do time são únicos (o draft não repete) → alvo estável mesmo após reordenar.
  const pT = playerTeam.map((m) =>
    toFighter(m, playerLvl, 1, consumable && consumable.target === m.id ? consumable.mod : null)
  );
  const eT = trainer.team.map((m) => toFighter(m, m.lvl, trainer.buff ?? 1));

  let pi = 0, ei = 0, turn = 0, pk = 0, ek = 0;
  const koBy = {};
  const events = [];

  const snap = () => ({
    pName: pT[pi]?.name ?? "—",
    eName: eT[ei]?.name ?? "—",
    pId: pT[pi]?.id ?? null,
    eId: eT[ei]?.id ?? null,
    pImg: pT[pi]?.image?.sprite ?? null,
    eImg: eT[ei]?.image?.sprite ?? null,
    php: pT[pi] ? Math.max(0, pT[pi].hp / pT[pi].max) : 0,
    ehp: eT[ei] ? Math.max(0, eT[ei].hp / eT[ei].max) : 0,
    score: [pk, ek],
    turn,
  });

  events.push({ k: "send", side: "both", ...snap() });

  while (pi < pT.length && ei < eT.length && turn < TUNING.maxTurns) {
    turn++;
    const Pm = pT[pi];
    const Em = eT[ei];

    // Ordem do turno: X-Speed (alwaysFirst) força a prioridade; senão a Speed
    // real decide (com sorte no desempate). Só o jogador ganha esse mod.
    const seq = Pm.alwaysFirst
      ? ["p", "e"]
      : Em.alwaysFirst
      ? ["e", "p"]
      : rng() * (Pm.spe + Em.spe) < Pm.spe
      ? ["p", "e"]
      : ["e", "p"];

    let note = null;
    for (const side of seq) {
      const A = side === "p" ? Pm : Em;
      const D = side === "p" ? Em : Pm;
      if (A.hp <= 0 || D.hp <= 0) continue;

      let eff = bestEff(A.types, D.types);
      const isSuper = eff >= 2;
      if (eff === 0) eff = TUNING.immuneFloor;

      // Lente de Mira: só o jogador tem critBonus (inimigo = 0) → sem rng extra.
      const crit = rng() < TUNING.critChance + (A.critBonus ?? 0);
      const dmg =
        A.atk * TUNING.dmg * eff * (0.82 + 0.36 * rng()) * (crit ? TUNING.critMult : 1);
      D.hp -= dmg * (D.dmgTakenMul ?? 1); // X-Defesa tanka parte do dano

      // Nota estruturada (sem idioma): o componente formata com o i18n.
      if (!note && D.hp > 0) {
        if (crit && rng() < 0.4) {
          note = { side, kind: "crit", name: A.name };
        } else if (isSuper && rng() < 0.22) {
          note = { side, kind: "super", name: A.name };
        }
      }
    }

    // Poção: 1×/batalha, ao cair abaixo do limiar, o mon ativo do jogador cura.
    // Não consome rng → batalhas SEM item mantêm o stream idêntico ao anterior.
    let fx = null;
    if (Pm.heal && !Pm.heal.used && Pm.hp > 0 && Pm.hp / Pm.max < Pm.heal.threshold) {
      Pm.hp = Math.min(Pm.max, Pm.hp + Pm.heal.frac * Pm.max);
      Pm.heal.used = true;
      fx = "heal";
      if (!note) note = { side: "p", kind: "heal", name: Pm.name };
    }

    events.push({ k: "turn", note, fx, ...snap() });

    if (Em.hp <= 0) {
      pk++;
      koBy[Pm.name] = (koBy[Pm.name] || 0) + 1;
      events.push({ k: "faint", side: "e", name: Em.name, by: Pm.name, ...snap(), score: [pk, ek] });
      ei++;
      if (ei < eT.length) events.push({ k: "send", side: "e", ...snap() });
    } else if (Pm.hp <= 0) {
      ek++;
      events.push({ k: "faint", side: "p", name: Pm.name, by: Em.name, ...snap(), score: [pk, ek] });
      pi++;
      if (pi < pT.length) events.push({ k: "send", side: "p", ...snap() });
    }
  }

  const win = ei >= eT.length;
  events.push({ k: "end", win, ...snap() });
  return { events, win, score: [pk, ek], koBy, turns: turn };
}
