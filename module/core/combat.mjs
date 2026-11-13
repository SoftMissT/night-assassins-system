/**
 * Combat rules, pure: damage, falls and Death Marks, Combat Breath (Fôlego), initiative.
 * Sources: Mecânica de Vida e Morte.md §1, §2, §10; Sistema_NAS_Compendio.md §1 (Fôlego);
 * initiative 1d20 + DEX is a TABLE PROPOSAL (the base does not define it; see perguntas-abertas).
 */

/** Initiative formula through roll data: total DEX + initiative channel (proposal). */
export const INITIATIVE_FORMULA = "1d20 + @derived.attributes.dex + @derived.bonuses.iniciativa.total";

/**
 * Apply damage to current PDV. Falling to 0 PDV puts the Slayer À Beira da Morte (§1).
 * Repeated fall in the same combat (§10): 1st starts with 0 marks, 2nd with 1, 3rd with 2, 4th = immediate death.
 */
export function applyDamage({ pdv, falls = 0 }, amount) {
  const dmg = Math.max(0, Math.trunc(Number(amount) || 0));
  const next = Math.max(0, pdv - dmg);
  const fell = pdv > 0 && next === 0;
  if (!fell) return { pdv: next, fell: false };
  const fallNumber = falls + 1;
  return { pdv: 0, fell: true, falls: fallNumber, marks: Math.min(3, fallNumber - 1), dead: fallNumber >= 4 };
}

/** Healing never exceeds the maximum. Healing at 0 PDV leaves À Beira da Morte (§8) and clears marks (§2). */
export function applyHealing({ pdv, max }, amount) {
  const heal = Math.max(0, Math.trunc(Number(amount) || 0));
  const next = max === null || max === undefined ? pdv + heal : Math.min(max, pdv + heal);
  return { pdv: next, revived: pdv === 0 && next > 0 };
}

/** Fôlego: full at combat start and outside combat; +1 at the start of your turn and on a positive critical. */
export function folegoGain(value, max, amount = 1) {
  return Math.min(max ?? value + amount, value + amount);
}

/** Natural 20 on attack/defense is a positive critical (recovers 1 Fôlego). */
export function isPositiveCritical(natural) {
  return natural === 20;
}

/** Combine the chosen roll mode with status-driven Vantagem/Desvantagem (they cancel each other). */
export function effectiveRollMode(chosen, { advantage = false, disadvantage = false } = {}) {
  let score = (chosen === "vantagem" ? 1 : chosen === "desvantagem" ? -1 : 0) + (advantage ? 1 : 0) - (disadvantage ? 1 : 0);
  score = Math.max(-1, Math.min(1, score));
  return score > 0 ? "vantagem" : score < 0 ? "desvantagem" : "normal";
}

/** Current resource value bounded to [0, max]; a null max (not created yet) only floors at 0. */
export function clampToMax(value, max) {
  const v = Math.max(0, Math.trunc(Number(value) || 0));
  return max === null || max === undefined ? v : Math.min(v, Math.max(0, Number(max) || 0));
}
