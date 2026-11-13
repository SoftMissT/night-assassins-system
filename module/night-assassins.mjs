import { SlayerData } from "./data/slayer.mjs";
import { SlayerSheet } from "./sheets/slayer-sheet.mjs";
import { GearData, WeaponData } from "./data/items.mjs";
import { NasItemSheet } from "./sheets/item-sheet.mjs";
import { SYSTEM_ID } from "./apps/rolls.mjs";
import { registerCombatAutomation } from "./apps/combat-actions.mjs";
import { STATUSES } from "./core/statuses.mjs";
import { INITIATIVE_FORMULA } from "./core/combat.mjs";

/** World settings (GM-only): which creation steps players may choose instead of rolling. */
const GM_PERMISSIONS = Object.freeze({
  allowChooseOrigin: {
    name: "Jogadores podem escolher a Origem",
    hint: "Desligado: o jogador rola 1d12 (2 chances) ou pergunta ao Mestre dentro da criação. O Mestre sempre pode escolher.",
  },
  allowChooseGift: {
    name: "Jogadores podem escolher o Dom do Sangue",
    hint: "Desligado: o Dom é rolado (2d100 ou 3d100, fica o maior) ou o jogador pergunta ao Mestre dentro da criação.",
  },
  allowEarlyClass: {
    name: "Exceção de mesa: Classe no nível 1",
    hint: "Libera Usuário de Duas Respirações e Companheiro Oni na criação. Regra base: Classe no nível 4.",
  },
});

Hooks.once("init", () => {
  CONFIG.Actor.dataModels.slayer = SlayerData;
  CONFIG.Item.dataModels.weapon = WeaponData;
  CONFIG.Item.dataModels.gear = GearData;
  // Night Assassins conditions (Tipos de Status) replace the core list; they appear on the token HUD too.
  CONFIG.statusEffects = STATUSES.map(({ id, name, img }) => ({ id, name, img }));
  // Initiative: 1d20 + total DEX + initiative channel. Table proposal (the rules do not define the formula).
  CONFIG.Combat.initiative = { formula: INITIATIVE_FORMULA, decimals: 2 };
  for (const [key, data] of Object.entries(GM_PERMISSIONS)) {
    game.settings.register(SYSTEM_ID, key, { ...data, scope: "world", config: true, type: Boolean, default: false });
  }
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor,
    game.system.id,
    SlayerSheet,
    { types: ["slayer"], makeDefault: true, label: "Night Assassins | Slayer" },
  );
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Item,
    game.system.id,
    NasItemSheet,
    { types: ["weapon", "gear"], makeDefault: true, label: "Night Assassins | Item" },
  );
  registerCombatAutomation();
});

// A Slayer is a player character: its token is linked to the actor, so damage, Fôlego and actions land on the sheet.
Hooks.on("preCreateActor", (actor, data) => {
  if (actor.type === "slayer" && data.prototypeToken?.actorLink === undefined) {
    actor.updateSource({ "prototypeToken.actorLink": true });
  }
});
