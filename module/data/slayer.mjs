import {
  ATTRIBUTE_IDS, MAX_SLAYER_LEVEL, ORIGINS, attributeSnapshots, classRank, currentAttributes,
  folegoMax, slayerMaxResources,
} from "../core/progression.mjs";
import { BONUS_CHANNELS, giftAttributeBonuses, resolveBonuses } from "../core/bonuses.mjs";
import { breathingLevel, classVisible, patente } from "../core/levels.mjs";
import { findBreathing } from "../core/breathing.mjs";
import { clampToMax } from "../core/combat.mjs";
import { REMINDER_MODES, REMINDER_SCOPES } from "../core/reminders.mjs";

/**
 * Slayer data. Persisted: what the player chooses or spends. Derived (prepareDerivedData): attribute totals with
 * sources, bonus channels, maxima, patente, Breathing level and class rank (rules in module/core).
 * `attributes` holds the creation values; the +1 of levels 3 and 7 live in `progression`.
 */
export class SlayerData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const f = foundry.data.fields;
    const int = (initial = 0, extra = {}) =>
      new f.NumberField({ required: true, nullable: false, integer: true, initial, ...extra });
    const flag = () => new f.BooleanField({ initial: false });
    const attrChoice = () => new f.StringField({ initial: "", blank: true, choices: ["", ...ATTRIBUTE_IDS] });
    // value = current amount; bonus = GM adjustment added on top of the rule maximum.
    const resource = () => new f.SchemaField({ value: int(0, { min: 0 }), bonus: int(0) });
    return {
      // 0 = not created yet; the creation wizard sets 1, level-ups go up to 14.
      level: int(0, { min: 0, max: MAX_SLAYER_LEVEL }),
      proficientWeapon: new f.StringField({ initial: "" }),
      creation: new f.SchemaField({
        method: new f.StringField({ initial: "", blank: true, choices: ["", "standard", "roll", "discord"] }),
        pool: new f.ArrayField(new f.NumberField({ integer: true, min: 1 })),
        originMethod: new f.StringField({ initial: "" }),
        originRoll: new f.NumberField({ nullable: true, initial: null, integer: true }),
        originRolls: new f.ArrayField(new f.NumberField({ integer: true })),
        giftMethod: new f.StringField({ initial: "" }),
        giftRolls: new f.ArrayField(new f.NumberField({ integer: true })),
        ancientBlood: new f.BooleanField({ initial: false }),
      }),
      rank: new f.StringField({ initial: "" }), // legacy free text; patente is now derived from the level
      classId: new f.StringField({ initial: "" }),
      originId: new f.StringField({ initial: "" }),
      breathing: new f.StringField({ initial: "" }),
      gift: new f.StringField({ initial: "" }),
      giftAttr: attrChoice(), // Marca do Destino: chosen attribute
      metal: new f.StringField({ initial: "" }), // Nichirin Metal & Color (level 2)
      attributes: new f.SchemaField(Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, int(0, { min: 0 })]))),
      attributeBonus: new f.SchemaField(Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, int(0)]))), // temporary
      bonuses: new f.SchemaField(Object.fromEntries(BONUS_CHANNELS.map((c) => [c, int(0)]))), // "Bônus fixos"
      progression: new f.SchemaField({
        gain3: attrChoice(),
        gain7: attrChoice(),
        level14: new f.StringField({ initial: "", blank: true, choices: ["", "pdv", "pdr"] }),
      }),
      resources: new f.SchemaField({ pdv: resource(), pdr: resource(), folego: resource() }),
      death: new f.SchemaField({ marks: int(0, { min: 0, max: 3 }), falls: int(0, { min: 0 }) }),
      actions: new f.SchemaField({
        movimento: flag(), ataque: flag(), especial: flag(), unica: flag(), completa: flag(), reacao: flag(),
      }),
      epic: new f.SchemaField({ usedThisArc: flag() }),
      // Breathing passives state (module/core/passives.mjs).
      passives: new f.SchemaField({
        freeze: int(0, { min: 0, max: 5 }), // Neve · Congelar stacks
        windCut: int(0, { min: 0 }), // Vento · Cortante/Perfurante taken in the current/last battle
        windBleed: int(0, { min: 0 }), // Vento · Sangramento/Infecção taken in the current/last battle
        scars: int(0, { min: 0, max: 4 }), // Vento · Cicatrizes: +1 CAR tests each
        windVit: int(0, { min: 0, max: 4 }), // Vento · Resistência Vital: +1 VIT tests each
      }),
      // Bonus reminders (module/core/reminders.mjs): manual ones and the ones passives write.
      reminders: new f.ArrayField(new f.SchemaField({
        id: new f.StringField({ required: true, blank: false }),
        label: new f.StringField({ required: true, blank: false, initial: "Lembrete" }),
        scope: new f.StringField({ initial: "todos", choices: Object.keys(REMINDER_SCOPES) }),
        mode: new f.StringField({ initial: "", blank: true, choices: Object.keys(REMINDER_MODES) }),
        bonus: new f.StringField({ initial: "", blank: true }),
        uses: int(1, { min: 0 }),
        source: new f.StringField({ initial: "manual" }),
      })),
      // Saved damage-dialog setups (legacy damage presets): name + entries.
      damagePresets: new f.ArrayField(new f.SchemaField({
        id: new f.StringField({ required: true, blank: false }),
        name: new f.StringField({ required: true, blank: false }),
        entries: new f.ArrayField(new f.ObjectField()),
        pdr: int(0, { min: 0 }),
      })),
    };
  }

  prepareDerivedData() {
    const level = this.level;
    // Permanent Gift bonuses count as attributes (also in the PDV/PDR snapshots); temporary ones do not.
    const gift = giftAttributeBonuses(this.gift, level, this.giftAttr);
    const permanent = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, this.attributes[id] + gift[id]]));
    const snapshots = attributeSnapshots(permanent, this.progression.gain3, this.progression.gain7);
    const atLevel = currentAttributes(Math.max(1, level), snapshots);
    const attributes = {};
    const attributeSources = {};
    for (const id of ATTRIBUTE_IDS) {
      const gains = atLevel[id] - permanent[id];
      const temp = this.attributeBonus[id];
      attributes[id] = atLevel[id] + temp;
      attributeSources[id] = [
        { label: "Criação", value: this.attributes[id] },
        gains ? { label: "Ganho de nível", value: gains } : null,
        gift[id] ? { label: "Dom do Sangue", value: gift[id] } : null,
        temp ? { label: "Temporário", value: temp } : null,
      ].filter(Boolean);
    }
    const bLevel = breathingLevel(level);
    const bonuses = resolveBonuses({ gift: this.gift, level, metal: this.metal, breathingLevel: bLevel, fixed: this.bonuses });
    const max = level < 1 ? { pdv: null, pdr: null } : slayerMaxResources({
      level, origin: this.originId, snapshots, gift: this.gift, level14: this.progression.level14,
    });
    this.resources.pdv.max = max.pdv === null ? null : max.pdv + this.resources.pdv.bonus;
    this.resources.pdr.max = max.pdr === null ? null : max.pdr + bonuses.pdrMaximo.total + this.resources.pdr.bonus;
    this.resources.folego.max = level < 1 ? null : folegoMax(attributes.fdv) + this.resources.folego.bonus;
    // A current value never exceeds its maximum (the max can drop: Metal removed, lower adjustment, GM edit).
    for (const r of Object.values(this.resources)) r.value = clampToMax(r.value, r.max);
    this.derived = {
      attributes,
      attributeSources,
      snapshots,
      bonuses,
      classRank: classRank(level),
      classVisible: classVisible(level, this.classId),
      patente: patente(level),
      breathingLevel: bLevel,
      breathing: findBreathing(this.breathing),
      origin: ORIGINS[this.originId] ?? null,
    };
  }

  /** Refuse to store a current PDV/PDR/Fôlego above the current maximum (sheet input, macros, scripts). */
  async _preUpdate(changes, options, user) {
    const allowed = await super._preUpdate(changes, options, user);
    if (allowed === false) return false;
    for (const [key, r] of Object.entries(this.resources)) {
      const path = `system.resources.${key}.value`;
      const incoming = foundry.utils.getProperty(changes, path);
      if (incoming === undefined || r.max === null) continue;
      const changesMax = ["bonus"].some((k) => foundry.utils.hasProperty(changes, `system.resources.${key}.${k}`))
        || ["system.level", "system.metal", "system.bonuses", "system.attributes", "system.gift", "system.progression", "system.originId"].some((p) => foundry.utils.hasProperty(changes, p));
      if (!changesMax) foundry.utils.setProperty(changes, path, clampToMax(incoming, r.max));
    }
  }
}
