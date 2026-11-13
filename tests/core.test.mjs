import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import {
  ORIGINS, attributeSnapshots, currentAttributes, classRank, folegoMax,
  giftBonusPerLevel, slayerMaxResources, snapshotLevel,
} from "../module/core/progression.mjs";
import { manualTerm, naturalResult, testFormula } from "../module/core/checks.mjs";

// Golden example: plans/night-assassins-criacao-atributos-progressao.md §6.3 (Origem Ninja).
// The source gives the snapshots directly (VIT 3/4/5, FDV 2/2/3); they are used as-is here.
const NINJA_SNAPSHOTS = {
  1: { vit: 3, fdv: 2 },
  3: { vit: 4, fdv: 2 },
  7: { vit: 5, fdv: 3 },
};
const NINJA_TABLE = [
  [1, 16, 16], [2, 32, 19], [3, 49, 22], [4, 66, 25], [5, 83, 28], [6, 100, 31], [7, 118, 35],
  [8, 136, 39], [9, 154, 43], [10, 172, 47], [11, 190, 51], [12, 208, 55], [13, 226, 59], [14, 244, 63],
];

test("golden: Ninja PDV/PDR levels 1–14 match the reference table", () => {
  for (const [level, pdv, pdr] of NINJA_TABLE) {
    assert.deepEqual(slayerMaxResources({ level, origin: "origem_ninja", snapshots: NINJA_SNAPSHOTS }), { pdv, pdr }, `nível ${level}`);
  }
});

test("golden: level 14 permanent choice adds VIT×3 PDV or FDV×2 PDR", () => {
  assert.equal(slayerMaxResources({ level: 14, origin: "origem_ninja", snapshots: NINJA_SNAPSHOTS, level14: "pdv" }).pdv, 259);
  assert.equal(slayerMaxResources({ level: 14, origin: "origem_ninja", snapshots: NINJA_SNAPSHOTS, level14: "pdr" }).pdr, 69);
  assert.equal(slayerMaxResources({ level: 13, origin: "origem_ninja", snapshots: NINJA_SNAPSHOTS, level14: "pdv" }).pdv, 226, "só vale no nível 14");
});

test("unknown Origin yields null maxima instead of a guessed number", () => {
  assert.deepEqual(slayerMaxResources({ level: 5, origin: "", snapshots: NINJA_SNAPSHOTS }), { pdv: null, pdr: null });
});

test("snapshots: level-3 gain applies from 3, level-7 gain from 7", () => {
  const base = { vit: 3, dex: 1, for: 2, car: 1, fdv: 2, int: 1, sab: 4 };
  const snaps = attributeSnapshots(base, "vit", "fdv");
  assert.equal(currentAttributes(2, snaps).vit, 3);
  assert.equal(currentAttributes(3, snaps).vit, 4);
  assert.equal(currentAttributes(6, snaps).fdv, 2);
  assert.equal(currentAttributes(7, snaps).fdv, 3);
  assert.equal(currentAttributes(14, snaps).vit, 4);
  assert.deepEqual([1, 2, 3, 6, 7, 14].map(snapshotLevel), [1, 1, 3, 3, 7, 7]);
});

test("Blood Gift bonuses are per level and retroactive (Tsuyoi tiers 2/3/4)", () => {
  assert.deepEqual(giftBonusPerLevel("tsuyoi", 5), { pdv: 2, pdr: 0 });
  assert.deepEqual(giftBonusPerLevel("tsuyoi", 6), { pdv: 3, pdr: 0 });
  assert.deepEqual(giftBonusPerLevel("tsuyoi", 12), { pdv: 4, pdr: 0 });
  assert.deepEqual(giftBonusPerLevel("marechi", 1), { pdv: 0, pdr: 1 });
  assert.deepEqual(giftBonusPerLevel("oketsu", 9), { pdv: 0, pdr: 2 });
  // Tsuyoi at level 6: +3 on every one of the 6 levels (retroactive), not 2+2+2+2+2+3.
  const plain = slayerMaxResources({ level: 6, origin: "origem_ninja", snapshots: NINJA_SNAPSHOTS }).pdv;
  const tsuyoi = slayerMaxResources({ level: 6, origin: "origem_ninja", snapshots: NINJA_SNAPSHOTS, gift: "tsuyoi" }).pdv;
  assert.equal(tsuyoi - plain, 18);
});

test("Fôlego = 2 + FDV; class rank by level", () => {
  assert.equal(folegoMax(3), 5);
  assert.equal(folegoMax(0), 2);
  assert.deepEqual([3, 4, 6, 8, 11, 12, 14].map(classRank), [null, "C", "B", "A", "S", "SS", "SS"]);
});

test("all twelve d12 Origins are present with distinct rolls", () => {
  const rolls = Object.values(ORIGINS).map((o) => o.d12).sort((a, b) => a - b);
  assert.deepEqual(rolls, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
});

test("test formulas by roll mode, and the kept natural die", () => {
  assert.equal(testFormula("normal", 4), "1d20 + 4");
  assert.equal(testFormula("vantagem", 3, 2), "2d20kh + 3 + 2");
  assert.equal(testFormula("desvantagem", 2, -1), "2d20kl + 2 - 1");
  assert.equal(naturalResult([{ result: 7, active: false }, { result: 18, active: true }]), 18);
});

test("invariant: module/core has no Foundry globals", () => {
  const dir = new URL("../module/core/", import.meta.url);
  for (const f of readdirSync(dir)) {
    const src = readFileSync(new URL(f, dir), "utf8");
    assert.ok(!/\b(game|ui|Hooks|foundry|canvas|CONFIG)\./.test(src), `${f} usa global do Foundry`);
  }
});

test("manual bonus: numbers and dice pass, anything else is dropped; the d20 stays first", () => {
  assert.equal(manualTerm("+2"), "+ 2");
  assert.equal(manualTerm("-1"), "- 1");
  assert.equal(manualTerm("2"), "+ 2");
  assert.equal(manualTerm("1d4"), "+ 1d4");
  assert.equal(manualTerm("1d6 + 2"), "+ 1d6 + 2");
  assert.equal(manualTerm(""), "");
  assert.equal(manualTerm("abc"), "");
  assert.equal(manualTerm("2; game.over()"), "");
  assert.equal(manualTerm("1d20 * 4"), "");
  assert.equal(testFormula("normal", 3, 0, "1d4"), "1d20 + 3 + 1d4");
  assert.equal(testFormula("vantagem", 3, 2, "-1"), "2d20kh + 3 + 2 - 1");
  assert.equal(testFormula("normal", 3, 0, "rm -rf"), "1d20 + 3");
  assert.equal(testFormula("normal", -2, -1), "1d20 - 2 - 1");
});
