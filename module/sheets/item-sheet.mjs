/** Item sheet for `weapon` and `gear` (ItemSheetV2). Rules stay in module/core; this only edits fields. */
import { GEAR_CATEGORIES, RARITIES } from "../data/items.mjs";
import { profileLabel } from "../core/weapons.mjs";

const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ItemSheetV2 } = foundry.applications.sheets;
const ATTR = { vit: "VIT", dex: "DEX", for: "FOR", car: "CAR", fdv: "FDV", int: "INT", sab: "SAB" };

export class NasItemSheet extends HandlebarsApplicationMixin(ItemSheetV2) {
  static DEFAULT_OPTIONS = {
    classes: ["nas-sheet", "nas-item-sheet"],
    position: { width: 560, height: 640 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
  };

  static PARTS = { body: { template: "systems/night-assassins/templates/item/item-sheet.hbs", scrollable: [".nas-item-body"] } };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const item = this.document;
    const sys = item.system;
    const level = item.actor?.system?.level ?? 1;
    return {
      ...context,
      item,
      system: sys,
      editable: this.isEditable,
      isWeapon: item.type === "weapon",
      isSpecial: item.type === "weapon" && sys.category === "especial",
      categories: Object.entries(GEAR_CATEGORIES).map(([id, c]) => ({ id, label: c.label, selected: id === sys.category })),
      rarities: Object.entries(RARITIES).map(([id, label]) => ({ id, label, selected: id === sys.rarity })),
      profiles: item.type === "weapon" ? sys.profiles.map((p, i) => ({
        index: i, name: p.name, damage: profileLabel(sys, p, level), range: p.range, crit: Math.min(20, p.crit ?? sys.crit),
        attacks: p.attacks, selected: i === sys.profileIndex,
      })) : [],
      hitAttrs: item.type === "weapon" ? sys.hitAttrs.map((k) => ATTR[k] ?? k).join(" ou ") : "",
      descriptionHTML: await foundry.applications.ux.TextEditor.implementation.enrichHTML(sys.description ?? "", { relativeTo: item }),
    };
  }
}
