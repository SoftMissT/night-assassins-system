import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import {
  WEAPONS, attributeDamage, critThreshold, findWeapon, hitAttributes, isCritical, weaponDamageFormula, weaponHitBonus, weaponRank,
} from "../module/core/weapons.mjs";
import { clampToMax } from "../module/core/combat.mjs";

const attrs = { vit: 2, dex: 5, for: 3, car: 1, fdv: 4, int: 1, sab: 1 };

const legacyFile = `${process.env.NAS_LEGACY ?? "D:/GIthub/night-assassins-csb-automation"}/catalogs/slayer-weapons.json`;

test("weapon catalog: 26 basic + 17 special, every special has rank dice, every weapon has a profile", () => {
  assert.equal(WEAPONS.length, 43);
  assert.equal(WEAPONS.filter((w) => w.category === "basica").length, 26);
  const specials = WEAPONS.filter((w) => w.category === "especial");
  assert.equal(specials.length, 17);
  for (const w of specials) assert.ok(Object.values(w.rankDice).every(Boolean), w.name);
  for (const w of WEAPONS) assert.ok(w.profiles.length >= 1, w.name);
});

test("weapon catalog mirrors the legacy count", { skip: existsSync(legacyFile) ? false : "legacy CSB checkout not found (set NAS_LEGACY)" }, () => {
  const legacy = JSON.parse(readFileSync(legacyFile, "utf8")).documents.filter((d) => d.system?.props?.arma_nome);
  assert.equal(WEAPONS.length, legacy.length);
});

test("rank by level: D 2, C 4, B 6, A 8, S 11, SS 12", () => {
  assert.deepEqual([1, 2, 4, 6, 8, 11, 12, 14].map(weaponRank), ["", "D", "C", "B", "A", "S", "SS", "SS"]);
});

test("damage: FOR ou DEX picks the higher half, rounding down; other attributes add", () => {
  const bastao = findWeapon("bastao_retratil");
  assert.equal(attributeDamage(bastao.profiles[0].attrs, attrs), 2); // max(floor(5/2), floor(3/2))
  assert.equal(weaponDamageFormula(bastao, bastao.profiles[0], attrs), "5");
  const gae = WEAPONS.find((w) => w.name.startsWith("Gáe Bolg"));
  assert.equal(attributeDamage(gae.profiles[0].attrs, attrs), 2 + 4); // half of best FOR/DEX + full FDV
});

test("special weapons add the rank die; non-proficient bearer drops attributes", () => {
  const yamato = WEAPONS.find((w) => w.name.startsWith("Yamato"));
  assert.equal(weaponDamageFormula(yamato, yamato.profiles[0], attrs, { level: 6 }), "1d10 + 11"); // 7 + FDV 4
  assert.equal(weaponDamageFormula(yamato, yamato.profiles[0], attrs, { level: 6, proficient: false }), "1d10 + 7");
  assert.equal(weaponDamageFormula(yamato, yamato.profiles[0], attrs, { level: 1 }), "11");
});

test("Katana Nitoryu: 2 strikes, 2nd at -2 without attribute and fixed damage", () => {
  const katana = findWeapon("katana");
  const nito = katana.profiles.find((p) => p.mode === "nitoryu");
  assert.equal(nito.attacks, 2);
  assert.equal(weaponHitBonus(nito, 5), 5);
  assert.equal(weaponHitBonus(nito, 5, { secondary: true }), -2);
  assert.equal(weaponHitBonus(nito, 5, { proficient: false }), 0);
  assert.deepEqual(hitAttributes(katana), ["for", "dex"]);
  assert.deepEqual(hitAttributes(findWeapon("rifle")), ["dex"]);
});

test("critical: weapon threshold capped at 20, Fadiga Corporal blocks it", () => {
  const rev = findWeapon("revolver");
  assert.equal(critThreshold(rev, rev.profiles[0]), 20);
  const foice = findWeapon("foice");
  assert.equal(critThreshold(foice, foice.profiles[0]), 18);
  assert.equal(isCritical(18, 18), true);
  assert.equal(isCritical(17, 18), false);
  assert.equal(isCritical(20, 18, { blocked: true }), false);
});

test("resources never exceed their maximum (PDR 39/35 bug)", () => {
  assert.equal(clampToMax(39, 35), 35);
  assert.equal(clampToMax(-3, 35), 0);
  assert.equal(clampToMax(12, null), 12);
  assert.equal(clampToMax(20, 35), 20);
});

test("Pedra Quebra: -1 crit threshold per stack, capped by FOR, floor 1; only Concussão triggers", async () => {
  const { stoneCritThreshold, nextStoneBreak, isConcussion } = await import("../module/core/weapons.mjs");
  assert.equal(stoneCritThreshold(20, 0, 3), 20);
  assert.equal(stoneCritThreshold(20, 2, 3), 18);
  assert.equal(stoneCritThreshold(20, 5, 3), 17); // FOR 3 caps the stacks
  assert.equal(stoneCritThreshold(2, 9, 9), 1);
  assert.equal(nextStoneBreak(2, 3), 3);
  assert.equal(nextStoneBreak(3, 3), 3);
  assert.equal(isConcussion(["cortante", "concussivo"]), true);
  assert.equal(isConcussion(["cortante"]), false);
});

test("profile label shows the rank die instead of 'dado evolutivo'", async () => {
  const { profileLabel } = await import("../module/core/weapons.mjs");
  const yamato = WEAPONS.find((w) => w.name.startsWith("Yamato"));
  assert.equal(profileLabel(yamato, yamato.profiles[0], 7), "7 + FDV + 1d10 (Rank B)");
  assert.equal(profileLabel(findWeapon("katana"), findWeapon("katana").profiles[0], 7), "5");
});

test("proficiency: empty = all; otherwise the weapon name must match", async () => {
  const { isProficient } = await import("../module/core/weapons.mjs");
  assert.equal(isProficient("", "Katana"), true);
  assert.equal(isProficient("Katana", "Katana"), true);
  assert.equal(isProficient("katana, Rifle", "Rifle"), true);
  assert.equal(isProficient("Katana", "Naginata"), false);
  assert.equal(isProficient("Yamato", "Yamato The Rift-Walker's Legacy"), true);
});
