/**
 * Level 0 → 1 creation wizard (plans/night-assassins-criacao-atributos-progressao.md §8, Caçador).
 * Steps: attributes (array / 7d4 ×3 / Discord) → Origin (1d12 with 2 chances, or a choice the GM allowed)
 * → Blood Gift (2–3d100 keep highest, or a choice the GM allowed) → Breathing and weapon → summary.
 * Procedure ported from the legacy attribute-dialogs.mjs; rules live in module/core.
 * "2 chances" for the Origin is a table rule stated by the operator (the rule files only give the d12 table).
 */
import { ATTRIBUTE_IDS, GIFTS, ORIGINS, attributeSnapshots, folegoMax, slayerMaxResources } from "../core/progression.mjs";
import {
  MAX_POOL_ATTEMPTS, STANDARD_POOL, assignPool, giftFromD100, giftRollCount, originFromD12, parseDiscordPool,
  poolAttemptOptions,
} from "../core/creation.mjs";
import { giftAttributeBonuses } from "../core/bonuses.mjs";
import { BREATHINGS } from "../core/breathing.mjs";
import { canChoose, chatNotice, rollToChat } from "./rolls.mjs";

const { HandlebarsApplicationMixin, ApplicationV2, DialogV2 } = foundry.applications.api;

const ATTR_LABELS = { vit: "VIT", dex: "DEX", for: "FOR", car: "CAR", fdv: "FDV", int: "INT", sab: "SAB" };
const STEPS = ["Atributos", "Origem", "Dom do Sangue", "Respiração e arma", "Resumo"];
const ORIGIN_CHANCES = 2;
const EARLY_CLASSES = [
  { id: "classe_usuario_de_duas_resp", name: "Usuário de Duas Respirações" },
  { id: "classe_companheiro_oni", name: "Companheiro Oni" },
];
const escapeHtml = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const METHOD_TEXT = { rolada: "rolada", rolado: "rolado", escolhida: "escolhida com permissão do Mestre", escolhido: "escolhido com permissão do Mestre" };

export class SlayerCreationApp extends HandlebarsApplicationMixin(ApplicationV2) {
  constructor(actor, options = {}) {
    super({ id: `nas-creation-${actor.id}`, ...options });
    this.actor = actor;
    this.wiz = {
      step: 0, method: "", attempts: [], pool: null, slots: {}, discordRaw: "",
      originId: "", originMethod: "", originRolls: [], originAllowed: false,
      giftRolls: [], gift: "", giftMethod: "", giftAllowed: false, giftAttr: "", ancientBlood: false,
      breathing: "", weapon: "", earlyClass: "", busy: false,
    };
  }

  static DEFAULT_OPTIONS = {
    classes: ["nas-sheet", "nas-wizard"],
    window: { title: "Criação do Caçador", icon: "fa-solid fa-scroll", resizable: true },
    position: { width: 800, height: "auto" },
    actions: {
      method: this.#onMethod,
      rollPool: this.#onRollPool,
      usePool: this.#onUsePool,
      useDiscord: this.#onUseDiscord,
      rollOrigin: this.#onRollOrigin,
      askOrigin: this.#onAskOrigin,
      rollGift: this.#onRollGift,
      askGift: this.#onAskGift,
      toggleAncient: this.#onToggleAncient,
      next: this.#onNext,
      back: this.#onBack,
      finish: this.#onFinish,
    },
  };

  static PARTS = { body: { template: "systems/night-assassins/templates/apps/slayer-creation.hbs" } };

  get title() {
    return `Criação do Caçador: ${this.actor.name}`;
  }

  #values() {
    if (!this.wiz.pool) return null;
    const r = assignPool(this.wiz.pool, this.wiz.slots);
    return r.ok ? r.values : null;
  }

  #stepError() {
    const s = this.wiz;
    if (s.step === 0) {
      if (!s.pool) return "Escolha o método e defina os sete valores.";
      const r = assignPool(s.pool, s.slots);
      if (r.duplicated.length) return `Cada valor só pode ser usado uma vez (repetido em ${r.duplicated.map((a) => ATTR_LABELS[a]).join(", ")}).`;
      if (r.missing.length) return `Falta distribuir: ${r.missing.map((a) => ATTR_LABELS[a]).join(", ")}.`;
    }
    if (s.step === 1 && !s.originId) return "Role a Origem (1d12, 2 chances) ou escolha, se o Mestre deixou.";
    if (s.step === 2 && !s.gift) return "Role o Dom do Sangue ou escolha, se o Mestre deixou.";
    if (s.step === 2 && s.gift === "marca_do_destino" && !s.giftAttr) return "Marca do Destino: escolha o atributo que recebe o bônus.";
    if (s.step === 3 && !s.breathing) return "Escolha a Respiração Primária (com aprovação do Mestre).";
    return "";
  }

  async _prepareContext() {
    const s = this.wiz;
    const values = this.#values();
    const opts = poolAttemptOptions(s.attempts.length);
    const origin = ORIGINS[s.originId];
    let preview = null;
    if (values && origin) {
      const gift = giftAttributeBonuses(s.gift, 1, s.giftAttr);
      const permanent = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, values[id] + gift[id]]));
      const max = slayerMaxResources({ level: 1, origin, snapshots: attributeSnapshots(permanent), gift: s.gift });
      preview = { ...max, folego: folegoMax(permanent.fdv) };
    }
    // Hide values already taken by another attribute (the dropdown only lists what is still free).
    const takenBy = Object.fromEntries(Object.entries(s.slots).filter(([, v]) => v !== "" && v !== undefined).map(([k, v]) => [String(v), k]));
    const originChoosable = canChoose("allowChooseOrigin") || s.originAllowed;
    const giftChoosable = canChoose("allowChooseGift") || s.giftAllowed;
    const originRollsLeft = ORIGIN_CHANCES - s.originRolls.length;
    return {
      actor: this.actor,
      s,
      steps: STEPS.map((label, i) => ({ label, n: i + 1, active: i === s.step, done: i < s.step })),
      isStep: Object.fromEntries(STEPS.map((_, i) => [i, i === s.step])),
      first: s.step === 0,
      last: s.step === STEPS.length - 1,
      error: this.#stepError(),
      standardPool: STANDARD_POOL.join(" · "),
      attempts: s.attempts.map((pool, i) => ({
        n: i + 1, text: pool.join(" · "), usable: opts.usable.includes(i + 1) && s.attempts.length < MAX_POOL_ATTEMPTS,
        chosen: s.pool === pool,
      })),
      canRollPool: s.method === "roll" && opts.canReroll && !s.busy,
      attemptsLeft: MAX_POOL_ATTEMPTS - s.attempts.length,
      discord: parseDiscordPool(s.discordRaw),
      distribution: s.pool
        ? ATTRIBUTE_IDS.map((id) => ({
            id, label: ATTR_LABELS[id],
            options: s.pool
              .map((v, idx) => ({ idx, v, selected: String(s.slots[id] ?? "") === String(idx) }))
              .filter((o) => o.selected || !takenBy[String(o.idx)]),
          }))
        : null,
      poolText: s.pool ? s.pool.join(" · ") : "",
      origin: origin ? { ...origin, id: s.originId } : null,
      originRolls: s.originRolls,
      originCanRoll: originRollsLeft > 0 && s.originMethod !== "escolhida" && !s.busy,
      originRollLabel: s.originRolls.length ? `Usar a 2ª chance (vale a 2ª)` : "Rolar 1d12",
      originRollsLeft,
      originChoosable,
      originChoices: originChoosable
        ? Object.entries(ORIGINS).map(([id, o]) => ({ id, name: `${o.d12}. ${o.name}`, selected: id === s.originId }))
        : null,
      giftDice: giftRollCount(s.originId, s.ancientBlood),
      gift: s.gift ? { ...GIFTS[s.gift], id: s.gift } : null,
      giftChoosable,
      giftChoices: giftChoosable
        ? Object.entries(GIFTS).map(([id, g]) => ({ id, name: `${g.range} · ${g.name}`, selected: id === s.gift }))
        : null,
      needGiftAttr: s.gift === "marca_do_destino",
      giftAttrOptions: ATTRIBUTE_IDS.map((id) => ({ id, label: ATTR_LABELS[id], selected: id === s.giftAttr })),
      isGM: game.user.isGM,
      breathings: BREATHINGS.map((b) => ({ name: b.name, selected: b.name === s.breathing, missing: !b.formsCatalogued })),
      earlyClasses: canChoose("allowEarlyClass") ? EARLY_CLASSES.map((c) => ({ ...c, selected: c.id === s.earlyClass })) : null,
      values: values ? ATTRIBUTE_IDS.map((id) => ({ label: ATTR_LABELS[id], v: values[id] })) : null,
      methodText: METHOD_TEXT,
      preview,
    };
  }

  _onRender(context, options) {
    super._onRender?.(context, options);
    const el = this.element;
    el.querySelectorAll("select[data-slot]").forEach((sel) =>
      sel.addEventListener("change", () => { this.wiz.slots[sel.dataset.slot] = sel.value; this.render(); }));
    el.querySelector("textarea[name=discord]")?.addEventListener("input", (ev) => {
      this.wiz.discordRaw = ev.target.value;
      const p = parseDiscordPool(ev.target.value);
      const out = el.querySelector(".nas-discord-counter");
      if (out) { out.textContent = p.text; out.dataset.ok = String(p.ok); }
    });
    el.querySelector("select[name=originChoice]")?.addEventListener("change", (ev) => {
      Object.assign(this.wiz, { originId: ev.target.value, originMethod: ev.target.value ? "escolhida" : "" });
      this.render();
    });
    el.querySelector("select[name=giftChoice]")?.addEventListener("change", (ev) => {
      Object.assign(this.wiz, { gift: ev.target.value, giftMethod: ev.target.value ? "escolhido" : "", giftRolls: [] });
      this.render();
    });
    el.querySelector("select[name=giftAttr]")?.addEventListener("change", (ev) => { this.wiz.giftAttr = ev.target.value; this.render(); });
    for (const name of ["breathing", "weapon", "earlyClass"]) {
      el.querySelector(`[name=${name}]`)?.addEventListener("change", (ev) => { this.wiz[name] = ev.target.value; this.render(); });
    }
  }

  /** "O Mestre deixou escolher?" asked in the flow; a yes is announced in chat so the GM sees it. */
  async #askGM(what) {
    const yes = await DialogV2.confirm({
      window: { title: `Escolher ${what}` },
      content: `<p>O Mestre deixou você escolher ${what} em vez de rolar?</p><p class="nas-muted">A resposta vai para o chat.</p>`,
      rejectClose: false,
    });
    if (yes) await chatNotice(this.actor, `<p><strong>${escapeHtml(this.actor.name)}</strong> vai <strong>escolher ${what}</strong> na criação, com permissão do Mestre (declarada pelo jogador).</p>`);
    return Boolean(yes);
  }

  static async #onMethod(event, target) {
    const method = target.dataset.method;
    Object.assign(this.wiz, { method, slots: {}, pool: method === "standard" ? [...STANDARD_POOL] : null, attempts: [] });
    this.render();
  }

  static async #onRollPool() {
    const s = this.wiz;
    if (s.busy || !poolAttemptOptions(s.attempts.length).canReroll) return;
    s.busy = true;
    this.render();
    try {
      const n = s.attempts.length + 1;
      const roll = await rollToChat("7d4", this.actor, `Criação: atributos, ${n}ª rolagem de 7d4${n === MAX_POOL_ATTEMPTS ? " (obrigatória)" : ""}`);
      const pool = roll.dice[0].results.map((r) => Number(r.result));
      s.attempts.push(pool);
      s.slots = {};
      s.pool = s.attempts.length === MAX_POOL_ATTEMPTS ? pool : null; // §1.2: the 3rd roll is mandatory
    } finally {
      s.busy = false;
      this.render();
    }
  }

  static async #onUsePool(event, target) {
    const i = Number(target.dataset.attempt) - 1;
    if (!poolAttemptOptions(this.wiz.attempts.length).usable.includes(i + 1)) return;
    Object.assign(this.wiz, { pool: this.wiz.attempts[i], slots: {} });
    this.render();
  }

  static async #onUseDiscord() {
    const p = parseDiscordPool(this.wiz.discordRaw);
    if (!p.ok) return ui.notifications.warn(`Valores do Discord: ${p.text}.`);
    Object.assign(this.wiz, { pool: p.values, slots: {} });
    this.render();
  }

  /** 1d12, two chances: the second roll replaces the first and is final. */
  static async #onRollOrigin() {
    const s = this.wiz;
    if (s.busy || s.originRolls.length >= ORIGIN_CHANCES) return;
    s.busy = true;
    this.render();
    try {
      const n = s.originRolls.length + 1;
      const roll = await rollToChat("1d12", this.actor, `Criação: Origem (1d12), ${n}ª chance${n === ORIGIN_CHANCES ? " (final)" : ""}`);
      s.originRolls.push(roll.total);
      Object.assign(s, { originId: originFromD12(roll.total), originMethod: "rolada" });
    } finally {
      s.busy = false;
      this.render();
    }
  }

  static async #onAskOrigin() {
    if (await this.#askGM("a Origem")) { this.wiz.originAllowed = true; this.render(); }
  }

  static async #onAskGift() {
    if (await this.#askGM("o Dom do Sangue")) { this.wiz.giftAllowed = true; this.render(); }
  }

  static async #onToggleAncient() {
    if (!game.user.isGM || this.wiz.giftMethod === "rolado") return;
    this.wiz.ancientBlood = !this.wiz.ancientBlood;
    this.render();
  }

  static async #onRollGift() {
    const s = this.wiz;
    if (s.busy || s.giftMethod === "rolado") return;
    s.busy = true;
    this.render();
    try {
      const n = giftRollCount(s.originId, s.ancientBlood);
      const roll = await rollToChat(`${n}d100kh`, this.actor, `Criação: Dom do Sangue (${n}d100, fica o maior)`);
      Object.assign(s, { giftRolls: roll.dice[0].results.map((r) => Number(r.result)), gift: giftFromD100(roll.total), giftMethod: "rolado" });
    } finally {
      s.busy = false;
      this.render();
    }
  }

  static async #onNext() {
    const err = this.#stepError();
    if (err) return ui.notifications.warn(err);
    this.wiz.step = Math.min(STEPS.length - 1, this.wiz.step + 1);
    this.render();
  }

  static async #onBack() {
    this.wiz.step = Math.max(0, this.wiz.step - 1);
    this.render();
  }

  static async #onFinish() {
    const s = this.wiz;
    const values = this.#values();
    if (!values || !s.originId || !s.gift || !s.breathing) return ui.notifications.warn("Há etapas incompletas.");
    if (!this.actor.isOwner) return ui.notifications.error("Só o dono da ficha pode concluir a criação.");
    const origin = ORIGINS[s.originId];
    const gift = giftAttributeBonuses(s.gift, 1, s.giftAttr);
    const permanent = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, values[id] + gift[id]]));
    const max = slayerMaxResources({ level: 1, origin, snapshots: attributeSnapshots(permanent), gift: s.gift });
    const update = {
      "system.level": 1,
      "system.attributes": values,
      "system.originId": s.originId,
      "system.gift": s.gift,
      "system.giftAttr": s.gift === "marca_do_destino" ? s.giftAttr : "",
      "system.breathing": s.breathing,
      "system.proficientWeapon": s.weapon.trim(),
      "system.progression": { gain3: "", gain7: "", level14: "" },
      "system.creation": {
        method: s.method, pool: s.pool, originMethod: s.originMethod, originRoll: s.originRolls.at(-1) ?? null,
        originRolls: s.originRolls, giftMethod: s.giftMethod, giftRolls: s.giftRolls, ancientBlood: s.ancientBlood,
      },
      "system.resources.pdv.value": max.pdv,
      "system.resources.pdr.value": max.pdr,
      "system.resources.folego.value": folegoMax(permanent.fdv),
    };
    if (s.earlyClass && EARLY_CLASSES.some((c) => c.id === s.earlyClass)) update["system.classId"] = s.earlyClass;
    await this.actor.update(update);
    await chatNotice(this.actor, `<h3>${escapeHtml(this.actor.name)} criado (nível 1, Aspirante a Exterminador)</h3>
      <p><strong>Atributos:</strong> ${ATTRIBUTE_IDS.map((id) => `${ATTR_LABELS[id]} ${values[id]}`).join(" · ")}</p>
      <p><strong>Origem:</strong> ${origin.name} (${METHOD_TEXT[s.originMethod]}${s.originRolls.length ? `, d12: ${s.originRolls.join(" → ")}` : ""}) · <strong>Dom:</strong> ${GIFTS[s.gift].name} (${METHOD_TEXT[s.giftMethod]})</p>
      <p><strong>Respiração:</strong> ${escapeHtml(s.breathing)} · <strong>PDV</strong> ${max.pdv} · <strong>PDR</strong> ${max.pdr} · <strong>Fôlego</strong> ${folegoMax(permanent.fdv)}</p>`);
    await this.close();
  }
}
