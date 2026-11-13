import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { BONUS_CHANNELS, giftAttributeBonuses, resolveBonuses } from "../module/core/bonuses.mjs";
import { breathingLevel, levelEvents, patente, classVisible } from "../module/core/levels.mjs";
import { BREATHINGS, FORMS, actionsToSpend, damageFormula, damageLabel, findBreathing, formLevel, formsFor } from "../module/core/breathing.mjs";
import { applyDamage, applyHealing, effectiveRollMode, folegoGain } from "../module/core/combat.mjs";
import { STATUSES, statusRollFlags } from "../module/core/statuses.mjs";

// Parity tests compare the port with the legacy CSB module. They need that checkout (NAS_LEGACY or the local default)
// and skip on CI, where only this repository exists. The ported catalogs are covered by the tests below either way.
const legacyRoot = process.env.NAS_LEGACY ?? "D:/GIthub/night-assassins-csb-automation";
const legacy = `${legacyRoot}/catalogs`;
const noLegacy = existsSync(legacy) ? false : "legacy CSB checkout not found (set NAS_LEGACY)";

test("patente, Breathing level and events come from the legacy progression catalog", { skip: noLegacy }, () => {
  const src = JSON.parse(readFileSync(`${legacy}/slayer/progression.json`, "utf8")).levels;
  for (const [lvl, v] of Object.entries(src)) {
    assert.equal(patente(Number(lvl)), v.rank);
    assert.equal(breathingLevel(Number(lvl)), v.breathingLevel);
    assert.equal(levelEvents(Number(lvl)).length, v.events.length);
  }
  assert.equal(patente(2), "Mizunoto");
  assert.equal(patente(14), "Hashira de Elite");
  assert.equal(breathingLevel(0), 0);
});

test("Class shows from level 4 or when a table exception set it early", () => {
  assert.equal(classVisible(3, ""), false);
  assert.equal(classVisible(4, ""), true);
  assert.equal(classVisible(1, "classe_companheiro_oni"), true);
});

test("ported Forms match the legacy catalog (300 Forms, 36 breathings) and the 43 rule names", { skip: noLegacy }, () => {
  const docs = JSON.parse(readFileSync(`${legacy}/breathing.json`, "utf8")).documents.filter((d) => d.system?.props?.forma_id);
  assert.equal(Object.values(FORMS).flat().length, docs.length);
  assert.equal(Object.keys(FORMS).length, 36);
  assert.equal(BREATHINGS.length, 43);
  const agua1 = FORMS.agua.find((f) => f.id === "agua_01");
  assert.equal(agua1.name, "Barra de Superfície da Água");
  assert.deepEqual(agua1.levels.map((l) => l.cost), [1, 2, 3, 3]);
  assert.equal(findBreathing("Respiração da Água").key, "agua");
  assert.equal(findBreathing("Respiração das Estrelas").formsCatalogued, false);
});

test("Breathing level N opens levels 1..N of a Form and the player may use any of them", () => {
  const f1 = formsFor("agua", 1).find((f) => f.id === "agua_01");
  assert.deepEqual(f1.available.map((l) => l.level), [1]);
  const f3 = formsFor("agua", 3).find((f) => f.id === "agua_01");
  assert.deepEqual(f3.available.map((l) => l.level), [1, 2, 3]);
  assert.equal(f3.entry.level, 3);
  const f4 = formsFor("agua", 4).find((f) => f.id === "agua_01");
  assert.deepEqual(f4.available.map((l) => l.level), [1, 2, 3, 4]);
  // a lower level is allowed and costs its own PDR
  assert.equal(formLevel(f3, 1, 3).cost, 1);
  assert.equal(formLevel(f3, 3, 3).cost, 3);
  // above the Breathing level or never defined → refused
  assert.equal(formLevel(f3, 4, 3), null);
  assert.equal(formLevel(f3, 0, 3), null);
  assert.equal(formLevel(f3, 1.5, 3), null);
});

test("Forms that skip levels list only the levels they define", () => {
  const f5 = formsFor("agua", 3).find((f) => f.id === "agua_05"); // starts at level 2
  assert.deepEqual(f5.available.map((l) => l.level), [2, 3]);
  assert.equal(formLevel(f5, 1, 3), null);
  const locked = formsFor("agua", 1).find((f) => f.id === "agua_05");
  assert.equal(locked.unlocked, false);
  assert.deepEqual(locked.available, []);
});

test("damage text becomes a Roll formula with attribute values", () => {
  const a = { vit: 1, dex: 4, for: 2, car: 1, fdv: 2, int: 3, sab: 1 };
  assert.equal(damageFormula("INT + 2d6", a), "3 + 2d6");
  assert.equal(damageFormula("8d6 + DEX", a), "8d6 + 4");
  assert.equal(damageFormula("2 × INT + 4d6", a), "2 * 3 + 4d6");
  assert.equal(damageFormula("", a), "");
  assert.equal(damageFormula("metade do dano", a), "");
  // legacy catalog notation (CSB refs)
  assert.equal(damageFormula("2d6 + @int", a), "2d6 + 3");
  assert.equal(damageFormula("4d6 + 2 * @int", a), "4d6 + 2 * 3");
  assert.equal(damageLabel("8d6 + @dex"), "8d6 + DEX");
  // every catalogued damage text must become a valid formula or be empty (never a dangling operator)
  for (const f of Object.values(FORMS).flat()) for (const l of f.levels) {
    const out = damageFormula(l.damage, a);
    assert.ok(out === "" || /^[0-9d(]/i.test(out) && !/[+\-*]\s*$/.test(out), `${f.id} nível ${l.level}: "${l.damage}" → "${out}"`);
  }
});

test("action spending: one, or (first free), and (all free), passive spends nothing", () => {
  const used = { ataque: true };
  assert.deepEqual(actionsToSpend({ mode: "one", keys: ["especial"] }, used), ["especial"]);
  assert.equal(actionsToSpend({ mode: "one", keys: ["ataque"] }, used), null);
  assert.deepEqual(actionsToSpend({ mode: "or", keys: ["ataque", "especial"] }, used), ["especial"]);
  assert.equal(actionsToSpend({ mode: "and", keys: ["ataque", "especial"] }, used), null);
  assert.deepEqual(actionsToSpend({ mode: "one", keys: ["passiva"] }, used), []);
});

test("bonus channels: Gift fallbacks (level 6 upgrade), Metal and fixed bonuses with sources", () => {
  assert.equal(BONUS_CHANNELS.length, 10);
  const tato = resolveBonuses({ gift: "tato_sensitivo", level: 6 });
  assert.equal(tato.bloqueio.total, 3);
  assert.equal(tato.esquiva.total, 2);
  const visao = resolveBonuses({ gift: "visao_agucada", level: 1, metal: "metal_dourada", fixed: { acerto: 1 } });
  assert.equal(visao.acerto.total, 1 + 4 + 1);
  assert.deepEqual(visao.acerto.sources.map((s) => s.label), ["Dom do Sangue", "Metal Dourada", "Bônus fixo"]);
  assert.equal(resolveBonuses({ metal: "metal_rosa", breathingLevel: 3 }).pdrMaximo.total, 12);
  assert.equal(resolveBonuses({ metal: "metal_preto" }).bloqueio.total, 4);
  assert.equal(resolveBonuses({ gift: "audicao_sobrenatural", level: 1 }).percepcaoAuditiva.total, 2);
});

test("Gift attribute bonuses: Tsuyoi +1 VIT/FOR, Marca do Destino +2 then +3 from level 6", () => {
  assert.deepEqual([giftAttributeBonuses("tsuyoi", 1).vit, giftAttributeBonuses("tsuyoi", 1).for], [1, 1]);
  assert.equal(giftAttributeBonuses("marca_do_destino", 5, "int").int, 2);
  assert.equal(giftAttributeBonuses("marca_do_destino", 6, "int").int, 3);
});

test("damage, repeated fall and healing (Vida e Morte §1, §2, §10)", () => {
  assert.deepEqual(applyDamage({ pdv: 10, falls: 0 }, 4), { pdv: 6, fell: false });
  assert.deepEqual(applyDamage({ pdv: 3, falls: 0 }, 9), { pdv: 0, fell: true, falls: 1, marks: 0, dead: false });
  assert.equal(applyDamage({ pdv: 3, falls: 1 }, 9).marks, 1);
  assert.equal(applyDamage({ pdv: 3, falls: 3 }, 9).dead, true);
  assert.deepEqual(applyHealing({ pdv: 0, max: 20 }, 5), { pdv: 5, revived: true });
  assert.equal(applyHealing({ pdv: 18, max: 20 }, 5).pdv, 20);
});

test("Fôlego gain is capped; statuses drive the roll mode and cancel each other", () => {
  assert.equal(folegoGain(4, 5), 5);
  assert.equal(folegoGain(5, 5), 5);
  assert.equal(effectiveRollMode("normal", statusRollFlags(["vantagem"])), "vantagem");
  assert.equal(effectiveRollMode("vantagem", statusRollFlags(["desvantagem"])), "normal");
  assert.equal(effectiveRollMode("normal", statusRollFlags(["fadiga_mental"], "sab")), "desvantagem");
  assert.equal(effectiveRollMode("normal", statusRollFlags(["fadiga_mental"], "dex")), "normal");
  assert.equal(new Set(STATUSES.map((s) => s.id)).size, STATUSES.length);
});
