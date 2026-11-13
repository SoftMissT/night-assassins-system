/**
 * Rebirth phase 2: visual shell of the seven-tab Slayer sheet, no combat formulas.
 * Values without an audited formula render as "—"; nothing here invents game data.
 * Architectural reference: Foundry v14 ActorSheetV2 + HandlebarsApplicationMixin.
 */
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const CLASS_OPTIONS = Object.freeze([
  { id: "classe_mb", name: "Mestre de Batalha" },
  { id: "classe_usuario_de_veneno", name: "Usuário de Veneno" },
  { id: "classe_kakushi", name: "Kakushi" },
  { id: "classe_companheiro_oni", name: "Companheiro Oni" },
  { id: "classe_usuario_de_duas_resp", name: "Usuário de Duas Respirações" },
]);
const ORIGIN_OPTIONS = Object.freeze([
  { id: "origem_artista_marcial", name: "Artista Marcial" },
  { id: "origem_civilizado", name: "Civilizado" },
  { id: "origem_corsario", name: "Corsário" },
  { id: "origem_criado_ex_hashira", name: "Criado por Ex-Hashira" },
  { id: "origem_descendente_perdido", name: "Descendente Perdido" },
  { id: "origem_estrangeiro", name: "Estrangeiro" },
  { id: "origem_isolado", name: "Isolado" },
  { id: "origem_militar", name: "Militar" },
  { id: "origem_monge", name: "Monge" },
  { id: "origem_ninja", name: "Ninja" },
  { id: "origem_samurai", name: "Samurai" },
  { id: "origem_tsuguko", name: "Tsuguko" },
]);
const ATTRIBUTES = Object.freeze([
  { id: "vit", name: "VIT", color: "#dc3e55" },
  { id: "dex", name: "DEX", color: "#38b3e6" },
  { id: "for", name: "FOR", color: "#da8b45" },
  { id: "car", name: "CAR", color: "#ad7ce5" },
  { id: "fdv", name: "FDV", color: "#29c7c6" },
  { id: "int", name: "INT", color: "#d5af57" },
  { id: "sab", name: "SAB", color: "#d3d0cd" },
]);
/** Skill → attribute pairing as shown in the approved mockup 03-testes-corrigido; rules confirmation pending. */
const SKILLS = Object.freeze([
  { name: "Arremesso", attr: "for" },
  { name: "Atletismo", attr: "for" },
  { name: "Arrombamento", attr: "dex" },
  { name: "Acrobacia", attr: "dex" },
  { name: "Corrida", attr: "dex" },
  { name: "História", attr: "int" },
  { name: "Intuição", attr: "sab" },
  { name: "Religião", attr: "sab" },
  { name: "Foco", attr: "fdv" },
  { name: "Adestramento", attr: "fdv" },
  { name: "Percepção", attr: "sab" },
  { name: "Linguística", attr: "int" },
  { name: "Sobrevivência", attr: "sab" },
  { name: "Enganação", attr: "car" },
  { name: "Investigação", attr: "int" },
  { name: "Presença", attr: "car" },
  { name: "Etiqueta", attr: "car" },
  { name: "Performance", attr: "car" },
]);
/** Slugs of the bundled art in assets/icons/breathing/resp_<slug>.webp. */
const BREATHING_ICONS = Object.freeze(
  new Set(
    "agua ameixeira amor aranha areia besta cerejeira chamas corvo cristal dragao eclipse estrelas flor grama inseto lobo lua luz macaco madeira magma metal nevasca neve nevoa pedra raposa sangue serpente sol som sombras sonhos tartaruga tempo tigre tinta tormenta trovao tubarao vagalume veneno vento".split(
      " ",
    ),
  ),
);
const COMBAT_STATS = Object.freeze([
  { label: "Acerto", icon: "fa-crosshairs" },
  { label: "Bloqueio", icon: "fa-shield-halved" },
  { label: "Esquiva", icon: "fa-person-running" },
  { label: "Resistência", icon: "fa-shield-heart" },
  { label: "Iniciativa", icon: "fa-angles-up" },
]);
const QUICK_ACTIONS = Object.freeze([
  { label: "Ataque básico", icon: "fa-khanda" },
  { label: "Bloqueio", icon: "fa-shield-halved" },
  { label: "Esquiva", icon: "fa-person-running" },
  { label: "Usar item", icon: "fa-flask" },
  { label: "Passo rápido", icon: "fa-angles-right" },
]);
/** Per-turn action types from Mecanicas_Centrais §Tipos de Ação (Toemasa/Sistema). Épica is per campaign arc. */
const ACTION_SLOTS = Object.freeze([
  { label: "Movimento", icon: "fa-person-running" },
  { label: "Ataque", icon: "fa-khanda" },
  { label: "Especial", icon: "fa-wind" },
  { label: "Única", icon: "fa-star" },
  { label: "Completa", icon: "fa-circle-notch" },
  { label: "Reação", icon: "fa-share" },
  { label: "Épica", icon: "fa-crown" },
]);
const NAV = Object.freeze([
  {
    id: "personagem",
    name: "Personagem",
    icon: "fa-user",
    subtitle: "Identidade e atributos",
  },
  {
    id: "combate",
    name: "Combate",
    icon: "fa-khanda",
    subtitle: "Arsenal e habilidades",
  },
  {
    id: "testes",
    name: "Testes",
    icon: "fa-dice-d20",
    subtitle: "Perícias e rolagens",
  },
  {
    id: "estados",
    name: "Estados",
    icon: "fa-star-of-life",
    subtitle: "Condições e efeitos",
  },
  {
    id: "inventario",
    name: "Inventário",
    icon: "fa-bag-shopping",
    subtitle: "Itens e consumíveis",
  },
  {
    id: "diario",
    name: "Diário",
    icon: "fa-book-open",
    subtitle: "Missões e anotações",
  },
  {
    id: "configuracoes",
    name: "Configurações",
    icon: "fa-gear",
    subtitle: "Ajustes da ficha",
  },
]);

/** "Respiração da Água" → "agua"; returns "" when no bundled icon matches. */
function breathingSlug(text) {
  const slug = String(text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/^\s*respiracao\s+(da|do|de|das|dos)?\s*/, "")
    .trim()
    .replace(/s$/, "");
  if (BREATHING_ICONS.has(slug)) return slug;
  if (BREATHING_ICONS.has(`${slug}s`)) return `${slug}s`;
  return "";
}

export class SlayerSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  _activeTab = "personagem";

  static DEFAULT_OPTIONS = {
    classes: ["nas-sheet"],
    position: { width: 1440, height: 860 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      nav: this._onNav,
      attribute: this._onAttribute,
      unfinished: this._onUnfinished,
    },
  };

  static PARTS = {
    body: {
      template: "systems/night-assassins/templates/actor/slayer-sheet.hbs",
      scrollable: [".nas-main", ".nas-attribute-rail"],
    },
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const data = actor.system;
    const resources = [
      { id: "pdv", name: "PDV", className: "pdv", icon: "fa-heart" },
      { id: "pdr", name: "PDR", className: "pdr", icon: "fa-fire-flame-curved" },
      { id: "folego", name: "Fôlego", className: "folego", icon: "fa-wind" },
    ].map((r) => {
      const values = data.resources[r.id];
      const percent =
        values.max > 0
          ? Math.min(100, Math.max(0, (values.value / values.max) * 100))
          : 0;
      return { ...r, value: values.value, max: values.max, percent };
    });
    const attrName = Object.fromEntries(ATTRIBUTES.map((a) => [a.id, a]));
    const className = CLASS_OPTIONS.find((c) => c.id === data.classId)?.name;
    const originName = ORIGIN_OPTIONS.find((o) => o.id === data.originId)?.name;
    const slug = breathingSlug(data.breathing);

    return {
      ...context,
      actor,
      system: data,
      editable: this.isEditable,
      nav: NAV.map((n) => ({ ...n, active: n.id === this._activeTab })),
      currentTab: NAV.find((n) => n.id === this._activeTab),
      tabs: Object.fromEntries(
        NAV.map((n) => [n.id, this._activeTab === n.id]),
      ),
      resources,
      attributes: ATTRIBUTES.map((a) => ({
        ...a,
        value: data.attributes[a.id],
      })),
      skills: SKILLS.map((s) => ({
        ...s,
        attrLabel: attrName[s.attr].name,
        color: attrName[s.attr].color,
      })),
      classes: CLASS_OPTIONS.map((c) => ({
        ...c,
        selected: c.id === data.classId,
      })),
      origins: ORIGIN_OPTIONS.map((o) => ({
        ...o,
        selected: o.id === data.originId,
      })),
      identityLine: [className ?? "Slayer", data.breathing, data.rank]
        .filter(Boolean)
        .join(" · "),
      className: className ?? "",
      originName: originName ?? "",
      breathingIcon: slug
        ? `systems/night-assassins/assets/icons/breathing/resp_${slug}.webp`
        : "",
      combatStats: COMBAT_STATS,
      quickActions: QUICK_ACTIONS,
      actionSlots: ACTION_SLOTS,
      versions: { system: game.system.version, core: game.version },
    };
  }

  static async _onNav(event, target) {
    const name = target.dataset.tab;
    if (!NAV.some((t) => t.id === name)) return;
    this._activeTab = name;
    await this.render();
  }

  static _onAttribute(event, target) {
    const attr = target.dataset.attribute;
    if (!ATTRIBUTES.some((a) => a.id === attr)) return;
    ui.notifications.info(
      `Teste de ${attr.toUpperCase()}: fórmula ainda não implementada. Nenhuma rolagem foi realizada.`,
    );
  }

  static _onUnfinished() {
    ui.notifications.info(
      "Função reservada para uma etapa posterior do Night Assassins. Nenhuma alteração realizada.",
    );
  }
}
