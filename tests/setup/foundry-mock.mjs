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
      (hooks[hook] ??= []).push(handler);
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
    system: { id: "night-assassins", version: "0.1.0" },
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

  globalThis.canvas = { ready: true, tokens: { controlled: [] } };

  globalThis.CONFIG = {
    Actor: { dataModels: {} },
    Item: { dataModels: {} },
  };

  globalThis.Roll = {
    create: (formula) => ({ formula, evaluate: async () => ({ total: 0 }) }),
  };

  globalThis.ChatMessage = {
    getSpeaker: ({ actor } = {}) => ({ actor: actor?.id, alias: actor?.name }),
  };

  globalThis.fromUuid = async () => null;

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
  delete globalThis.canvas;
  delete globalThis.CONFIG;
  delete globalThis.Roll;
  delete globalThis.ChatMessage;
  delete globalThis.fromUuid;
  delete globalThis.__hooks;
}
