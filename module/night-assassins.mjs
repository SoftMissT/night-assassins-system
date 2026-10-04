import { SlayerData } from "./data/slayer.mjs";
import { SlayerSheet } from "./sheets/slayer-sheet.mjs";

Hooks.once("init", () => {
  CONFIG.Actor.dataModels.slayer = SlayerData;
  foundry.applications.apps.DocumentSheetConfig.registerSheet(
    foundry.documents.Actor,
    game.system.id,
    SlayerSheet,
    { types: ["slayer"], makeDefault: true, label: "Night Assassins | Slayer" },
  );
});
