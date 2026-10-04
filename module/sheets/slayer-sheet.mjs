/**
 * Rebirth phase 1: single navigation rail, no combat formulas.
 * Architectural reference: Foundry v14 ActorSheetV2 + HandlebarsApplicationMixin.
 */
const { HandlebarsApplicationMixin } = foundry.applications.api;
const { ActorSheetV2 } = foundry.applications.sheets;

const CLASS_OPTIONS = Object.freeze([
  { id: "classe_mb", name: "Mestre de Batalha" },
  { id: "classe_usuario_de_veneno", name: "Usuário de Veneno" },
  { id: "classe_kakushi", name: "Kakushi" },
  { id: "classe_companheiro_oni", name: "Companheiro Oni" },
  { id: "classe_usuario_de_duas_resp", name: "Usuário de Duas Respirações" }
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
  { id: "origem_tsuguko", name: "Tsuguko" }
]);
const ATTRIBUTES = Object.freeze([
  { id: "vit", name: "VIT", color: "#dc3e55" },
  { id: "dex", name: "DEX", color: "#38b3e6" },
  { id: "for", name: "FOR", color: "#da8b45" },
  { id: "car", name: "CAR", color: "#ad7ce5" },
  { id: "fdv", name: "FDV", color: "#29c7c6" },
  { id: "int", name: "INT", color: "#d5af57" },
  { id: "sab", name: "SAB", color: "#d3d0cd" }
]);
const SKILLS = Object.freeze([
  "Arremesso", "Atletismo", "Arrombamento", "Acrobacia", "Corrida", "História",
  "Intuição", "Religião", "Foco", "Adestramento", "Percepção", "Linguística",
  "Sobrevivência", "Enganação", "Investigação", "Presença", "Etiqueta", "Performance"
]);
const NAV = Object.freeze([
  { id: "personagem", name: "Personagem", icon: "fa-user", subtitle: "Identidade e atributos" },
  { id: "combate", name: "Combate", icon: "fa-shield-halved", subtitle: "Arsenal e habilidades" },
  { id: "testes", name: "Testes", icon: "fa-dice-d20", subtitle: "Perícias e rolagens" },
  { id: "estados", name: "Estados", icon: "fa-star-of-life", subtitle: "Condições e efeitos" },
  { id: "inventario", name: "Inventário", icon: "fa-bag-shopping", subtitle: "Itens e consumíveis" },
  { id: "diario", name: "Diário", icon: "fa-book-open", subtitle: "Jornal de missões" },
  { id: "configuracoes", name: "Configurações", icon: "fa-gear", subtitle: "Opções da ficha" }
]);

export class SlayerSheet extends HandlebarsApplicationMixin(ActorSheetV2) {
  _activeTab = "personagem";
  _expanded = false;

  static DEFAULT_OPTIONS = {
    classes: ["nas-sheet"],
    position: { width: 1440, height: 850 },
    window: { resizable: true },
    form: { submitOnChange: true, closeOnSubmit: false },
    actions: {
      nav: this._onNav,
      expand: this._onExpand,
      attribute: this._onAttribute,
      unfinished: this._onUnfinished
    }
  };

  static PARTS = {
    body: { template: "systems/night-assassins/templates/actor/slayer-sheet.hbs", scrollable: [".nas-main", ".nas-attribute-rail"] }
  };

  async _prepareContext(options) {
    const context = await super._prepareContext(options);
    const actor = this.document;
    const data = actor.system;
    const resources = [
      { id: "pdv", name: "PDV", className: "pdv" },
      { id: "pdr", name: "PDR", className: "pdr" },
      { id: "folego", name: "Fôlego", className: "folego" }
    ].map(r => {
      const values = data.resources[r.id];
      const percent = values.max > 0 ? Math.min(100, Math.max(0, (values.value / values.max) * 100)) : 0;
      return { ...r, value: values.value, max: values.max, percent };
    });

    return {
      ...context,
      actor,
      system: data,
      editable: this.isEditable,
      nav: NAV.map(n => ({ ...n, active: n.id === this._activeTab })),
      currentTab: NAV.find(n => n.id === this._activeTab),
      tabs: Object.fromEntries(NAV.map(n => [n.id, this._activeTab === n.id])),
      resources,
      attributes: ATTRIBUTES.map(a => ({ ...a, value: data.attributes[a.id] })),
      skills: SKILLS,
      classes: CLASS_OPTIONS.map(c => ({ ...c, selected: c.id === data.classId })),
      origins: ORIGIN_OPTIONS.map(o => ({ ...o, selected: o.id === data.originId }))
    };
  }

  static async _onNav(event, target) {
    const name = target.dataset.tab;
    if (!NAV.some(t => t.id === name)) return;
    this._activeTab = name;
    await this.render();
  }

  static async _onExpand() {
    this._expanded = !this._expanded;
    this.element?.classList.toggle("nas-expanded", this._expanded);
  }

  static _onAttribute(event, target) {
    const attr = target.dataset.attribute;
    if (!ATTRIBUTES.some(a => a.id === attr)) return;
    ui.notifications.info(`Teste de ${attr.toUpperCase()}: fórmula ainda não implementada. Nenhuma rolagem foi realizada.`);
  }

  static _onUnfinished() {
    ui.notifications.info("Função reservada para uma etapa posterior do Night Assassins. Nenhuma alteração realizada.");
  }
}
