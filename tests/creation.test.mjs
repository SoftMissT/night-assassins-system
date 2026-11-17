import { test } from "node:test";
import assert from "node:assert/strict";
import {
  GIFT_CHOICE_FACE, GIFT_CHOICE_IDS, STANDARD_POOL, assignPool, giftFromD100, giftRollCount, originFromD22, parseDiscordPool,
  poolAttemptOptions, poolMatches,
} from "../module/core/creation.mjs";
import { GIFTS, ORIGINS, attributeSnapshots, catalogName, originMilestones, slayerMaxResources } from "../module/core/progression.mjs";
import { ONI_LEVEL_GAINS, oniMaxResources } from "../module/core/oni.mjs";

test("all d100 faces resolve to the approved Gift or the choice on 98", () => {
  const ranges = [
    [26, "sem_habilidade"], [36, "tato_sensitivo"], [37, "vanilla_tato_agucado"],
    [47, "audicao_sobrenatural"], [48, "vanilla_audicao_agucada"],
    [58, "visao_agucada"], [59, "vanilla_visao_agucada"],
    [69, "olfato_sobrenatural"], [70, "vanilla_olfato_agucado"],
    [80, "metamorfose_carnivora"], [81, "vanilla_transformacao_demoniaca"],
    [91, "tsuyoi"], [97, "marechi"], [98, null], [99, "oketsu"], [100, "marca_do_destino"],
  ];
  let face = 1;
  for (const [end, id] of ranges) {
    for (; face <= end; face++) assert.equal(giftFromD100(face), id, `d100=${face}`);
  }
  assert.equal(GIFT_CHOICE_FACE, 98);
  assert.deepEqual(GIFT_CHOICE_IDS, ["vanilla_marechi", "vanilla_transformacao_demoniaca"]);
  for (const id of GIFT_CHOICE_IDS) assert.ok(GIFTS[id]?.effect);
  for (const invalid of [0, 101, 1.5, NaN]) assert.equal(giftFromD100(invalid), null);
});

test("Gift rolls: 2, or 3 for Descendente Perdido / sangue antigo (§4.1)", () => {
  assert.equal(giftRollCount("origem_ninja"), 2);
  assert.equal(giftRollCount("origem_descendente_perdido"), 3);
  assert.equal(giftRollCount("origem_samurai", true), 3);
});

test("all d22 faces preserve the previous twelve Origins and the vanilla d10 weights", () => {
  const expected = [
    "origem_artista_marcial", "origem_civilizado", "origem_corsario", "origem_criado_ex_hashira",
    "origem_descendente_perdido", "origem_estrangeiro", "origem_isolado", "origem_militar",
    "origem_monge", "origem_ninja", "origem_samurai", "origem_tsuguko",
    "vanilla_aldeao", "vanilla_aldeao", "vanilla_civilizado", "vanilla_civilizado",
    "vanilla_criado_exterminador", "vanilla_criado_exterminador", "vanilla_isolado",
    "vanilla_descendente", "vanilla_tsuguko", "vanilla_mestre_uma_coisa",
  ];
  assert.deepEqual(expected.map((_, i) => originFromD22(i + 1)), expected);
  for (const invalid of [0, 23, 1.5, NaN]) assert.equal(originFromD22(invalid), null);
});

test("Mestre de Uma Coisa Só: PDV/PDR, Marechi and milestone availability", () => {
  const origin = "vanilla_mestre_uma_coisa";
  const snapshots = attributeSnapshots({ vit: 3, fdv: 2 });
  assert.deepEqual(slayerMaxResources({ level: 1, origin, snapshots }), { pdv: 13, pdr: 5 });
  assert.deepEqual(slayerMaxResources({ level: 2, origin, snapshots }), { pdv: 26, pdr: 8 });
  assert.deepEqual(slayerMaxResources({ level: 1, origin, snapshots, gift: "vanilla_marechi" }), { pdv: 13, pdr: 6 });
  assert.deepEqual(slayerMaxResources({ level: 2, origin, snapshots, gift: "vanilla_marechi" }), { pdv: 26, pdr: 10 });
  const marks = originMilestones(ORIGINS[origin], 6);
  assert.deepEqual(marks.map(({ level, unlocked }) => [level, unlocked]), [[1, true], [5, true], [6, true], [7, false], [9, false]]);
  assert.equal(marks[0].name, "Especialista");
  assert.equal(marks[2].name, "Fragmentado");
});

test("existing Tsuguko and Marechi IDs retain their original values even when roll faces overlap", () => {
  const snapshots = attributeSnapshots({ vit: 3, fdv: 2 });
  assert.deepEqual(slayerMaxResources({ level: 1, origin: "origem_tsuguko", snapshots, gift: "marechi" }), { pdv: 15, pdr: 19 });
  assert.deepEqual(slayerMaxResources({ level: 1, origin: "vanilla_tsuguko", snapshots, gift: "vanilla_marechi" }), { pdv: 13, pdr: 6 });
  assert.equal(catalogName("origem_tsuguko", ORIGINS.origem_tsuguko), "Tsuguko (autoral)");
  assert.equal(catalogName("vanilla_tsuguko", ORIGINS.vanilla_tsuguko), "Tsuguko (vanilla)");
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
