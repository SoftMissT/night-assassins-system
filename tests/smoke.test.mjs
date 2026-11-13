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

test("bundled Cinzel font ships with its OFL license and is referenced by the stylesheet", () => {
  const css = file("styles/night-assassins.css");
  assert.match(css, /url\("\.\.\/assets\/fonts\/cinzel-latin\.woff2"\)/);
  assert.ok(existsSync(new URL("assets/fonts/cinzel-latin.woff2", base)));
  assert.match(file("assets/fonts/Cinzel-OFL.txt"), /SIL Open Font License, Version 1\.1/);
});

test("manifest media points to files that ship inside the system package", () => {
  const manifest = JSON.parse(file("system.json"));
  const types = manifest.media.map(m => m.type);
  assert.ok(types.includes("setup") && types.includes("cover"));
  const prefix = `systems/${manifest.id}/`;
  for (const { url, thumbnail } of manifest.media) {
    for (const path of [url, thumbnail].filter(Boolean)) {
      assert.ok(path.startsWith(prefix), `${path} must live under ${prefix}`);
      assert.ok(existsSync(new URL(path.slice(prefix.length), base)), `${path} missing`);
      assert.ok(!path.includes("assets/references/"), "mockups are excluded from the release zip");
    }
  }
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

test("exactly seven principal reference screenshots exist", () => {
  const dir = new URL("assets/references/", base);
  const expected = [
    "01-personagem-visao-geral.png",
    "02-combate.png",
    "03-testes-corrigido.png",
    "04-estados-pendente-refino.png",
    "05-inventario.png",
    "06-diario-jornal.png",
    "07-configuracoes.png"
  ];
  for (const name of expected) assert.ok(existsSync(new URL(name, dir)), name);
  assert.equal(readdirSync(dir).filter(f => f.endsWith(".png")).length, 7);
});

test("Slayer form writes system fields rather than CSB system.props", () => {
  const js = file("module/data/slayer.mjs");
  const hbs = file("templates/actor/slayer-sheet.hbs");
  assert.ok(!js.includes("system.props"));
  assert.ok(!hbs.includes("system.props"));
  assert.match(hbs, /system\.resources\.\{\{id\}\}\.value/);
  assert.match(hbs, /system\.attributes\.\{\{id\}\}/);
});
