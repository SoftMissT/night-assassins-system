/**
 * Breathing Forms, pure. Data: module/catalogs/breathings.json (ported from the legacy catalogs/breathing.json;
 * names from the rule files). A Form is usable when its required Breathing level ≤ the character's.
 */
import CATALOG from "../catalogs/breathings.json" with { type: "json" };
import { ATTRIBUTE_IDS } from "./progression.mjs";
import { isPassiveForm } from "./passives.mjs";

export const BREATHINGS = Object.freeze(CATALOG.breathings);
export const FORMS = Object.freeze(CATALOG.forms);

const norm = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

/** "Respiração da Água" / "Água" / "agua" → catalog entry or null. */
export function findBreathing(text) {
  const t = norm(text).replace(/^respiracao\s+(da|do|das|dos|de)\s+/, "");
  return BREATHINGS.find((b) => b.key === t.replace(/[^a-z0-9]+/g, "_") || norm(b.name) === norm(text)) ?? null;
}

/**
 * Forms of a breathing for the character's Breathing level. Breathing level N gives access to every level
 * 1..N the Form defines, and the player may use any of them (legacy pipeline only refuses level > breathLevel).
 * `available` lists those levels (Forms may skip levels, e.g. agua_05 starts at 2); `entry` is the highest one.
 */
export function formsFor(key, breathingLevel) {
  return (FORMS[key] ?? []).map((f) => {
    const unlocked = f.requiredBreathingLevel <= breathingLevel;
    const available = unlocked ? f.levels.filter((l) => l.level <= breathingLevel).sort((a, b) => a.level - b.level) : [];
    // Passives are always on (module/core/passives.mjs): listed apart, never "Usar".
    return { ...f, passive: isPassiveForm(f), unlocked: available.length > 0, available, entry: available.at(-1) ?? null };
  });
}

/** The entry of `level` if the character may use it (defined by the Form and ≤ Breathing level), else null. */
export function formLevel(form, level, breathingLevel) {
  const n = Number(level);
  if (!form || !Number.isInteger(n) || n > breathingLevel || form.requiredBreathingLevel > breathingLevel) return null;
  return form.levels.find((l) => l.level === n) ?? null;
}

/**
 * Turns a catalog damage text into a Roll formula with the attribute values in place.
 * "INT + 2d6" → "3 + 2d6"; "2 × INT + 4d6" → "2 * 3 + 4d6". Returns "" when there is no dice/number.
 */
export function damageFormula(text, attributes) {
  let f = String(text ?? "").replace(/×|x(?=\s*@?[A-Za-z])/g, "*");
  // The legacy catalog uses CSB refs ("2d6 + @int"); the rule files use "INT". Accept both.
  for (const id of ATTRIBUTE_IDS) f = f.replace(new RegExp(`@?\\b${id}\\b`, "gi"), String(Number(attributes?.[id]) || 0));
  f = f.replace(/[^0-9d+\-*()\s]/gi, " ").replace(/\s+/g, " ").trim().replace(/^\+\s*/, ""); // "+2" = flat bonus damage
  return /\d/.test(f) && /^[0-9d+\-*()\s]+$/i.test(f) ? f : "";
}

/** Readable damage text for the sheet: "2d6 + @int" → "2d6 + INT". */
export function damageLabel(text) {
  return String(text ?? "").replace(new RegExp(`@(${ATTRIBUTE_IDS.join("|")})\\b`, "gi"), (_, id) => id.toUpperCase());
}

/** Pick the action(s) a Form consumes given which actions are still free. Returns keys to spend, or null if not possible. */
export function actionsToSpend(action, used) {
  const keys = action?.keys ?? [];
  if (!keys.length || keys.includes("passiva") || keys.includes("livre")) return [];
  if (action.mode === "and") return keys.every((k) => !used[k]) ? keys : null;
  const free = keys.find((k) => !used[k]);
  return free ? [free] : null;
}
