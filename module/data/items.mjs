/**
 * Item data. `weapon`: a Nichirin or special weapon, copied from the ported catalog (module/catalogs/weapons.json)
 * so the GM can still edit it on the item. `gear`: everything else in the inventory (consumível, equipamento,
 * material, missão), matching the Inventário mockup filters.
 */
const f = foundry.data.fields;
const int = (initial, opts = {}) => new f.NumberField({ required: true, nullable: false, integer: true, initial, ...opts });
const num = (initial) => new f.NumberField({ required: true, nullable: false, min: 0, initial });
const str = (initial = "") => new f.StringField({ required: true, blank: true, initial });

export const GEAR_CATEGORIES = Object.freeze({
  consumivel: { label: "Consumível", icon: "fa-flask" },
  equipamento: { label: "Equipamento", icon: "fa-shield-halved" },
  material: { label: "Material", icon: "fa-gem" },
  missao: { label: "Missão", icon: "fa-scroll" },
});

export const RARITIES = Object.freeze({ comum: "Comum", incomum: "Incomum", raro: "Raro", epico: "Épico", lendario: "Lendário" });

export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      catalogId: str(),
      category: str("basica"),
      type: str(),
      range: str(),
      properties: str(),
      requirement: str(),
      crit: int(20, { min: 1, max: 22 }),
      damageTypes: new f.ArrayField(new f.StringField()),
      hitAttrs: new f.ArrayField(new f.StringField()),
      profiles: new f.ArrayField(new f.ObjectField()),
      rankDice: new f.ObjectField({ required: false, nullable: true, initial: null }),
      special: new f.ObjectField({ required: false, nullable: true, initial: null }),
      profileIndex: int(0, { min: 0 }),
      stoneBreak: int(0, { min: 0 }), // Respiração da Pedra: Quebra stacks on this weapon (reset at combat end)
      heat: int(0, { min: 0, max: 60 }), // Respiração das Chamas: Fogo Fátuo points on this weapon (reset at combat end)
      equipped: new f.BooleanField({ initial: false }),
      quantity: int(1, { min: 0 }),
      weight: num(0),
      rarity: str("comum"),
      description: new f.HTMLField({ required: true, blank: true }),
      rule: str(),
    };
  }

  get profile() {
    return this.profiles[this.profileIndex] ?? this.profiles[0] ?? null;
  }
}

export class GearData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      category: new f.StringField({ required: true, initial: "consumivel", choices: Object.keys(GEAR_CATEGORIES) }),
      quantity: int(1, { min: 0 }),
      weight: num(0),
      rarity: str("comum"),
      // Optional mechanics: a healing formula (Bandagens "1d6") and a free effect text sent to chat when used.
      heal: str(),
      effect: str(),
      equipped: new f.BooleanField({ initial: false }),
      description: new f.HTMLField({ required: true, blank: true }),
    };
  }
}
