import { test } from "node:test";
import assert from "node:assert/strict";
import {
  addFlameHeat, addFreeze, flameMultiplied, flameTier, hammerFormula, isPassiveForm, windConsolidate, windDamageSplit,
} from "../module/core/passives.mjs";
import { BREATHINGS, formsFor } from "../module/core/breathing.mjs";

test("passives are classified: never 'Usar', and real Forms are not caught", () => {
  const all = BREATHINGS.flatMap((b) => formsFor(b.key, 5));
  const passives = all.filter(isPassiveForm).map((f) => f.id);
  for (const id of ["chamas_01", "vento_01", "metal_05", "neve_08", "luz_01", "veneno_01", "insetos_01"]) assert.ok(passives.includes(id), id);
  for (const id of ["chamas_02", "agua_01", "pedra_01", "lua_01"]) assert.ok(!passives.includes(id), id);
});

test("Fogo Fátuo: tiers of the legacy table, heat capped at 60", () => {
  assert.deepEqual([0, 5, 10, 20, 30, 50].map((h) => [flameTier(h).hit, flameTier(h).weaponDamage]), [[0, 0], [1, 1], [1, 2], [2, 2], [2, 2], [3, 3]]);
  assert.equal(flameTier(30).techniqueDie, "1d6");
  assert.equal(flameTier(60).multiplier, 1.5);
  assert.equal(flameTier(60).selfDamage, 2);
  assert.equal(addFlameHeat(58, "chamas_06"), 60);
  assert.equal(addFlameHeat(0, "chamas_07"), 0);
  assert.equal(flameMultiplied("2d4 + 3", flameTier(60)), "floor((2d4 + 3) * 1.5)");
  assert.equal(flameMultiplied("2d4", flameTier(10)), "2d4");
});

test("Martelo do Julgamento: half damage rounded up", () => {
  assert.equal(hammerFormula("1d10 + 7"), "ceil((1d10 + 7) / 2)");
});

test("Sangue Especial: tracks by type; long rest gives scars per 30 and VIT per 25, max +4", () => {
  assert.deepEqual(windDamageSplit(12, ["cortante"]), { cut: 12, bleed: 0 });
  assert.deepEqual(windDamageSplit(7, ["sangramento"]), { cut: 0, bleed: 7 });
  assert.deepEqual(windDamageSplit(9, ["fogo"]), { cut: 0, bleed: 0 });
  assert.deepEqual(windConsolidate({ cut: 65, bleed: 50, scars: 1, vit: 3 }), { scars: 3, vit: 4, cut: 0, bleed: 0 });
});

test("Congelar: stacks up to 5", () => {
  assert.equal(addFreeze(4), 5);
  assert.equal(addFreeze(5), 5);
});
