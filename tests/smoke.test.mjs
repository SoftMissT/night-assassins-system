import { test, before, after } from "node:test";
import assert from "node:assert/strict";

import { setupFoundryMocks, resetFoundryMocks } from "./setup/foundry-mock.mjs";

let hooks;

before(() => {
  ({ hooks } = setupFoundryMocks());
});

after(() => {
  resetFoundryMocks();
});

test("importar o módulo registra um handler para o hook 'init'", async () => {
  await assert.doesNotReject(
    () => import("../module/night-assassins.mjs"),
    "o import do módulo não deve lançar",
  );

  assert.ok(Array.isArray(hooks.init), "esperava handlers para o hook 'init'");
  assert.equal(hooks.init.length, 1, "esperava exatamente um handler de 'init'");
  assert.equal(typeof hooks.init[0], "function");
});

test("o handler de 'init' loga o id e a versão do sistema", () => {
  const chamadas = [];
  const original = console.log;
  console.log = (...args) => chamadas.push(args.join(" "));
  try {
    hooks.init[0]();
  } finally {
    console.log = original;
  }

  assert.equal(chamadas.length, 1, "esperava um único log no init");
  assert.match(chamadas[0], /night-assassins/, "o log deve citar o id do sistema");
  assert.match(chamadas[0], /0\.1\.0/, "o log deve citar a versão do sistema");
});
