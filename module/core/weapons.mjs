/**
 * Weapons, pure. Data: module/catalogs/weapons.json (ported from the legacy catalogs by tools/port-legacy-catalogs.mjs).
 * Rules from the legacy weapon-service / spec 2026-08-13:
 *  - "FOR ou DEX" uses the higher value; "metade" rounds down;
 *  - without proficiency the attribute never enters hit or damage;
 *  - special weapons add the evolving die of the bearer's rank (D 2, C 4, B 6, A 8, S 11, SS 12);
 *  - critical: kept natural ≥ weapon threshold (capped at 20), doubles the final damage; Fadiga Corporal blocks it.
 */
import CATALOG from "../catalogs/weapons.json" with { type: "json" };

export const WEAPONS = Object.freeze(CATALOG.weapons);
export const findWeapon = (id) => WEAPONS.find((w) => w.id === id) ?? null;

const RANK_LEVELS = [["SS", 12], ["S", 11], ["A", 8], ["B", 6], ["C", 4], ["D", 2]];

/** Weapon rank of the bearer by character level ("" below level 2). */
export function weaponRank(level) {
  return RANK_LEVELS.find(([, min]) => Number(level) >= min)?.[0] ?? "";
}

/** Critical threshold of a profile: profile value, else weapon value, capped at 20 (legacy Revólver 22 → 20). */
export function critThreshold(weapon, profile) {
  return Math.min(20, Math.max(1, Number(profile?.crit ?? weapon?.crit) || 20));
}

/** Confirmed hit is critical when the kept natural reaches the threshold and nothing blocks it. */
export function isCritical(natural, threshold, { blocked = false } = {}) {
  return !blocked && Number(natural) >= threshold;
}

/** Attribute part of the damage: choice attributes → best one; the others add. floor(value × multiplier). */
export function attributeDamage(attrs, attributes) {
  const term = (a) => Math.floor((Number(attributes?.[a.key]) || 0) * a.mult);
  const choice = attrs.filter((a) => a.choice).map(term);
  const fixed = attrs.filter((a) => !a.choice).reduce((s, a) => s + term(a), 0);
  return fixed + (choice.length ? Math.max(...choice) : 0);
}

/**
 * Damage formula of one hit. `secondary` = 2nd strike of a two-weapon profile (Nitoryu "fixo" drops attributes).
 * Returns e.g. "1d10 + 7 + 3".
 */
export function weaponDamageFormula(weapon, profile, attributes, { proficient = true, level = 1, secondary = false } = {}) {
  const parts = [];
  if (profile.dice) parts.push(profile.dice);
  const rank = weaponRank(level);
  const rankDie = weapon.rankDice && rank ? weapon.rankDice[rank] : "";
  if (rankDie) parts.push(rankDie);
  const dropAttrs = !proficient || (secondary && profile.secondDamage === "fixo");
  const flat = profile.fixed + (dropAttrs ? 0 : attributeDamage(profile.attrs, attributes));
  if (flat || !parts.length) parts.push(String(flat));
  return parts.join(" + ").replace(/\+ -/g, "- ");
}

/** Hit modifier: chosen attribute (none without proficiency, none on a "sem atributo" 2nd strike) + 2nd-strike penalty. */
export function weaponHitBonus(profile, attrValue, { proficient = true, secondary = false } = {}) {
  const attr = proficient && !(secondary && profile.secondNoAttr) ? Number(attrValue) || 0 : 0;
  return attr + (secondary ? profile.secondPenalty : 0);
}

/** Hit attributes a weapon allows (Acuidade FOR/DEX, Manejável DEX, Concussão FOR). */
export const hitAttributes = (weapon) => (weapon?.hitAttrs?.length ? weapon.hitAttrs : ["for", "dex"]);

/** Readable damage of a profile for the sheet: "7 + metade de FOR ou DEX + 1d10 (Rank B)". */
export function profileLabel(weapon, profile, level) {
  const rank = weaponRank(level);
  const text = profile.text.split(" / ")[0] || String(profile.fixed);
  if (!weapon.rankDice) return text;
  const die = rank ? `${weapon.rankDice[rank]} (Rank ${rank})` : "sem dado (Rank D no nível 2)";
  // The catalog text says "dado evolutivo"; show the die the bearer actually rolls.
  return /dado evolutivo/i.test(text) ? text.replace(/dado evolutivo/i, die) : `${text} + ${die}`;
}

/**
 * Respiração da Pedra, passiva Quebra (legacy breath-passives.effectiveWeaponCritical): each Quebra on the weapon
 * lowers its critical threshold by 1; stacks are capped by FOR and the threshold never drops below 1.
 */
export function stoneCritThreshold(base, stacks, strength) {
  const cap = Math.max(0, Math.trunc(Number(strength) || 0));
  return Math.max(1, base - Math.min(cap, Math.max(0, Math.trunc(Number(stacks) || 0))));
}

/** +1 Quebra after an action dealt Concussão with the weapon, up to FOR. */
export const nextStoneBreak = (stacks, strength) => Math.min(Math.max(0, Math.trunc(Number(strength) || 0)), (Number(stacks) || 0) + 1);

/** Damage types that trigger Quebra (catalog spells it "concussao" and "concussivo"). */
export const isConcussion = (types) => [].concat(types ?? []).some((t) => /^concuss/i.test(String(t)));

const normName = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/**
 * Proficiency (legacy weapon-service): no weapon recorded = proficient with all; otherwise the weapon name must match
 * one of the names written in the sheet (comma, semicolon or line separated).
 */
export function isProficient(proficientText, weaponName) {
  const names = String(proficientText ?? "").split(/[,;\n]/).map(normName).filter(Boolean);
  if (!names.length) return true;
  const w = normName(weaponName);
  return names.some((n) => n === w || w.startsWith(n) || n.startsWith(w));
}
