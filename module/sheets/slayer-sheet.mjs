/**
 * Slayer sheet: UI wiring only. Rules live in module/core; combat automation in module/apps/combat-actions.mjs.
 * Tabs use the native ApplicationV2#changeTab (no re-render on switch).
 */
import { GIFTS, ORIGINS } from "../core/progression.mjs";
import { BONUS_CHANNELS, CHANNEL_LABELS, METALS } from "../core/bonuses.mjs";
import { BREATHINGS, damageLabel, formsFor } from "../core/breathing.mjs";
import { COMBAT_TESTS, ROLL_MODES, manualTerm } from "../core/checks.mjs";
import { levelEvents, LEVELS } from "../core/levels.mjs";
import { STATUSES } from "../core/statuses.mjs";
import { SlayerCreationApp } from "../apps/slayer-creation.mjs";
import { levelUp } from "../apps/level-up.mjs";
import {
  rollCheck, applyToActor, useForm, askRoll, askFormLevel, askAttack, attackWithWeapon, toggleEquip, useGear, addWeaponFromCatalog, weaponThreshold,
  askDamage, rollDamageEntries, rollModifiers, consumeUsed, addReminder, removeReminder, useFreeze, windLongRest,
} from "../apps/combat-actions.mjs";
import { FREEZE_STACKS, flameTier } from "../core/passives.mjs";
import { REMINDER_MODES, REMINDER_SCOPES, reminderSummary } from "../core/reminders.mjs";
import { INITIATIVE_FORMULA } from "../core/combat.mjs";
import { isProficient, profileLabel } from "../core/weapons.mjs";
import { GEAR_CATEGORIES, RARITIES } from "../data/items.mjs";

const { HandlebarsApplicationMixin, DialogV2 } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const CLASS_OPTIONS = Object.freeze([
  { id: "classe_mb", name: "Mestre de Batalha" },
  { id: "classe_usuario_de_veneno", name: "Usuário de Veneno" },
  { id: "classe_kakushi", name: "Kakushi" },
  { id: "classe_companheiro_oni", name: "Companheiro Oni" },
  { id: "classe_usuario_de_duas_resp", name: "Usuário de Duas Respirações" },
]);
const ATTRIBUTES = Object.freeze([
  { id: "vit", name: "VIT", full: "Vitalidade", color: "#dc3e55" },
  { id: "dex", name: "DEX", full: "Destreza", color: "#38b3e6" },
  { id: "for", name: "FOR", full: "Força", color: "#da8b45" },
  { id: "car", name: "CAR", full: "Carisma", color: "#ad7ce5" },
  { id: "fdv", name: "FDV", full: "Força de Vontade", color: "#29c7c6" },
  { id: "int", name: "INT", full: "Inteligência", color: "#d5af57" },
  { id: "sab", name: "SAB", full: "Sabedoria", color: "#d3d0cd" },
]);
const ATTR = Object.fromEntries(ATTRIBUTES.map((a) => [a.id, a]));
/** Skill → attribute pairing: table rule (perguntas-abertas #4). Percepção asks visual/auditiva (bonus channels). */
const SKILLS = Object.freeze([
  { name: "Arremesso", attr: "for" }, { name: "Atletismo", attr: "for" }, { name: "Arrombamento", attr: "dex" },
  { name: "Acrobacia", attr: "dex" }, { name: "Corrida", attr: "dex" }, { name: "História", attr: "int" },
  { name: "Intuição", attr: "sab" }, { name: "Religião", attr: "sab" }, { name: "Foco", attr: "fdv" },
  { name: "Adestramento", attr: "fdv" }, { name: "Percepção", attr: "sab" }, { name: "Linguística", attr: "int" },
  { name: "Sobrevivência", attr: "sab" }, { name: "Enganação", attr: "car" }, { name: "Investigação", attr: "int" },
  { name: "Presença", attr: "car" }, { name: "Etiqueta", attr: "car" }, { name: "Performance", attr: "car" },
]);
const ACTION_SLOTS = Object.freeze([
  { key: "movimento", label: "Movimento", icon: "fa-person-running" },
  { key: "ataque", label: "Ataque", icon: "fa-khanda" },
  { key: "especial", label: "Especial", icon: "fa-wind" },
  { key: "unica", label: "Única", icon: "fa-star" },
  { key: "completa", label: "Completa", icon: "fa-circle-notch" },
  { key: "reacao", label: "Reação", icon: "fa-share" },
]);
const NAV = Object.freeze([
  { id: "personagem", name: "Personagem", icon: "fa-user", subtitle: "Identidade e atributos" },
  { id: "combate", name: "Combate", icon: "fa-khanda", subtitle: "Arsenal e habilidades" },
  { id: "testes", name: "Testes", icon: "fa-dice-d20", subtitle: "Perícias e rolagens" },
  { id: "estados", name: "Estados", icon: "fa-star-of-life", subtitle: "Condições e efeitos" },
  { id: "inventario", name: "Inventário", icon: "fa-suitcase", subtitle: "Itens e consumíveis" },
  { id: "diario", name: "Diário", icon: "fa-book-open", subtitle: "Missões e anotações" },
  { id: "configuracoes", name: "Configurações", icon: "fa-gear", subtitle: "Ajustes da ficha" },
]);
/** Inventário filters (mockup 05): weapons are their own Item type; the rest is `gear` by category. */
const INV_FILTERS = Object.freeze([
  { id: "all", label: "Todos", icon: "" },
  { id: "arma", label: "Armas", icon: "fa-khanda" },
  { id: "equipamento", label: "Equipamentos", icon: GEAR_CATEGORIES.equipamento.icon },
  { id: "consumivel", label: "Consumíveis", icon: GEAR_CATEGORIES.consumivel.icon },
  { id: "material", label: "Materiais", icon: GEAR_CATEGORIES.material.icon },
  { id: "missao", label: "Missão", icon: GEAR_CATEGORIES.missao.icon },
]);
const kg = (n) => `${(Math.round(n * 10) / 10).toLocaleString("pt-BR", { minimumFractionDigits: 1 })} kg`;
const pct = (value, max) => (max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0);
const sourcesText = (sources) => sources.map((s) => `${s.label} ${s.value > 0 ? "+" : ""}${s.value}`).join(" · ");

export class SlayerSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  tabGroups = { primary: "personagem" };
  _rollMode = "normal";
  // Inventário UI state kept across re-renders (filter, search and selection run in the DOM, no re-render).
  _nasInv = { filter: "all", search: "", selected: null };

  static DEFAULT_OPTIONS = {
    classes: ["nas-sheet"],
    position: { width: 1440, height: 860 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      nav: this._onNav,
      attribute: this._onAttribute,
      skill: this._onSkill,
      combat: this._onCombat,
      initiative: this._onInitiative,
      useForm: this._onUseForm,
      rollMode: this._onRollMode,
      toggleStatus: this._onToggleStatus,
      toggleAction: this._onToggleAction,
      resetTurn: this._onResetTurn,
      deathMark: this._onDeathMark,
      fall: this._onFall,
      toggleEpic: this._onToggleEpic,
      selfDamage: this._onSelfDamage,
      startCreation: this._onStartCreation,
      levelUp: this._onLevelUp,
      unfinished: this._onUnfinished,
      invFilter: this._onInvFilter,
      invSelect: this._onInvSelect,
      equipItem: this._onEquipItem,
      attackWeapon: this._onAttackWeapon,
      useItem: this._onUseItem,
      editItem: this._onEditItem,
      deleteItem: this._onDeleteItem,
      addCatalogWeapon: this._onAddCatalogWeapon,
      createItem: this._onCreateItem,
      setProfile: this._onSetProfile,
      rollDamageDialog: this._onRollDamageDialog,
      addReminder: this._onAddReminder,
      removeReminder: this._onRemoveReminder,
      useFreeze: this._onUseFreeze,
      windLongRest: this._onWindLongRest,
    },
  };

  static PARTS = {
    body: {
      template: "systems/night-assassins/templates/actor/slayer-sheet.hbs",
      scrollable: [".nas-tab"],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const data = actor.system;
    const d = data.derived;
    const level = data.level;
    const active = this.tabGroups.primary ?? "personagem";
    const resources = [
      { id: "pdv", name: "PDV", className: "pdv", icon: "fa-heart" },
      { id: "pdr", name: "PDR", className: "pdr", icon: "fa-fire-flame-curved" },
      { id: "folego", name: "Fôlego", className: "folego", icon: "fa-wind" },
    ].map((r) => {
      const { value, max, bonus } = data.resources[r.id];
      return { ...r, value, max, bonus, hasMax: max !== null, percent: pct(value, max ?? 0) };
    });
    const className = CLASS_OPTIONS.find((c) => c.id === data.classId)?.name;
    const b = d.bonuses;
    const breathing = d.breathing;
    const forms = breathing ? formsFor(breathing.key, d.breathingLevel) : [];
    const activeStatuses = actor.statuses;
    const groups = [...new Set(STATUSES.map((s) => s.group))];
    const nextEvents = level < 14 && level >= 1 ? levelEvents(level + 1) : [];
    const inventory = await this._inventoryContext();

    return {
      ...context,
      ...inventory,
      actor,
      system: data,
      d,
      editable: this.isEditable,
      isGM: game.user.isGM,
      gmEditable: this.isEditable && game.user.isGM,
      notCreated: level < 1,
      canLevelUp: this.isEditable && level >= 1 && level < 14,
      nav: NAV.map((n) => ({ ...n, active: n.id === active })),
      currentTab: NAV.find((n) => n.id === active),
      tabs: Object.fromEntries(NAV.map((n) => [n.id, { active: n.id === active, cssClass: n.id === active ? "active" : "" }])),
      resources,
      attributes: ATTRIBUTES.map((a) => ({
        ...a, base: data.attributes[a.id], total: d.attributes[a.id], sources: sourcesText(d.attributeSources[a.id]),
      })),
      skills: SKILLS.map((s) => ({ ...s, attrLabel: ATTR[s.attr].name, color: ATTR[s.attr].color, value: d.attributes[s.attr] })),
      identityLine: [
        d.classVisible && className ? className : null,
        d.classRank ? `Rank ${d.classRank}` : null,
        breathing?.name ?? (data.breathing || null),
      ].filter(Boolean).join(" · "),
      classShown: d.classVisible,
      className: className ?? "",
      breathingName: breathing?.name ?? data.breathing,
      breathingIcon: breathing ? `systems/night-assassins/assets/icons/breathing/resp_${breathing.key === "flores" ? "flor" : breathing.key === "insetos" ? "inseto" : breathing.key}.webp` : "",
      breathingPassives: this._passivesContext(forms),
      breathingForms: forms.filter((f) => !f.passive).map((f) => ({
        id: f.id, name: f.name, nameJp: f.nameJp, unlocked: f.unlocked, req: f.requiredBreathingLevel,
        levels: f.available.length > 1 ? `${f.available[0].level}–${f.entry.level}` : f.entry ? String(f.entry.level) : "—",
        cost: f.available.length > 1 ? `${Math.min(...f.available.map((l) => l.cost))}–${Math.max(...f.available.map((l) => l.cost))}` : f.entry?.cost ?? "—",
        damage: damageLabel(f.entry?.damage) || "—", effect: f.entry?.effect || f.description,
        action: f.action.keys.length ? f.action.label : "—", affordable: f.available.some((l) => data.resources.pdr.value >= l.cost),
      })),
      formsMissing: breathing && !breathing.formsCatalogued,
      combatStats: [
        { label: "Acerto", icon: "fa-crosshairs", test: "acerto", value: `+${Math.max(d.attributes.for, d.attributes.dex) + b.acerto.total}`, hint: `FOR ${d.attributes.for} ou DEX ${d.attributes.dex}${b.acerto.total ? ` · ${sourcesText(b.acerto.sources)}` : ""}` },
        { label: "Bloqueio", icon: "fa-shield-halved", test: "bloqueio", value: `+${d.attributes.for + b.bloqueio.total}`, hint: `FOR ${d.attributes.for}${b.bloqueio.total ? ` · ${sourcesText(b.bloqueio.sources)}` : ""}` },
        { label: "Esquiva", icon: "fa-person-running", test: "esquiva", value: `+${d.attributes.dex + b.esquiva.total}`, hint: `DEX ${d.attributes.dex}${b.esquiva.total ? ` · ${sourcesText(b.esquiva.sources)}` : ""}` },
      ],
      initiative: { value: `+${d.attributes.dex + b.iniciativa.total}`, hint: `Proposta de mesa: 1d20 + DEX ${d.attributes.dex}${b.iniciativa.total ? ` · ${sourcesText(b.iniciativa.sources)}` : ""}` },
      bonusList: BONUS_CHANNELS.map((c) => ({ id: c, label: CHANNEL_LABELS[c], fixed: data.bonuses[c], total: b[c].total, sources: sourcesText(b[c].sources) })),
      actionSlots: ACTION_SLOTS.map((s) => ({ ...s, used: data.actions[s.key] })),
      deathPips: [1, 2, 3].map((n) => ({ n, on: data.death.marks >= n })),
      rollModes: Object.entries(ROLL_MODES).map(([id, m]) => ({ id, label: m.label, active: id === this._rollMode })),
      rollModeLabel: ROLL_MODES[this._rollMode].label,
      statusGroups: groups.map((g) => ({
        name: g,
        statuses: STATUSES.filter((s) => s.group === g).map((s) => ({ ...s, on: activeStatuses.has(s.id) })),
      })),
      activeStatusCount: STATUSES.filter((s) => activeStatuses.has(s.id)).length,
      milestones: {
        patente: d.patente,
        breathingLevel: d.breathingLevel,
        current: level >= 1 ? levelEvents(level) : [],
        next: nextEvents,
        nextPatente: level >= 1 && level < 14 ? LEVELS[String(level + 1)]?.patente : null,
        origin: d.origin ? [
          { level: 1, name: d.origin.hab1, unlocked: level >= 1 },
          { level: 6, name: d.origin.hab6, unlocked: level >= 6 },
        ] : [],
        gift: data.gift ? GIFTS[data.gift]?.name : null,
      },
      origins: Object.entries(ORIGINS).map(([id, o]) => ({ id, name: `${o.d12}. ${o.name}`, selected: id === data.originId })),
      gifts: Object.entries(GIFTS).map(([id, g]) => ({ id, name: `${g.range} · ${g.name}`, selected: id === data.gift })),
      classes: CLASS_OPTIONS.map((c) => ({ ...c, selected: c.id === data.classId })),
      breathings: BREATHINGS.map((x) => ({ name: x.name, selected: breathing?.name === x.name })),
      metals: Object.entries(METALS).map(([id, name]) => ({ id, name, selected: id === data.metal })),
      metalUnlocked: level >= 2,
      originName: d.origin?.name ?? "",
      versions: { system: game.system.version, core: game.version },
      reminders: (data.reminders ?? []).map((r) => ({ ...r, scopeLabel: REMINDER_SCOPES[r.scope] ?? r.scope, summary: reminderSummary(r), isManual: r.source === "manual" })),
      reminderScopes: Object.entries(REMINDER_SCOPES).map(([id, label]) => ({ id, label })),
      reminderModes: Object.entries(REMINDER_MODES).map(([id, label]) => ({ id, label })),
      damagePresetCount: data.damagePresets?.length ?? 0,
    };
  }

  /**
   * Breathing passives (always on): rule text + live state for the automated ones. Pedra's Quebra has no catalog
   * entry (legacy passive), so it is listed when the breathing is Pedra.
   */
  _passivesContext(forms) {
    const actor = this.document;
    const p = actor.system.passives;
    const key = actor.system.derived.breathing?.key;
    const weapon = actor.items.find((i) => i.type === "weapon" && i.system.equipped);
    const state = (f) => {
      if (f.id === "chamas_01") {
        if (!weapon) return { auto: true, text: "Equipe uma arma: Fogo Fátuo acumula nela." };
        const t = flameTier(weapon.system.heat);
        return { auto: true, text: `${weapon.name}: Esquentar ${t.heat}/60 · acerto +${t.hit} · dano da arma +${t.weaponDamage}${t.techniqueDie ? ` · técnicas +${t.techniqueDie}` : ""}${t.multiplier > 1 ? " · ×1,5 e 2 de dano por turno" : ""}` };
      }
      if (f.id === "metal_05") return { auto: true, text: "Automático: no crítico de ataque, o cartão oferece o ataque do Martelo." };
      if (f.id === "vento_01") return { auto: true, wind: true, text: `Batalha: ${p.windCut} Cortante/Perfurante · ${p.windBleed} Sangramento/Infecção · Cicatrizes +${p.scars} CAR · Resistência Vital +${p.windVit} VIT` };
      if (f.id === "neve_08") return { auto: true, freeze: true, ready: p.freeze >= FREEZE_STACKS, text: `Congelar ${p.freeze}/${FREEZE_STACKS} (sobe ao confirmar o acerto da 1ª Forma no chat)` };
      return { auto: false, text: "Regra escrita: aplique com um lembrete ou pelo Mestre." };
    };
    const list = forms.filter((f) => f.passive).map((f) => ({ id: f.id, name: f.name.replace(/\s*\*\(.*?\)\*\s*/, ""), description: f.description, ...state(f) }));
    if (key === "pedra") {
      list.unshift({
        id: "pedra_quebra", name: "Quebra (passiva da Pedra)", auto: true,
        description: "Cada ação que causa dano de Concussão com a arma dá 1 Quebra nela, até o valor de FOR. Cada Quebra reduz em 1 a margem de crítico da arma. Zera no fim do combate.",
        text: weapon ? `${weapon.name}: Quebra ${weapon.system.stoneBreak} · crítico ${weaponThreshold(actor, weapon)}+` : "Equipe uma arma de Concussão.",
      });
    }
    return list;
  }

  /** Inventário rows, details and the equipped weapon (Combate panel). */
  async _inventoryContext() {
    const actor = this.document;
    const sys = actor.system;
    const enrich = (html, item) => foundry.applications.ux.TextEditor.implementation.enrichHTML(html ?? "", { relativeTo: item });
    // Mockup order: weapons, consumables, equipment, materials, mission items; then manual sort, then name.
    const ORDER = ["weapon", "consumivel", "equipamento", "material", "missao"];
    const rank = (i) => ORDER.indexOf(i.type === "weapon" ? "weapon" : i.system.category);
    const items = actor.items.contents.filter((i) => i.type === "weapon" || i.type === "gear")
      .sort((a, b) => (rank(a) - rank(b)) || (a.sort - b.sort) || a.name.localeCompare(b.name, "pt-BR"));
    if (!items.some((i) => i.id === this._nasInv.selected)) this._nasInv.selected = items[0]?.id ?? null;
    const rows = await Promise.all(items.map(async (item) => {
      const s = item.system;
      const isWeapon = item.type === "weapon";
      const meta = isWeapon
        ? { label: s.category === "especial" ? "Arma especial" : "Arma Nichirin", icon: "fa-khanda" }
        : GEAR_CATEGORIES[s.category] ?? GEAR_CATEGORIES.equipamento;
      const profile = isWeapon ? s.profile : null;
      const proficient = isWeapon && isProficient(sys.proficientWeapon, item.name);
      const facts = isWeapon ? [
        { label: "Perfil", value: profile?.name || "—" },
        { label: "Dano", value: profile ? profileLabel(s, profile, sys.level) : "—" },
        { label: "Crítico", value: profile ? `${weaponThreshold(actor, item, profile)}–20${s.stoneBreak ? ` (Quebra ${s.stoneBreak})` : ""}` : "—" },
        { label: "Alcance", value: s.range || "—" },
        { label: "Propriedades", value: s.properties || "—" },
        { label: "Proficiência", value: proficient ? "Sim" : "Não: sem atributo no acerto e no dano" },
        s.heat ? { label: "Esquentar", value: `${s.heat}/60 (Fogo Fátuo)` } : null,
        s.requirement ? { label: "Requisito", value: s.requirement } : null,
      ].filter(Boolean) : [
        s.heal ? { label: "Cura", value: s.heal } : null,
        s.effect ? { label: "Efeito", value: s.effect } : null,
      ].filter(Boolean);
      return {
        id: item.id, name: item.name, searchName: item.name.toLocaleLowerCase("pt-BR"), img: item.img, isWeapon,
        category: isWeapon ? "arma" : s.category, typeLabel: meta.label, typeIcon: meta.icon,
        quantity: s.quantity, weight: s.weight ? kg(s.weight) : "—", total: s.quantity * s.weight,
        rarity: s.rarity, rarityLabel: RARITIES[s.rarity] ?? s.rarity, equipped: s.equipped,
        usable: !isWeapon && (s.category === "consumivel" || Boolean(s.heal) || Boolean(s.effect)),
        selected: item.id === this._nasInv.selected, facts,
        profiles: isWeapon ? s.profiles.map((p, i) => ({ index: i, name: p.name || `Perfil ${i + 1}`, active: i === s.profileIndex })) : [],
        profileName: profile?.name ?? "", damage: profile ? profileLabel(s, profile, sys.level) : "",
        crit: profile ? weaponThreshold(actor, item, profile) : null, twoStrikes: (profile?.attacks ?? 1) > 1, proficient,
        descriptionHTML: await enrich(s.description, item),
      };
    }));
    return {
      inventory: rows,
      inventoryWeight: kg(rows.reduce((t, r) => t + r.total, 0)),
      inventoryCount: rows.reduce((t, r) => t + r.quantity, 0),
      invFilters: INV_FILTERS.map((f) => ({ ...f, active: f.id === this._nasInv.filter })),
      invSearch: this._nasInv.search,
      equippedWeapon: rows.find((r) => r.isWeapon && r.equipped) ?? null,
    };
  }

  /** Filter + search in the DOM (no re-render); hides rows that do not match. */
  _applyInventoryFilter() {
    const { filter, search } = this._nasInv;
    const q = search.trim().toLocaleLowerCase("pt-BR");
    let shown = 0;
    this.element.querySelectorAll(".nas-inv-row").forEach((row) => {
      const ok = (filter === "all" || row.dataset.category === filter) && (!q || row.dataset.name.includes(q));
      row.hidden = !ok;
      if (ok) shown++;
    });
    const empty = this.element.querySelector(".nas-inv-noresult");
    if (empty) empty.hidden = shown > 0 || !this.document.items.size;
  }

  async _onRender(context, options) {
    await super._onRender(context, options);
    const search = this.element.querySelector(".nas-inv-search input");
    if (search) {
      // Nameless field: keep it out of submitOnChange and filter as the user types.
      search.addEventListener("change", (ev) => ev.stopPropagation());
      search.addEventListener("input", (ev) => {
        this._nasInv.search = ev.target.value;
        this._applyInventoryFilter();
      });
    }
    this._applyInventoryFilter();
    // Reminder form fields are nameless drafts: keep their changes out of submitOnChange.
    this.element.querySelector(".nas-reminder-form")?.addEventListener("change", (ev) => ev.stopPropagation());
  }

  _itemFrom(target) {
    return this.document.items.get(target.closest("[data-item-id]")?.dataset.itemId) ?? null;
  }

  static _onInvFilter(event, target) {
    this._nasInv.filter = target.dataset.filter;
    this.element.querySelectorAll("[data-action='invFilter']").forEach((b) => {
      const on = b === target;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
    this._applyInventoryFilter();
  }

  static _onInvSelect(event, target) {
    const id = target.closest("[data-item-id]")?.dataset.itemId;
    if (!id) return;
    this._nasInv.selected = id;
    this.element.querySelectorAll(".nas-inv-row").forEach((r) => {
      r.classList.toggle("is-selected", r.dataset.itemId === id);
      r.setAttribute("aria-selected", String(r.dataset.itemId === id));
    });
    this.element.querySelectorAll(".nas-inv-detail").forEach((d) => { d.hidden = d.dataset.itemId !== id; });
  }

  static async _onEquipItem(event, target) {
    const item = this._itemFrom(target);
    if (item && this.isEditable) await toggleEquip(this.document, item);
  }

  /** Attack with the clicked weapon, else the equipped one, else bare Acerto (crit 20). Shift skips the dialog. */
  static async _onAttackWeapon(event, target) {
    const actor = this.document;
    const item = this._itemFrom(target) ?? actor.items.find((i) => i.type === "weapon" && i.system.equipped) ?? null;
    const opts = event.shiftKey ? { mode: this._rollMode } : await askAttack(actor, item, { mode: this._rollMode });
    if (opts) await attackWithWeapon(actor, item, opts);
  }

  static async _onUseItem(event, target) {
    const item = this._itemFrom(target);
    if (item) await useGear(this.document, item);
  }

  static _onEditItem(event, target) {
    this._itemFrom(target)?.sheet.render({ force: true });
  }

  static async _onDeleteItem(event, target) {
    const item = this._itemFrom(target);
    if (!item || !this.isEditable) return;
    const ok = await DialogV2.confirm({
      window: { title: "Descartar item" },
      content: `<p>Descartar <strong>${item.name.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)}</strong>${item.system.quantity > 1 ? ` (${item.system.quantity} unidades)` : ""}? Não dá para desfazer.</p>`,
      rejectClose: false,
    });
    if (ok) await item.delete();
  }

  static async _onAddCatalogWeapon() {
    if (!this.isEditable) return;
    const [created] = (await addWeaponFromCatalog(this.document)) ?? [];
    if (created) this._nasInv.selected = created.id;
  }

  static async _onCreateItem() {
    if (!this.isEditable) return;
    const [item] = await this.document.createEmbeddedDocuments("Item", [{ name: "Novo item", type: "gear" }]);
    this._nasInv.selected = item.id;
    item.sheet.render({ force: true });
  }

  static async _onSetProfile(event, target) {
    const item = this._itemFrom(target);
    if (item && this.isEditable) await item.update({ "system.profileIndex": Number(target.dataset.index) || 0 });
  }

  /** Native tab switch + section badge update, no re-render. */
  static _onNav(event, target) {
    const tab = target.dataset.tab;
    const nav = NAV.find((n) => n.id === tab);
    if (!nav) return;
    this.changeTab(tab, "primary", { event });
    const badge = this.element.querySelector(".nas-section-badge");
    if (badge) {
      badge.querySelector("h2").textContent = nav.name;
      badge.querySelector("h2 + span").textContent = nav.subtitle;
      badge.querySelector(".nas-emblem i").className = `fa-solid ${nav.icon}`;
    }
    this.element.querySelectorAll(".nas-nav-item").forEach((b) => {
      const on = b.dataset.tab === tab;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-current", on ? "page" : "false");
    });
  }

  static async _onRollMode(event, target) {
    if (!(target.dataset.mode in ROLL_MODES)) return;
    this._rollMode = target.dataset.mode;
    this.element.querySelectorAll("[data-action='rollMode']").forEach((b) => {
      const on = b.dataset.mode === this._rollMode;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-pressed", String(on));
    });
  }

  static async _onAttribute(event, target) {
    const attrId = target.dataset.attribute;
    if (!ATTR[attrId]) return;
    await this._roll(event, { label: `Teste de ${ATTR[attrId].full}`, attrId, channel: "teste" });
  }

  static async _onSkill(event, target) {
    const skill = SKILLS.find((s) => s.name === target.dataset.skill);
    if (!skill) return;
    let channel = "teste";
    if (skill.name === "Percepção") {
      channel = await DialogV2.wait({
        window: { title: "Percepção" },
        content: "<p>Qual sentido?</p>",
        buttons: [
          { action: "percepcaoVisual", label: "Visual", default: true },
          { action: "percepcaoAuditiva", label: "Auditiva" },
          { action: "teste", label: "Geral" },
        ],
        rejectClose: false,
      });
      if (!channel) return;
    }
    const label = channel === "percepcaoVisual" ? "Percepção visual" : channel === "percepcaoAuditiva" ? "Percepção auditiva" : skill.name;
    await this._roll(event, { label, attrId: skill.attr, channel });
  }

  /** Bloqueio/Esquiva go through the test dialog; Acerto is the attack sequence (equipped weapon or bare). */
  static async _onCombat(event, target) {
    const test = COMBAT_TESTS[target.dataset.test];
    if (!test) return;
    if (target.dataset.test === "acerto") return SlayerSheet._onAttackWeapon.call(this, event, target);
    await this._roll(event, { label: test.label, attrId: test.attrs[0], channel: target.dataset.test, critFolego: true });
  }

  static async _onInitiative(event) {
    const actor = this.document;
    const opts = { label: "Iniciativa (proposta de mesa)", attrId: "dex", channel: "iniciativa" };
    const combatant = game.combat?.getCombatantsByActor?.(actor)?.[0];
    if (!combatant) {
      ui.notifications.info("Fora de combate: rolando Iniciativa só no chat.");
      return this._roll(event, opts);
    }
    const choice = event.shiftKey ? { mode: this._rollMode, manual: "" } : await askRoll(actor, { ...opts, mode: this._rollMode });
    if (!choice) return;
    // Reminders for initiative change the die and add their terms, like any other roll.
    const ids = choice.reminders ?? actor.system.reminders.filter((r) => r.scope === "iniciativa" || r.scope === "todos").map((r) => r.id);
    const mods = rollModifiers(actor, { attrId: "dex", scope: "iniciativa", ids, mode: choice.mode });
    const term = manualTerm(choice.manual);
    const formula = `${INITIATIVE_FORMULA.replace("1d20", ROLL_MODES[mods.finalMode].die)}${term ? ` ${term}` : ""}${mods.terms.map((t) => ` ${t}`).join("")}`;
    await actor.rollInitiative({ createCombatants: false, rerollInitiative: true, initiativeOptions: { formula } });
    await consumeUsed(actor, ids);
  }

  /** Every d20 test goes through the pre-roll dialog (reminders, manual bonus, CD, mode); Shift-click rolls straight away. */
  async _roll(event, opts) {
    const choice = event?.shiftKey ? { mode: this._rollMode, manual: "" } : await askRoll(this.document, { ...opts, mode: this._rollMode });
    if (!choice) return;
    await rollCheck(this.document, { ...opts, ...choice });
  }

  /** Free damage roll (legacy damage dialog): entries, weapon damage, presets, PDR, critical. */
  static async _onRollDamageDialog() {
    const res = await askDamage(this.document, { title: "Rolar dano" });
    if (res) await rollDamageEntries(this.document, res);
  }

  /** Reminder form in the Estados tab: nameless inputs (kept out of submitOnChange), read on click. */
  static async _onAddReminder(event, target) {
    if (!this.isEditable) return;
    const box = target.closest(".nas-reminder-form");
    const val = (cls) => box.querySelector(cls)?.value ?? "";
    const label = val(".r-label").trim();
    if (!label) return ui.notifications.warn("Dê um nome ao lembrete (ex.: Manobra: Vantagem no próximo acerto).");
    const mode = val(".r-mode");
    const bonus = val(".r-bonus").trim();
    if (!mode && !bonus) return ui.notifications.warn("O lembrete precisa de um modo (Vantagem/Desvantagem) ou de um bônus.");
    await addReminder(this.document, { label, scope: val(".r-scope"), mode, bonus, uses: Math.max(0, Math.trunc(Number(val(".r-uses")) || 0)) });
  }

  static async _onRemoveReminder(event, target) {
    if (this.isEditable) await removeReminder(this.document, target.dataset.id);
  }

  static async _onUseFreeze() {
    if (this.isEditable) await useFreeze(this.document);
  }

  static async _onWindLongRest() {
    if (!this.isEditable) return;
    const ok = await DialogV2.confirm({
      window: { title: "Sangue Especial · descanso longo" },
      content: "<p>Consolidar o dano da última batalha em Cicatrizes (+CAR) e Resistência Vital (+VIT)? O contador da batalha zera.</p>",
      rejectClose: false,
    });
    if (ok) await windLongRest(this.document);
  }

  static async _onUseForm(event, target) {
    const d = this.document.system.derived;
    const form = d.breathing ? formsFor(d.breathing.key, d.breathingLevel).find((f) => f.id === target.dataset.form) : null;
    if (!form?.unlocked) return ui.notifications.warn("Forma ainda não liberada no seu nível de Respiração.");
    const choice = await askFormLevel(this.document, form);
    if (!choice) return;
    await useForm(this.document, form, choice.level, choice.manual, { reminders: choice.reminders, messageMode: choice.messageMode });
  }

  static async _onToggleStatus(event, target) {
    if (!this.isEditable) return;
    await this.document.toggleStatusEffect(target.dataset.status);
  }

  static async _onToggleAction(event, target) {
    const key = target.dataset.key;
    if (!this.isEditable || !ACTION_SLOTS.some((s) => s.key === key)) return;
    await this.document.update({ [`system.actions.${key}`]: !this.document.system.actions[key] });
  }

  static async _onResetTurn() {
    if (!this.isEditable) return;
    await this.document.update(Object.fromEntries(ACTION_SLOTS.map((s) => [`system.actions.${s.key}`, false])));
  }

  static async _onDeathMark(event, target) {
    if (!this.isEditable) return;
    const marks = Math.min(3, Math.max(0, this.document.system.death.marks + Number(target.dataset.delta)));
    await this.document.update({ "system.death.marks": marks });
  }

  static async _onFall(event, target) {
    if (!this.isEditable) return;
    const falls = Math.max(0, this.document.system.death.falls + Number(target.dataset.delta));
    await this.document.update({ "system.death.falls": falls });
  }

  /** Ação Épica: spends 5 Fôlego and restores all PDR (Mecanicas_Centrais §Ação Épica); undo only by GM. */
  static async _onToggleEpic() {
    const actor = this.document;
    const sys = actor.system;
    if (!this.isEditable) return;
    if (sys.epic.usedThisArc) {
      if (!game.user.isGM) return ui.notifications.warn("Só o Mestre libera a Ação Épica de novo (novo arco).");
      return actor.update({ "system.epic.usedThisArc": false });
    }
    if (sys.resources.folego.value < 5) return ui.notifications.warn("A Ação Épica custa 5 de Fôlego de Combate.");
    const ok = await DialogV2.confirm({
      window: { title: "Ação Épica" },
      content: "<p>Gastar 5 Fôlego, narrar o Flashback/Memória e recuperar todo o PDR? Depois do golpe vem o Colapso Total.</p>",
      rejectClose: false,
    });
    if (!ok) return;
    await actor.update({
      "system.epic.usedThisArc": true,
      "system.resources.folego.value": sys.resources.folego.value - 5,
      "system.resources.pdr.value": sys.resources.pdr.max ?? sys.resources.pdr.value,
    });
    await ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({ actor }),
      content: `<p><strong>${actor.name}</strong> usa a <strong>Ação Épica</strong>: −5 Fôlego, PDR cheio, Forma Final. O golpe é Crítico Indefensável; depois, Colapso Total.</p>`,
    });
  }

  /** Damage or healing typed on the sheet (e.g. from a GM narration), through the same rules as the chat cards. */
  static async _onSelfDamage(event, target) {
    const healing = target.dataset.mode === "heal";
    const amount = await DialogV2.prompt({
      window: { title: healing ? "Curar PDV" : "Receber dano" },
      content: `<label>Quantidade <input type="number" name="amount" min="0" value="0" autofocus></label>`,
      ok: { label: healing ? "Curar" : "Aplicar", callback: (ev, button) => Number(button.form.elements.amount.value) || 0 },
      rejectClose: false,
    });
    if (amount) await applyToActor(this.document, amount, healing);
  }

  static async _onStartCreation() {
    if (!this.isEditable) return;
    const app = foundry.applications.instances.get(`nas-creation-${this.document.id}`) ?? new SlayerCreationApp(this.document);
    await app.render({ force: true });
  }

  static async _onLevelUp() {
    if (!this.isEditable) return;
    await levelUp(this.document);
  }

  static _onUnfinished() {
    ui.notifications.info("Função reservada para uma etapa posterior do Night Assassins. Nenhuma alteração realizada.");
  }
}

