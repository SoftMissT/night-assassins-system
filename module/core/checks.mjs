/**
 * d20 test formulas, pure (no Foundry globals).
 * Every NAS test is d20 + attribute (Mecanicas_Centrais; legado roll-service); perícias are a table rule
 * (perguntas-abertas #4): 1d20 + the paired attribute, no proficiency bonus.
 */

export const ROLL_MODES = Object.freeze({
  normal: { label: "Normal", die: "1d20" },
  vantagem: { label: "Vantagem", die: "2d20kh" },
  desvantagem: { label: "Desvantagem", die: "2d20kl" },
});

/** Combat tests from the legacy sheet: Bloqueio = FOR, Esquiva = DEX, Acerto = FOR or DEX (weapon/choice). */
export const COMBAT_TESTS = Object.freeze({
  bloqueio: { label: "Bloqueio", attrs: ["for"] },
  esquiva: { label: "Esquiva", attrs: ["dex"] },
  acerto: { label: "Acerto", attrs: ["for", "dex"] },
});

/**
 * Manual bonus typed by the player ("+2", "-1", "1d4", "1d6 + 2"). Returns a signed term to append
 * ("+ 1d4", "- 2") or "" when empty/unsafe. Only dice, digits, + - and spaces pass (legacy SAFE_FORMULA, stricter).
 */
export function manualTerm(text) {
  const t = String(text ?? "").trim().replace(/\s+/g, " ");
  const term = String.raw`\d+(?:d\d+)?|d\d+`;
  if (!t || !new RegExp(String.raw`^[+-]?\s*(?:${term})(?:\s*[+-]\s*(?:${term}))*$`, "i").test(t)) return "";
  const signed = /^[+-]/.test(t) ? t : `+ ${t}`;
  return signed.replace(/^([+-])\s*/, "$1 ");
}

const ATTR_REF = /@(vit|dex|for|car|fdv|int|sab)\b/gi;

/**
 * Free damage formula of the damage dialog ("2d6 + 1d4", "4d6kh3", "1d8 + @for"). `@attr` resolves to the
 * character's current attribute. Whitelist: dice (with kh/kl), digits, @attr, + and -. Returns "" when unsafe.
 */
export function damageTerm(text, attributes = {}) {
  const t = String(text ?? "").trim().replace(/\s+/g, " ");
  if (!t) return "";
  const resolved = t.replace(ATTR_REF, (_, k) => String(Math.trunc(Number(attributes[k.toLowerCase()]) || 0)));
  const term = String.raw`\d+d\d+(?:k[hl]\d*)?|d\d+|\d+`;
  if (!new RegExp(String.raw`^[+-]?\s*(?:${term})(?:\s*[+-]\s*(?:${term}))*$`, "i").test(resolved)) return "";
  return resolved.replace(/^\+\s*/, "").replace(/\s*([+-])\s*/g, " $1 ").replace(/^ - /, "-").trim();
}

/** Formula string for a test: die first (natural result reads dice[0]), attribute, flat bonus, manual term. */
export function testFormula(mode, attrValue, bonus = 0, manual = "") {
  const die = (ROLL_MODES[mode] ?? ROLL_MODES.normal).die;
  const parts = [die, `${Number(attrValue) || 0}`];
  if (Number(bonus)) parts.push(`${Number(bonus)}`);
  const m = manualTerm(manual);
  return `${parts.join(" + ").replace(/\+ -/g, "- ")}${m ? ` ${m}` : ""}`;
}

/** Natural d20 kept by the roll (the die that counted): for kh/kl, the active result. */
export function naturalResult(results) {
  const kept = results.filter((r) => r.active !== false);
  return kept.length ? kept[0].result : null;
}
