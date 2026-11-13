/**
 * Damage dialog entries, pure (legacy damage-dialog: one line per source of damage).
 * Entry: { formula, fixed, attrs: ["for", ...], types: ["cortante", ...], label }
 * The whole damage is the sum of the entries; the critical doubles the final total (rollDamage).
 */
import { damageTerm } from "./checks.mjs";

/** Damage types of the legacy (constants.TIPOS_DANO). The weapon catalog also writes "concussivo". */
export const DAMAGE_TYPES = Object.freeze({
  cortante: "Cortante", perfurante: "Perfurante", concussao: "Concussão", trovejante: "Trovejante", sonoro: "Sonoro",
  ferida: "Ferida", sangramento: "Sangramento", envenenamento: "Envenenamento", necrotico: "Necrótico", acido: "Ácido",
  colapso: "Colapso", congelante: "Congelante", eletrico: "Elétrico", fogo: "Fogo", impacto: "Impacto",
  mental: "Mental", solar: "Solar", venenoso: "Venenoso",
});

/** Catalog spelling → dialog key ("concussivo" → "concussao"). */
export const normalizeDamageType = (t) => (/^concuss/i.test(String(t)) ? "concussao" : String(t ?? "").toLowerCase());

/** Formula of one entry, or "" when it has nothing (or an unsafe formula). */
export function entryFormula(entry, attributes = {}) {
  const parts = [];
  const raw = String(entry?.formula ?? "").trim();
  if (raw) {
    const term = damageTerm(raw, attributes);
    if (!term) return "";
    parts.push(term);
  }
  const fixed = Math.trunc(Number(entry?.fixed) || 0);
  if (fixed) parts.push(String(fixed));
  for (const a of entry?.attrs ?? []) {
    const v = Math.trunc(Number(attributes[a]) || 0);
    if (v) parts.push(String(v));
  }
  return parts.join(" + ").replace(/\+ -/g, "- ");
}

/** Sum of all entries; `invalid` lists the 1-based entries whose free formula was refused. */
export function entriesFormula(entries, attributes = {}) {
  const invalid = [];
  const parts = [];
  (entries ?? []).forEach((e, i) => {
    const f = entryFormula(e, attributes);
    if (String(e?.formula ?? "").trim() && !damageTerm(e.formula, attributes)) invalid.push(i + 1);
    else if (f) parts.push(f);
  });
  return { formula: parts.join(" + ").replace(/\+ -/g, "- "), invalid };
}

/** Union of the damage types of the entries, in order, without repeats. */
export const entriesTypes = (entries) => [...new Set((entries ?? []).flatMap((e) => (e.types ?? []).map(normalizeDamageType)))];
