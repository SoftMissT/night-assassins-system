/**
 * Bonus reminders ("lembretes"), pure. Situational modifiers the sheet cannot derive by itself: Vantagem or
 * Desvantagem for the next defense, +2 on the next hit, a passive that grants a bonus on a CD test...
 * Legacy roll-service showed them as `notes` in the roll dialog ("Duro como Aço: Vantagem nesta defesa (gasta ao
 * rolar)"). Here one store on the actor holds both the manual ones and the ones written by passives.
 *
 * Entry: { id, label, scope, mode, bonus, uses, source }
 *  - scope: where it applies (see SCOPES);
 *  - mode: "" | "vantagem" | "desvantagem";
 *  - bonus: signed term ("+2", "-1", "1d4"); "" for mode-only reminders;
 *  - uses: 0 = stays until removed; N = consumed after N rolls that used it;
 *  - source: "manual" or the passive that wrote it (passives clean their own entries).
 */

export const REMINDER_SCOPES = Object.freeze({
  todos: "Toda rolagem",
  acerto: "Acerto",
  defesa: "Defesa (Bloqueio/Esquiva)",
  teste: "Testes e perícias",
  iniciativa: "Iniciativa",
  dano: "Dano",
});

export const REMINDER_MODES = Object.freeze({ "": "Sem modo", vantagem: "Vantagem", desvantagem: "Desvantagem" });

/** Scope of a roll from its bonus channel ("acerto", "bloqueio", "percepcaoVisual", ...) or "dano". */
export function scopeOf(channel) {
  if (channel === "acerto" || channel === "dano" || channel === "iniciativa") return channel;
  if (channel === "bloqueio" || channel === "esquiva") return "defesa";
  return "teste";
}

/** Reminders that apply to a roll scope ("todos" applies everywhere except damage, which only has numbers). */
export function matchingReminders(reminders, scope) {
  return (reminders ?? []).filter((r) => r.scope === scope || (r.scope === "todos" && scope !== "dano"));
}

/** Combined effect of the chosen reminders: mode flags and the bonus terms to append. */
export function reminderEffect(chosen) {
  const list = chosen ?? [];
  return {
    advantage: list.some((r) => r.mode === "vantagem"),
    disadvantage: list.some((r) => r.mode === "desvantagem"),
    terms: list.map((r) => r.bonus).filter(Boolean),
    labels: list.map((r) => r.label),
  };
}

/** After a roll: limited reminders lose one use and disappear at zero; permanent ones (uses 0) stay. */
export function consumeReminders(reminders, usedIds) {
  const used = new Set(usedIds ?? []);
  return (reminders ?? []).flatMap((r) => {
    if (!used.has(r.id) || !(r.uses > 0)) return [r];
    return r.uses > 1 ? [{ ...r, uses: r.uses - 1 }] : [];
  });
}

/** Short text for chips and the dialog: "Vantagem · +2 · 1 uso". */
export function reminderSummary(r) {
  return [
    r.mode ? REMINDER_MODES[r.mode] : "",
    r.bonus || "",
    r.uses > 0 ? `${r.uses} uso${r.uses === 1 ? "" : "s"}` : "permanente",
  ].filter(Boolean).join(" · ");
}
