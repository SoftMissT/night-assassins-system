import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { setupFoundryMocks, resetFoundryMocks } from "./setup/foundry-mock.mjs";

const MANIFEST = JSON.parse(
  readFileSync(new URL("../system.json", import.meta.url), "utf8"),
);

let hooks;
let initHandler;

before(async () => {
  ({ hooks } = setupFoundryMocks());
  await import("../module/night-assassins.mjs");
  initHandler = hooks.init?.[0];
});

after(() => {
  resetFoundryMocks();
});

test("importar o módulo registra um handler para o hook 'init'", () => {
  assert.ok(Array.isArray(hooks.init), "esperava handlers para o hook 'init'");
  assert.equal(hooks.init.length, 1, "esperava exatamente um handler de 'init'");
  assert.equal(typeof initHandler, "function");
});

test("o handler de 'init' loga o id e a versão do sistema", () => {
  assert.equal(typeof initHandler, "function", "handler de 'init' não registrado");

  const chamadas = [];
  const original = console.log;
  console.log = (...args) => chamadas.push(args.join(" "));
  try {
    initHandler();
  } finally {
    console.log = original;
  }

  assert.equal(chamadas.length, 1, "esperava um único log no init");
  assert.ok(chamadas[0].includes(MANIFEST.id), "o log deve citar o id do sistema");
  assert.ok(
    chamadas[0].includes(MANIFEST.version),
    "o log deve citar a versão do sistema",
  );
});
