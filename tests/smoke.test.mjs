import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, existsSync } from "node:fs";

const base = new URL("../", import.meta.url);
const file = relative => readFileSync(new URL(relative, base), "utf8");

// Version-neutral, safe static checks: do not require a Foundry world.
test("manifest is a native v14 Foundry system with slayer subtype", () => {
  const manifest = JSON.parse(file("system.json"));
  assert.equal(manifest.id, "night-assassins");
  assert.equal(manifest.type, "system");
  assert.equal(manifest.compatibility.minimum, "14");
  assert.ok(Object.hasOwn(manifest.documentTypes.Actor, "slayer"));
  assert.ok(manifest.esmodules.every(p => existsSync(new URL(p, base))));
  assert.ok(manifest.styles.every(p => existsSync(new URL(p, base))));
});

test("one rail and seven navigation routes, plus three resource bars", () => {
  const template = file("templates/actor/slayer-sheet.hbs");
  const sheets = file("module/sheets/slayer-sheet.mjs");
  assert.equal((template.match(/class="nas-navigation"/g) ?? []).length, 1);
  for (const tab of ["personagem", "combate", "testes", "estados", "inventario", "diario", "configuracoes"]) {
    assert.match(sheets, new RegExp(`id: "${tab}"`));
  }
  for (const resource of ["pdv", "pdr", "folego"]) assert.match(sheets, new RegExp(`id: "${resource}"`));
  assert.match(template, /name="system\.classId"/);
  assert.match(template, /name="system\.originId"/);
});

test("exactly seven principal reference screenshots and no missing files", () => {
  const references = JSON.parse(file(".specs/design/REFERENCIAS-MOCKUPS.json"));
  assert.equal(references.filter(x => x.group === "approved").length, 7);
  assert.equal(references.filter(x => x.group === "iterations").length, 5);
  for (const ref of references) assert.ok(existsSync(new URL(ref.path, base)), ref.path);
});

test("Slayer form writes system fields rather than CSB system.props", () => {
  const js = file("module/data/slayer.mjs");
  const hbs = file("templates/actor/slayer-sheet.hbs");
  assert.ok(!js.includes("system.props"));
  assert.ok(!hbs.includes("system.props"));
  assert.match(hbs, /system\.resources\.\{\{id\}\}\.value/);
  assert.match(hbs, /system\.attributes\.\{\{id\}\}/);
});
