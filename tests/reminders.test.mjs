import { test } from "node:test";
import assert from "node:assert/strict";
import {
  consumeReminders, matchingReminders, reminderEffect, reminderSummary, scopeOf,
} from "../module/core/reminders.mjs";
import { damageTerm } from "../module/core/checks.mjs";
import { statusRollFlags } from "../module/core/statuses.mjs";

const list = [
  { id: "a", label: "Duro como Aço", scope: "defesa", mode: "vantagem", bonus: "", uses: 1, source: "metal" },
  { id: "b", label: "Bênção", scope: "todos", mode: "", bonus: "+1", uses: 0, source: "manual" },
  { id: "c", label: "Lâmina afiada", scope: "dano", mode: "", bonus: "+2", uses: 2, source: "manual" },
];

test("scope of a roll comes from its bonus channel", () => {
  assert.equal(scopeOf("acerto"), "acerto");
  assert.equal(scopeOf("bloqueio"), "defesa");
  assert.equal(scopeOf("esquiva"), "defesa");
  assert.equal(scopeOf("percepcaoVisual"), "teste");
  assert.equal(scopeOf("teste"), "teste");
  assert.equal(scopeOf("dano"), "dano");
});

test("reminders match their scope; 'todos' covers every d20 roll but not damage", () => {
  assert.deepEqual(matchingReminders(list, "defesa").map((r) => r.id), ["a", "b"]);
  assert.deepEqual(matchingReminders(list, "acerto").map((r) => r.id), ["b"]);
  assert.deepEqual(matchingReminders(list, "dano").map((r) => r.id), ["c"]);
});

test("effect: mode flags and bonus terms of the chosen reminders", () => {
  const e = reminderEffect([list[0], list[1]]);
  assert.equal(e.advantage, true);
  assert.equal(e.disadvantage, false);
  assert.deepEqual(e.terms, ["+1"]);
});

test("consume: limited reminders lose one use and vanish at zero; permanent ones stay", () => {
  const next = consumeReminders(list, ["a", "b", "c"]);
  assert.deepEqual(next.map((r) => [r.id, r.uses]), [["b", 0], ["c", 1]]);
  assert.equal(reminderSummary(list[0]), "Vantagem · 1 uso");
  assert.equal(reminderSummary(list[1]), "+1 · permanente");
});

test("damage formula: dice, kh/kl and @attr pass; anything else is refused", () => {
  const attrs = { for: 4, dex: 2 };
  assert.equal(damageTerm("2d6 + 1d4", attrs), "2d6 + 1d4");
  assert.equal(damageTerm("4d6kh3", attrs), "4d6kh3");
  assert.equal(damageTerm("1d8+@for", attrs), "1d8 + 4");
  assert.equal(damageTerm("-2", attrs), "-2");
  assert.equal(damageTerm("1d6; game.users", attrs), "");
  assert.equal(damageTerm("@foo", attrs), "");
  assert.equal(damageTerm("", attrs), "");
});

test("damage entries: formula + fixed + attributes per line, summed; bad formula is reported", async () => {
  const { entriesFormula, entriesTypes, entryFormula } = await import("../module/core/damage.mjs");
  const attrs = { for: 4, dex: 2, fdv: 3 };
  assert.equal(entryFormula({ formula: "2d6", fixed: 2, attrs: ["for"] }, attrs), "2d6 + 2 + 4");
  assert.equal(entryFormula({ formula: "", fixed: -1, attrs: [] }, attrs), "-1");
  const r = entriesFormula([{ formula: "1d10 + 10" }, { formula: "1d4", attrs: ["fdv"] }, { formula: "x()" }], attrs);
  assert.equal(r.formula, "1d10 + 10 + 1d4 + 3");
  assert.deepEqual(r.invalid, [3]);
  assert.deepEqual(entriesTypes([{ types: ["cortante"] }, { types: ["concussivo", "cortante"] }]), ["cortante", "concussao"]);
});

test("status roll flags name the statuses behind Vantagem/Desvantagem", () => {
  const f = statusRollFlags(["fadiga_mental"], "sab");
  assert.deepEqual(f.disadvantageFrom, ["Fadiga Mental"]);
  assert.equal(f.disadvantage, true);
  assert.equal(statusRollFlags(["fadiga_mental"], "for").disadvantage, false);
});
