/**
 * @fileoverview Mocks mínimos do ambiente Foundry VTT para os testes.
 *
 * Não dependem do runtime real do Foundry: fornecem apenas o suficiente para
 * importar os módulos do sistema e inspecionar o registro de hooks. Os handlers
 * de `Hooks.once` ficam acessíveis em `globalThis.__hooks`, para que os testes
 * possam afirmar comportamento (e não apenas "não explodiu").
 */

import { readFileSync } from "node:fs";

/**
 * Tabela de traduções lida do arquivo de idioma real, para que o mock de
 * `i18n` resolva as chaves como o Foundry faz (e os testes validem o pt-BR).
 */
const TRANSLATIONS = JSON.parse(
  readFileSync(new URL("../../lang/pt-BR.json", import.meta.url), "utf8"),
);

/**
 * Manifesto real do sistema, para que o mock de `game.system` reflita `id` e
 * `version` do `system.json` (um bump de versão passa a aparecer no mock).
 */
const MANIFEST = JSON.parse(
  readFileSync(new URL("../../system.json", import.meta.url), "utf8"),
);

/**
 * Instala os mocks globais do Foundry.
 * @returns {{ hooks: Record<string, Function[]> }} Handlers registrados por hook.
 */
export function setupFoundryMocks() {
  const hooks = {};
  globalThis.__hooks = hooks;

  globalThis.foundry = {
    utils: {},
  };

  globalThis.Hooks = {
    once(hook, handler) {
      const registry = (hooks[hook] ??= []);
      if (!registry.includes(handler)) {
        registry.push(handler);
      }
    },
    on(hook, handler) {
      (hooks[hook] ??= []).push(handler);
    },
    call(hook, ...args) {
      for (const handler of hooks[hook] ?? []) {
        handler(...args);
      }
    },
  };

  globalThis.game = {
    system: { id: MANIFEST.id, version: MANIFEST.version },
    i18n: {
      localize: (key) => TRANSLATIONS[key] ?? key,
      format: (key, data = {}) =>
        String(TRANSLATIONS[key] ?? key).replace(/\{(\w+)\}/g, (_, name) =>
          Object.hasOwn(data, name) ? String(data[name]) : `{${name}}`,
        ),
    },
  };

  globalThis.ui = {
    notifications: { info: () => {}, warn: () => {}, error: () => {} },
  };

  return { hooks };
}

/**
 * Remove os mocks globais instalados por `setupFoundryMocks`.
 */
export function resetFoundryMocks() {
  delete globalThis.foundry;
  delete globalThis.Hooks;
  delete globalThis.game;
  delete globalThis.ui;
  delete globalThis.__hooks;
}
