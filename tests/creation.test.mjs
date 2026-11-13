import { test } from "node:test";
import assert from "node:assert/strict";
import {
  STANDARD_POOL, assignPool, giftFromD100, giftRollCount, originFromD12, parseDiscordPool,
  poolAttemptOptions, poolMatches,
} from "../module/core/creation.mjs";
import { ONI_LEVEL_GAINS, oniMaxResources } from "../module/core/oni.mjs";

test("d100 Gift table boundaries (§4.2)", () => {
  const cases = { 1: "sem_habilidade", 25: "sem_habilidade", 26: "tato_sensitivo", 47: "audicao_sobrenatural", 58: "visao_agucada",
    69: "olfato_sobrenatural", 80: "metamorfose_carnivora", 81: "tsuyoi", 91: "tsuyoi", 92: "marechi", 98: "marechi", 99: "oketsu", 100: "marca_do_destino" };
  for (const [n, id] of Object.entries(cases)) assert.equal(giftFromD100(n), id, `d100=${n}`);
  assert.equal(giftFromD100(0), null);
});

test("Gift rolls: 2, or 3 for Descendente Perdido / sangue antigo (§4.1)", () => {
  assert.equal(giftRollCount("origem_ninja"), 2);
  assert.equal(giftRollCount("origem_descendente_perdido"), 3);
  assert.equal(giftRollCount("origem_samurai", true), 3);
});

test("d12 → Origin (§3.2)", () => {
  assert.equal(originFromD12(1), "origem_artista_marcial");
  assert.equal(originFromD12(10), "origem_ninja");
  assert.equal(originFromD12(12), "origem_tsuguko");
  assert.equal(originFromD12(13), null);
});

test("7d4 attempts: 1st use/reroll, 2nd use 1st or 2nd/reroll, 3rd mandatory (§1.2)", () => {
  assert.deepEqual(poolAttemptOptions(1), { canReroll: true, usable: [1] });
  assert.deepEqual(poolAttemptOptions(2), { canReroll: true, usable: [1, 2] });
  assert.deepEqual(poolAttemptOptions(3), { canReroll: false, usable: [3] });
});

test("Discord pool: exactly seven integers ≥ 1, legacy counter text", () => {
  assert.deepEqual(parseDiscordPool("4, 3, 2; 2 1 1 1"), { values: [4, 3, 2, 2, 1, 1, 1], count: 7, ok: true, text: "7 de 7 pronto" });
  assert.equal(parseDiscordPool("4 3").text, "5 valores restantes");
  assert.equal(parseDiscordPool("1 1 1 1 1 1 1 1").text, "1 valor excedente");
  assert.equal(parseDiscordPool("4 3 2 2 1 1 0").ok, false);
});

test("pool distribution uses each value exactly once", () => {
  const ok = assignPool(STANDARD_POOL, { vit: 0, dex: 1, for: 2, car: 3, fdv: 4, int: 5, sab: 6 });
  assert.equal(ok.ok, true);
  assert.deepEqual(ok.values, { vit: 4, dex: 3, for: 2, car: 2, fdv: 1, int: 1, sab: 1 });
  assert.equal(poolMatches(STANDARD_POOL, ok.values), true);
  const dup = assignPool(STANDARD_POOL, { vit: 0, dex: 0, for: 2, car: 3, fdv: 4, int: 5, sab: 6 });
  assert.equal(dup.ok, false);
  assert.deepEqual(dup.duplicated, ["dex"]);
  assert.deepEqual(assignPool(STANDARD_POOL, { vit: 0 }).missing.length, 6);
});

test("Oni: level 1 is Origin only; accumulated PDK matches §7.2 (+72 at 10, +254 at 20)", () => {
  const attrs = { vit: 3, fdv: 2 };
  const l1 = oniMaxResources({ level: 1, origin: "oni_comum", attributes: attrs });
  assert.deepEqual(l1, { pdv: 21, pdk: 14, missingRolls: [] });
  const rolls = Object.fromEntries([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((l) => [l, 3]));
  assert.equal(oniMaxResources({ level: 10, origin: "oni_comum", attributes: attrs, pdvRolls: rolls }).pdk, 14 + 72);
  const l20 = oniMaxResources({ level: 20, origin: "oni_comum", attributes: attrs, pdvRolls: rolls });
  assert.equal(l20.pdk, 14 + 254);
  assert.equal(l20.pdv, 21 + 11 * 3 + 300 + 3 * 12, "11 níveis de dado (2–12) + fixos 13–20");
  assert.equal(ONI_LEVEL_GAINS[9].pdk, 20, "nível 9 inclui o Pulso de Sangue Superior");
});

test("Oni: missing PDV rolls are reported, never guessed", () => {
  const r = oniMaxResources({ level: 4, origin: "oni_comum", attributes: { vit: 2, fdv: 1 }, pdvRolls: { 2: 4 } });
  assert.deepEqual(r.missingRolls, [3, 4]);
});
