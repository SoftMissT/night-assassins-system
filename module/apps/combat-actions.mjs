/**
 * Foundry-side combat automation for the Slayer: tests with bonus channels and status-driven roll modes,
 * Breathing Forms (PDR + action + damage), damage cards with Apply/Heal, Combat Breath and turn resets.
 * Rules live in module/core; this file only reads/writes documents and chat.
 */
import { CHANNEL_LABELS } from "../core/bonuses.mjs";
import { actionsToSpend, damageFormula, damageLabel, formLevel } from "../core/breathing.mjs";
import { COMBAT_TESTS, ROLL_MODES, manualTerm, naturalResult, testFormula } from "../core/checks.mjs";
import { applyDamage, applyHealing, effectiveRollMode, folegoGain, isPositiveCritical } from "../core/combat.mjs";
import { statusRollFlags } from "../core/statuses.mjs";
import { consumeReminders, matchingReminders, reminderEffect, reminderSummary, scopeOf } from "../core/reminders.mjs";
import { DAMAGE_TYPES, entriesFormula, entriesTypes, normalizeDamageType } from "../core/damage.mjs";
import {
  FLAME_HEAT, FREEZE_FORM, FREEZE_STACKS, addFlameHeat, addFreeze, flameMultiplied, flameTier, hammerFormula, windConsolidate, windDamageSplit,
} from "../core/passives.mjs";
import {
  WEAPONS, critThreshold, hitAttributes, isConcussion, isCritical, isProficient, nextStoneBreak, stoneCritThreshold,
  weaponDamageFormula, weaponHitBonus,
} from "../core/weapons.mjs";
import { messageModeField, postCard, rollToChat } from "./rolls.mjs";

const ATTR = { vit: "VIT", dex: "DEX", for: "FOR", car: "CAR", fdv: "FDV", int: "INT", sab: "SAB" };
const ACTION_LABELS = { movimento: "Movimento", ataque: "Ataque", especial: "Especial", unica: "Única", completa: "Completa", reacao: "Reação" };
const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Single writer for combat hooks: only the active GM's client applies turn effects. */
const isWriter = () => game.users.activeGM?.isSelf ?? false;
const { DialogV2 } = foundry.applications.api;

const MANUAL_FIELD = (name, label, hint) => `<label class="nas-dialog-field">${label}
  <input type="text" name="${name}" placeholder="ex.: +2, -1, 1d4" autocomplete="off"><small>${hint}</small></label>`;
const CD_FIELD = `<label class="nas-dialog-field">CD (opcional)<input type="number" name="cd" min="0" placeholder="ex.: 15"></label>`;

/* ------------------------------------------------------------ Bonus reminders ------------------------------------------------------------ */

/**
 * "Lembretes" block of every roll dialog: statuses that force Vantagem/Desvantagem (named) and the actor's
 * reminders for this scope as checkboxes, checked by default (legacy roll-dialog "Bônus automáticos" + notes).
 */
function reminderBlock(actor, scope, attrId = "") {
  const flags = scope === "dano" ? { advantageFrom: [], disadvantageFrom: [] } : statusRollFlags(actor.statuses, attrId);
  const lines = [
    ...flags.advantageFrom.map((n) => `<li class="is-adv"><i class="fa-solid fa-angles-up"></i> Vantagem: ${esc(n)} <small>(status)</small></li>`),
    ...flags.disadvantageFrom.map((n) => `<li class="is-dis"><i class="fa-solid fa-angles-down"></i> Desvantagem: ${esc(n)} <small>(status)</small></li>`),
  ];
  const rems = matchingReminders(actor.system.reminders, scope).map((r) => `<label class="nas-reminder-option">
      <input type="checkbox" name="rem" value="${esc(r.id)}" checked>
      <span><strong>${esc(r.label)}</strong> <small>${esc(reminderSummary(r))}</small></span></label>`);
  if (!lines.length && !rems.length) return "";
  return `<fieldset class="nas-reminders"><legend>Lembretes</legend>
    ${lines.length ? `<ul>${lines.join("")}</ul>` : ""}${rems.join("")}
    ${lines.length ? `<small class="nas-muted">Status somam com o modo escolhido; Vantagem e Desvantagem se anulam.</small>` : ""}</fieldset>`;
}

/** Checked reminder ids of a dialog form; null form (Shift-click) = every matching reminder. */
function readReminderIds(form, actor, scope) {
  if (!form) return matchingReminders(actor.system.reminders, scope).map((r) => r.id);
  return [...form.querySelectorAll('input[name="rem"]:checked')].map((i) => i.value);
}

/** Chosen reminders → effect; also the final roll mode combining choice, statuses and reminders. */
export function rollModifiers(actor, { attrId = "", scope, ids = [], mode = "normal" }) {
  const chosen = (actor.system.reminders ?? []).filter((r) => ids.includes(r.id));
  const eff = reminderEffect(chosen);
  const st = scope === "dano" ? { advantage: false, disadvantage: false } : statusRollFlags(actor.statuses, attrId);
  const finalMode = effectiveRollMode(mode, { advantage: st.advantage || eff.advantage, disadvantage: st.disadvantage || eff.disadvantage });
  const terms = eff.terms.map((t) => manualTerm(t)).filter(Boolean);
  return { chosen, eff, finalMode, terms, changedMode: finalMode !== mode };
}

/** Spend the limited reminders that were used in a roll. */
export async function consumeUsed(actor, ids) {
  if (!ids?.length || !actor.isOwner) return;
  const next = consumeReminders(actor.system.reminders, ids);
  if (next.length !== actor.system.reminders.length || next.some((r, i) => r.uses !== actor.system.reminders[i]?.uses)) {
    await actor.update({ "system.reminders": next });
  }
}

/** Reminder created from the sheet or by a passive. Passives pass `source` so they can clean their own. */
export async function addReminder(actor, data) {
  const entry = { id: foundry.utils.randomID(), label: "Lembrete", scope: "todos", mode: "", bonus: "", uses: 1, source: "manual", ...data };
  if (entry.bonus && !manualTerm(entry.bonus)) return ui.notifications.warn(`Bônus do lembrete inválido: "${entry.bonus}" (use +2, -1, 1d4).`), null;
  await actor.update({ "system.reminders": [...actor.system.reminders, entry] });
  return entry;
}

export async function removeReminder(actor, id) {
  await actor.update({ "system.reminders": actor.system.reminders.filter((r) => r.id !== id) });
}

/* ------------------------------------------------------------ d20 tests ------------------------------------------------------------ */

/**
 * Pre-roll dialog (legacy roll/hit dialogs): automatic bonuses with their sources, reminders (status + saved),
 * manual situational bonus, CD, visibility and the roll mode. Returns { mode, manual, reminders, cd, messageMode } or null.
 */
export async function askRoll(actor, { label, attrId, channel = "", mode = "normal" }) {
  const sys = actor.system;
  const ch = channel ? sys.derived.bonuses[channel] : null;
  const scope = scopeOf(channel);
  const auto = [
    `${ATTR[attrId]} ${sys.derived.attributes[attrId]}`, ...(ch?.sources ?? []).map((s) => `${s.label} ${s.value > 0 ? "+" : ""}${s.value}`),
    ...passiveTestBonuses(actor, attrId).map((p) => `${p.label} +${p.value}`),
  ];
  const read = (m) => (event, button) => {
    const f = button.form.elements;
    return { mode: m, manual: f.manual.value, reminders: readReminderIds(button.form, actor, scope), cd: Number(f.cd?.value) || 0, messageMode: f.messageMode?.value };
  };
  return DialogV2.wait({
    window: { title: label },
    content: `<div class="nas-dialog"><p><strong>Automático:</strong> ${esc(auto.join(" · "))}</p>
      ${reminderBlock(actor, scope, attrId)}
      ${MANUAL_FIELD("manual", "Bônus manual", "Somado só nesta rolagem. Fixos ficam em Configurações.")}
      <div class="nas-dialog-row">${CD_FIELD}${messageModeField()}</div></div>`,
    buttons: Object.entries(ROLL_MODES).map(([id, m]) => ({ action: id, label: m.label, default: id === mode, callback: read(id) })),
    rejectClose: false,
  });
}

/**
 * Generic d20 test: total attribute + channel bonus + reminders + manual bonus, status/reminder-adjusted mode,
 * optional CD. Optionally spends an action and grants +1 Fôlego on a positive critical (defense).
 */
export async function rollCheck(actor, {
  label, attrId, channel = "", mode = "normal", manual = "", spend = null, critFolego = false, reminders, cd = 0, messageMode,
}) {
  const sys = actor.system;
  if (spend && sys.actions[spend]) ui.notifications.warn(`${actor.name}: Ação de ${ACTION_LABELS[spend]} já usada neste turno.`);
  const scope = scopeOf(channel);
  const ids = reminders ?? readReminderIds(null, actor, scope);
  const mods = rollModifiers(actor, { attrId, scope, ids, mode });
  const bonus = channel ? sys.derived.bonuses[channel]?.total ?? 0 : 0;
  const parts = [`${ATTR[attrId]} ${sys.derived.attributes[attrId]}`];
  if (bonus) parts.push(`${CHANNEL_LABELS[channel]} ${bonus > 0 ? "+" : ""}${bonus}`);
  for (const r of mods.chosen) parts.push(`${r.label}${r.bonus ? ` ${r.bonus}` : ""}`);
  const passive = passiveTestBonuses(actor, attrId);
  for (const p of passive) parts.push(`${p.label} +${p.value}`);
  const term = manualTerm(manual);
  if (manual && !term) ui.notifications.warn(`Bônus manual ignorado: "${manual}" não é número nem dado.`);
  if (term) parts.push(`Manual ${term.replace(" ", "")}`);
  const formula = `${testFormula(mods.finalMode, sys.derived.attributes[attrId], bonus, term)}${mods.terms.map((t) => ` ${t}`).join("")}${passive.map((p) => ` + ${p.value}`).join("")}`;
  const roll = await rollToChat(formula, actor,
    `${label} · ${parts.join(" · ")} · ${ROLL_MODES[mods.finalMode].label}${mods.changedMode ? " (status/lembrete)" : ""}${cd ? ` · CD ${cd}` : ""}`,
    { messageMode });
  if (cd) await postCard(actor, `<p class="nas-cd ${roll.total >= cd ? "is-success" : "is-failure"}">${esc(label)}: ${roll.total} contra CD ${cd}, <strong>${roll.total >= cd ? "superada" : "não superada"}</strong>.</p>`, messageMode);
  const nat = naturalResult(roll.dice[0]?.results ?? []);
  const update = {};
  if (spend && !sys.actions[spend]) update[`system.actions.${spend}`] = true;
  if (critFolego && isPositiveCritical(nat) && sys.resources.folego.max !== null) {
    update["system.resources.folego.value"] = folegoGain(sys.resources.folego.value, sys.resources.folego.max);
    ui.notifications.info(`${actor.name}: Crítico! +1 Fôlego.`);
  }
  if (Object.keys(update).length && actor.isOwner) await actor.update(update);
  await consumeUsed(actor, ids);
  return roll;
}

/**
 * Level picker: Breathing level N opens levels 1..N of the Form; the player uses any of them.
 * Default = highest level the PDR pays. Returns { level, manual } or null.
 */
export async function askFormLevel(actor, form) {
  const pdr = actor.system.resources.pdr.value;
  const options = form.available.map((l) => ({ ...l, ok: pdr >= l.cost }));
  const pick = options.filter((o) => o.ok).at(-1)?.level;
  if (pick === undefined) return ui.notifications.warn(`PDR insuficiente para qualquer nível de ${form.name}.`), null;
  const rows = options.map((o) => `<label class="nas-level-option ${o.ok ? "" : "is-locked"}">
      <input type="radio" name="level" value="${o.level}" ${o.level === pick ? "checked" : ""} ${o.ok ? "" : "disabled"}>
      <strong>Nível ${o.level}</strong> <span>${o.cost} PDR</span> <span>${esc(damageLabel(o.damage) || "sem dano")}</span>
      <small>${esc(o.effect || "")}</small></label>`).join("");
  return DialogV2.wait({
    window: { title: `${form.name}: nível da Forma` },
    content: `<div class="nas-dialog"><p>Seu nível de Respiração libera ${form.available.map((l) => l.level).join(", ")}. PDR atual: <strong>${pdr}</strong>.</p>
      <div class="nas-level-list">${rows}</div>
      ${reminderBlock(actor, "dano")}
      ${MANUAL_FIELD("manual", "Bônus manual no dano", "Somado só neste dano.")}
      ${messageModeField()}</div>`,
    buttons: [
      {
        action: "use", label: "Usar Forma", default: true,
        callback: (e, b) => ({
          level: Number(b.form.elements.level.value), manual: b.form.elements.manual.value,
          reminders: readReminderIds(b.form, actor, "dano"), messageMode: b.form.elements.messageMode.value,
        }),
      },
      { action: "cancel", label: "Cancelar", callback: () => null },
    ],
    rejectClose: false,
  });
}

/** Breathing Form at a chosen level: re-validates level and PDR, spends both, posts the effect and rolls damage. */
export async function useForm(actor, form, level, manual = "", { reminders, messageMode } = {}) {
  const sys = actor.system;
  if (form?.passive) return ui.notifications.warn(`${form.name} é passiva: está sempre ativa e não gasta ação nem PDR.`);
  if (!form?.unlocked) return ui.notifications.warn("Forma ainda não liberada no seu nível de Respiração.");
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha usa a Forma.");
  const entry = formLevel(form, level, sys.derived.breathingLevel);
  if (!entry) return ui.notifications.warn(`${form.name}: nível ${level} não disponível no seu nível de Respiração.`);
  const cost = entry.cost;
  if (sys.resources.pdr.value < cost) return ui.notifications.warn(`PDR insuficiente: ${form.name} nível ${level} custa ${cost} PDR.`);
  const spend = actionsToSpend(form.action, sys.actions);
  if (spend === null) return ui.notifications.warn(`Sem ação disponível para ${form.name} (${form.action.label}).`);
  const update = { "system.resources.pdr.value": sys.resources.pdr.value - cost };
  for (const k of spend) update[`system.actions.${k}`] = true;
  await actor.update(update);
  const actionText = form.action.keys.length ? form.action.label : "Ação não informada no catálogo";
  const freezeHit = sys.derived.breathing?.key === "neve" && form.id === FREEZE_FORM;
  await postCard(actor, `<div class="nas-chat-card"><h3>${esc(form.name)}</h3>
      <p><em>${esc(form.nameJp)}</em> · Forma nível ${entry.level} (Respiração ${sys.derived.breathingLevel}) · ${cost} PDR · ${esc(actionText)}</p>
      <p>${esc(entry.effect || form.description)}</p>
      ${entry.status ? `<p><strong>Status:</strong> ${esc(entry.status)}</p>` : ""}
      ${form.requirement ? `<p class="nas-muted">${esc(form.requirement)}</p>` : ""}
      ${freezeHit ? `<div class="nas-chat-buttons"><button type="button" data-nas-freeze="${actor.uuid}"><i class="fa-solid fa-snowflake"></i> Acertou: +1 Congelar</button></div>` : ""}</div>`, messageMode);
  // Chamas · Fogo Fátuo: the technique uses the weapon's current tier, then heats it.
  const flame = sys.derived.breathing?.key === "chamas" ? equippedWeapon(actor) : null;
  const tier = flame ? flameTier(flame.system.heat) : null;
  let formula = damageFormula(entry.damage, sys.derived.attributes);
  if (formula && tier?.techniqueDie) formula = `${formula} + ${tier.techniqueDie}`;
  if (formula) {
    // Damage reminders ("+2 no próximo dano") and visibility, like the damage dialog.
    const ids = reminders ?? readReminderIds(null, actor, "dano");
    const mods = rollModifiers(actor, { scope: "dano", ids });
    const label = [`${form.name} (nível ${entry.level})`, tier?.techniqueDie ? `Fogo Fátuo +${tier.techniqueDie}` : "", ...mods.chosen.map((r) => `${r.label} ${r.bonus}`)].filter(Boolean).join(" · ");
    await rollDamage(actor, formula, label, entry.damageTypes, manual, { multiplier: tier?.multiplier ?? 1, extraTerms: mods.terms, messageMode });
    await consumeUsed(actor, ids);
  }
  await formPassives(actor, form, flame);
}

/** Passives fed by using a Form: Chamas heats the equipped weapon; Neve's 1st Form stacks Congelar. */
async function formPassives(actor, form, flameWeapon) {
  const key = actor.system.derived.breathing?.key;
  if (key === "chamas" && FLAME_HEAT[form.id]) {
    if (!flameWeapon) return ui.notifications.info("Fogo Fátuo: equipe uma arma para acumular Esquentar.");
    const heat = addFlameHeat(flameWeapon.system.heat, form.id);
    await flameWeapon.update({ "system.heat": heat });
    const t = flameTier(heat);
    ui.notifications.info(`${flameWeapon.name}: Esquentar ${heat}/60 (acerto +${t.hit}, dano da arma +${t.weaponDamage}${t.techniqueDie ? `, técnicas +${t.techniqueDie}` : ""}).`);
  }
}

/** Neve · Congelar: +1 stack when the 1st Form's hit is confirmed on its chat card ("Toda vez que você acertar"). */
export async function addFreezeStack(actor) {
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha marca o acerto.");
  const stacks = addFreeze(actor.system.passives.freeze);
  await actor.update({ "system.passives.freeze": stacks });
  ui.notifications.info(`Congelar: ${stacks}/${FREEZE_STACKS}${stacks >= FREEZE_STACKS ? " · pronto (Ação Única na aba Combate)" : ""}.`);
}

/** Fogo Fátuo tier of a weapon in a Chamas user's hands (null otherwise). */
const flameTierOf = (actor, item) => (item && actor.system.derived.breathing?.key === "chamas" ? flameTier(item.system.heat) : null);

const equippedWeapon = (actor) => actor.items.find((i) => i.type === "weapon" && i.system.equipped) ?? null;

/** Passive bonuses on attribute tests: Vento's scars (+CAR) and Resistência Vital (+VIT). */
function passiveTestBonuses(actor, attrId) {
  const p = actor.system.passives;
  if (!p) return [];
  return [
    attrId === "car" && p.scars ? { label: "Cicatrizes (Sangue Especial)", value: p.scars } : null,
    attrId === "vit" && p.windVit ? { label: "Resistência Vital (Sangue Especial)", value: p.windVit } : null,
  ].filter(Boolean);
}

/**
 * Damage roll with the fixed-damage channel and an optional manual term; the chat card carries Apply/Heal.
 * `crit` doubles the final total (legacy weapon-service: "dano final ×2").
 */
export async function rollDamage(actor, formula, label, types = [], manual = "", {
  crit = false, messageMode, extraTerms = [], multiplier = 1, hammer = false,
} = {}) {
  const fixed = actor.system.derived?.bonuses?.danoFixo?.total ?? 0;
  const term = manualTerm(manual);
  if (manual && !term) ui.notifications.warn(`Bônus manual ignorado: "${manual}" não é número nem dado.`);
  const base = `${formula}${fixed ? ` + ${fixed}` : ""}${term ? ` ${term}` : ""}${extraTerms.map((t) => ` ${t}`).join("")}`.replace(/\+ -/g, "- ");
  // Order: critical ×2, then Fogo Fátuo ×1.5 ("after all calculations"), then Martelo do Julgamento halves.
  let full = crit ? `(${base}) * 2` : base;
  full = flameMultiplied(full, { multiplier });
  if (hammer) full = hammerFormula(full);
  const keys = types.map(normalizeDamageType);
  const typeText = keys.map((t) => DAMAGE_TYPES[t] ?? t).join(", ");
  const tags = [crit ? "CRÍTICO ×2" : "", multiplier > 1 ? `Fogo Fátuo ×${multiplier}` : "", hammer ? "Martelo: metade, ignora resistências" : ""].filter(Boolean);
  const roll = await rollToChat(full, actor, `Dano: ${label}${tags.length ? ` · ${tags.join(" · ")}` : ""}${typeText ? ` (${typeText})` : ""}`, { messageMode });
  const typesAttr = `data-types="${esc(keys.join(","))}"`;
  await postCard(actor, `<div class="nas-chat-card nas-damage-card"><p><strong>${roll.total}</strong> de dano${crit ? " <em>(crítico)</em>" : ""}${hammer ? " <em>(ignora resistências)</em>" : ""}${typeText ? ` · ${esc(typeText)}` : ""}</p>
      <div class="nas-chat-buttons">
        <button type="button" data-nas-apply="damage" data-amount="${roll.total}" ${typesAttr}><i class="fa-solid fa-burst"></i> Aplicar dano</button>
        <button type="button" data-nas-apply="half" data-amount="${Math.floor(roll.total / 2)}" ${typesAttr}>Metade</button>
        <button type="button" data-nas-apply="heal" data-amount="${roll.total}"><i class="fa-solid fa-heart"></i> Curar</button>
      </div><p class="nas-muted">Aplica nos tokens alvo (ou selecionados).</p></div>`, messageMode);
  return roll;
}

/* ---------------------------------------------------------------- Weapons ---------------------------------------------------------------- */

const weaponProfile = (item) => item?.system?.profile ?? null;
const isStoneUser = (actor) => actor.system.derived?.breathing?.key === "pedra";

/** Hit attributes the profile allows (profile list, else the weapon's) and the default = highest current value. */
function hitChoices(actor, item, profile = weaponProfile(item)) {
  const attrs = !item ? COMBAT_TESTS.acerto.attrs : profile?.hitAttrs?.length ? profile.hitAttrs : hitAttributes(item.system);
  const values = actor.system.derived.attributes;
  return { attrs, best: attrs.reduce((a, b) => (values[b] > values[a] ? b : a)) };
}

/** Critical threshold of the weapon in this actor's hands (Pedra: Quebra stacks lower it, capped by FOR). */
export function weaponThreshold(actor, item, profile = weaponProfile(item)) {
  if (!item) return 20;
  const base = critThreshold(item.system, profile);
  return isStoneUser(actor) ? stoneCritThreshold(base, item.system.stoneBreak, actor.system.derived.attributes.for) : base;
}

/**
 * Attack dialog (legacy hit-dialog): hit attribute (weapon allows FOR/DEX, DEX or FOR; default = higher), number
 * of attempts (1–20, each confirmed before the next), optional CD, reminders, manual bonus, visibility, roll mode.
 * `item` null = bare Acerto (FOR or DEX, critical 20). Returns the options or null.
 */
export async function askAttack(actor, item, { secondary = false, hammer = false, mode = "normal" } = {}) {
  const single = secondary || hammer;
  const sys = actor.system;
  const profile = weaponProfile(item);
  const { attrs, best } = hitChoices(actor, item, profile);
  const proficient = !item || isProficient(sys.proficientWeapon, item.name);
  const ch = sys.derived.bonuses.acerto;
  const radios = attrs.map((a) => `<label class="nas-level-option"><input type="radio" name="attr" value="${a}" ${a === best ? "checked" : ""}>
      <strong>${ATTR[a]}</strong> <span>${sys.derived.attributes[a]}</span></label>`).join("");
  const notes = [
    proficient ? "" : "Sem proficiência nesta arma: o atributo não entra no acerto nem no dano.",
    secondary && profile?.secondNoAttr ? "2º golpe: sem atributo." : "",
    secondary && profile?.secondPenalty ? `2º golpe: ${profile.secondPenalty} no acerto.` : "",
    ...(ch?.sources ?? []).map((s) => `${s.label} ${s.value > 0 ? "+" : ""}${s.value} (Acerto)`),
  ].filter(Boolean);
  const head = item
    ? `<strong>${esc(profile.name)}</strong> · crítico ${weaponThreshold(actor, item, profile)}+${item.system.stoneBreak && isStoneUser(actor) ? ` (Quebra ${item.system.stoneBreak})` : ""}`
    : "<strong>Sem arma</strong> · crítico 20";
  const read = (m) => (event, button) => {
    const f = button.form.elements;
    return {
      mode: m, manual: f.manual.value, attrId: f.attr.value, attempts: Number(f.attempts?.value) || 1, cd: Number(f.cd.value) || 0,
      messageMode: f.messageMode.value, reminders: readReminderIds(button.form, actor, "acerto"),
    };
  };
  return DialogV2.wait({
    window: { title: `${item?.name ?? "Acerto"}: ${secondary ? "2º golpe" : hammer ? "Martelo do Julgamento" : "ataque"}` },
    position: { width: 460 },
    content: `<div class="nas-dialog"><p>${head}</p>
      <div class="nas-level-list nas-level-list--row">${radios}</div>
      ${notes.length ? `<p class="nas-muted">${esc(notes.join(" · "))}</p>` : ""}
      ${reminderBlock(actor, "acerto", best)}
      ${MANUAL_FIELD("manual", "Bônus manual no acerto", "Somado em cada tentativa.")}
      <div class="nas-dialog-row">
        ${single ? "" : `<label class="nas-dialog-field">Tentativas<input type="number" name="attempts" min="1" max="20" value="1"></label>`}
        ${CD_FIELD}
      </div>
      ${single ? "" : `<small class="nas-muted">Várias tentativas: uma rolagem por vez; você confirma Acertou/Errou antes da próxima. A ação de Ataque é gasta uma vez.</small>`}
      ${messageModeField()}</div>`,
    buttons: Object.entries(ROLL_MODES).map(([id, m]) => ({ action: id, label: m.label, default: id === mode, callback: read(id) })),
    rejectClose: false,
  });
}

/** Confirmation between attempts (legacy openHitConfirmationDialog). Returns { hit, continue } | { stop } | null. */
async function confirmHit({ index, of, total, natural, threshold, crit, cd, name }) {
  const last = index >= of;
  return DialogV2.wait({
    window: { title: `Confirmar acerto ${index}/${of}` },
    position: { width: 420 },
    content: `<div class="nas-dialog nas-hit-confirm">
      <span class="nas-muted">TENTATIVA ${index} DE ${of}${name ? ` · ${esc(name)}` : ""}</span>
      <div class="nas-hit-total"><small>Resultado</small><strong>${total}</strong></div>
      <p>Natural <strong>${natural ?? "—"}</strong> · crítico ${threshold}+ · ${crit ? '<strong class="nas-crit">CRÍTICO</strong>' : "acerto normal"}</p>
      ${cd ? `<p class="nas-cd ${total >= cd ? "is-success" : "is-failure"}">CD ${cd}: ${total >= cd ? "superada" : "não superada"}</p>` : ""}
      <p>${last ? "Última tentativa." : "Acertou? Depois do dano você segue para a próxima tentativa."}</p>
      ${last ? "" : `<label class="nas-check"><input type="checkbox" name="stop"> <span>Encerrar a sequência depois deste resultado</span></label>`}</div>`,
    buttons: [
      { action: "hit", label: "Acertou", default: true, callback: (e, b) => ({ hit: true, continue: !last && !b.form.elements.stop?.checked }) },
      { action: "miss", label: "Errou", callback: (e, b) => ({ hit: false, continue: !last && !b.form.elements.stop?.checked }) },
      { action: "stop", label: "Encerrar", callback: () => ({ stop: true }) },
    ],
    rejectClose: false,
  });
}

/** One attack roll + its chat card. `mods` = reminders/status already resolved for the whole sequence. */
async function attackRoll(actor, item, { manual, attrId, secondary, cd, messageMode, mods, index, of, hammer = false }) {
  const sys = actor.system;
  const profile = weaponProfile(item);
  const proficient = !item || isProficient(sys.proficientWeapon, item.name);
  const flame = flameTierOf(actor, item);
  const hit = (item ? weaponHitBonus(profile, sys.derived.attributes[attrId], { proficient, secondary }) : sys.derived.attributes[attrId]) + (flame?.hit ?? 0);
  const channel = sys.derived.bonuses.acerto?.total ?? 0;
  const term = manualTerm(manual);
  const usesAttr = proficient && !(secondary && profile?.secondNoAttr);
  const parts = [usesAttr ? `${ATTR[attrId]} ${sys.derived.attributes[attrId]}` : "sem atributo"];
  if (secondary && profile?.secondPenalty) parts.push(`2º golpe ${profile.secondPenalty}`);
  if (channel) parts.push(`Acerto ${channel > 0 ? "+" : ""}${channel}`);
  if (flame?.hit) parts.push(`Fogo Fátuo +${flame.hit}`);
  for (const r of mods.chosen) parts.push(`${r.label}${r.bonus ? ` ${r.bonus}` : ""}`);
  if (term) parts.push(`Manual ${term.replace(" ", "")}`);
  const name = `${hammer ? "Martelo do Julgamento · " : ""}${item ? `${item.name} · ${profile.name}` : "Acerto"}`;
  const formula = `${testFormula(mods.finalMode, hit, channel, term)}${mods.terms.map((t) => ` ${t}`).join("")}`;
  const roll = await rollToChat(formula, actor,
    `${name}${secondary ? " · 2º golpe" : ""}${of > 1 ? ` · tentativa ${index}/${of}` : ""} · ${parts.join(" · ")} · ${ROLL_MODES[mods.finalMode].label}${mods.changedMode ? " (status/lembrete)" : ""}`,
    { messageMode });
  const nat = naturalResult(roll.dice[0]?.results ?? []);
  const threshold = item ? weaponThreshold(actor, item, profile) : 20;
  const blocked = actor.statuses.has("fadiga_corporal");
  const crit = isCritical(nat, threshold, { blocked });
  const data = `data-actor="${actor.uuid}" data-item="${item?.id ?? ""}"`;
  const critLine = crit
    ? `<p class="nas-crit"><i class="fa-solid fa-bolt"></i> CRÍTICO (natural ${nat}, margem ${threshold}+): se acertar, dano ×2 e +1 Fôlego.</p>`
    : blocked && nat >= threshold ? `<p class="nas-muted">Natural ${nat} na margem, mas Fadiga Corporal bloqueia o crítico.</p>` : "";
  await postCard(actor, `<div class="nas-chat-card nas-attack-card${crit ? " is-crit" : ""}">
      <h3>${hammer ? "Martelo do Julgamento · " : ""}${esc(item?.name ?? "Acerto")}</h3><p>${item ? esc(profile.name) : "Sem arma"}${secondary ? " · 2º golpe" : ""}${of > 1 ? ` · tentativa ${index}/${of}` : ""} · Acerto <strong>${roll.total}</strong> (natural ${nat ?? "—"})</p>
      ${critLine}
      ${cd ? `<p class="nas-cd ${roll.total >= cd ? "is-success" : "is-failure"}">CD ${cd}: ${roll.total >= cd ? "superada" : "não superada"}</p>` : ""}
      <div class="nas-chat-buttons">
        ${of > 1 ? "" : `<button type="button" data-nas-weapon="damage" ${data} data-crit="${crit ? 1 : 0}" data-secondary="${secondary ? 1 : 0}" data-hammer="${hammer ? 1 : 0}"><i class="fa-solid fa-burst"></i> Acertou: rolar dano</button>`}
        ${item && !secondary && !hammer && profile.attacks > 1 ? `<button type="button" data-nas-weapon="second" ${data}><i class="fa-solid fa-khanda"></i> 2º golpe</button>` : ""}
      </div><p class="nas-muted">${of > 1 ? "Confirme o acerto no diálogo da sequência." : "O Mestre compara com a defesa do alvo. Shift-clique rola sem diálogo."}</p></div>`, messageMode);
  return { roll, crit, natural: nat, threshold, name };
}

/**
 * Attack sequence (weapon or bare Acerto): spends Ataque once (the 2nd strike of a two-weapon profile is part of
 * the same action); each attempt rolls d20 + attribute (if proficient) + Acerto channel + reminders + manual.
 * Critical = kept natural ≥ weapon threshold (20 without weapon), blocked by Fadiga Corporal.
 * One attempt: the card's "Acertou" button rolls damage. Several: each result is confirmed in a dialog and a hit
 * goes straight to the damage dialog.
 */
export async function attackWithWeapon(actor, item, opts = {}) {
  const { mode = "normal", manual = "", secondary = false, cd = 0, messageMode, hammer = false } = opts;
  const sys = actor.system;
  const profile = weaponProfile(item);
  if (item && !profile) return ui.notifications.warn(`${item.name}: arma sem perfil de dano.`);
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha ataca.");
  if (!secondary && !hammer && sys.actions.ataque) ui.notifications.warn(`${actor.name}: Ação de Ataque já usada neste turno.`);
  if (manual && !manualTerm(manual)) ui.notifications.warn(`Bônus manual ignorado: "${manual}" não é número nem dado.`);
  // Shift-click (no dialog) uses the same default as the dialog: the highest allowed attribute.
  const choices = hitChoices(actor, item, profile);
  const attrId = choices.attrs.includes(opts.attrId) ? opts.attrId : choices.best;
  const attempts = secondary || hammer ? 1 : Math.min(20, Math.max(1, Math.trunc(Number(opts.attempts) || 1)));
  const ids = opts.reminders ?? readReminderIds(null, actor, "acerto");
  const mods = rollModifiers(actor, { attrId, scope: "acerto", ids, mode });
  // The Martelo extra attack happens "na mesma ação": it never spends Ataque.
  if (!secondary && !hammer && !sys.actions.ataque) await actor.update({ "system.actions.ataque": true });
  let last = null;
  for (let index = 1; index <= attempts; index++) {
    last = await attackRoll(actor, item, { manual, attrId, secondary, cd, messageMode, mods, index, of: attempts, hammer });
    if (attempts === 1) break;
    const d = await confirmHit({ index, of: attempts, total: last.roll.total, natural: last.natural, threshold: last.threshold, crit: last.crit, cd, name: last.name });
    if (!d || d.stop) break;
    if (d.hit) await damageFlow(actor, item, { crit: last.crit, secondary, messageMode, hammer });
    if (!d.continue) break;
  }
  await consumeUsed(actor, ids);
  return last;
}

/* ---------------------------------------------------------------- Damage dialog ---------------------------------------------------------------- */

/** Damage entry of a weapon hit (formula already carries dice, rank die, fixed and attributes). */
function weaponEntry(actor, item, secondary = false) {
  const sys = actor.system;
  const profile = weaponProfile(item);
  const proficient = isProficient(sys.proficientWeapon, item.name);
  const flame = flameTierOf(actor, item);
  return {
    label: `${item.name} · ${profile.name}${secondary ? " (2º golpe)" : ""}${flame?.weaponDamage ? ` · Fogo Fátuo +${flame.weaponDamage}` : ""}`,
    formula: weaponDamageFormula(item.system, profile, sys.derived.attributes, { proficient, level: sys.level, secondary }),
    fixed: flame?.weaponDamage ?? 0, attrs: [],
    types: (profile.types?.length ? profile.types : item.system.damageTypes).map(normalizeDamageType),
  };
}

const ATTR_IDS = Object.keys(ATTR);

function entryRow(e, attrs) {
  const types = new Set((e.types ?? []).map(normalizeDamageType));
  const on = new Set(e.attrs ?? []);
  return `<div class="nas-dmg-entry" data-label="${esc(e.label ?? "")}">
    <div class="nas-dmg-entry-bar">
      <input type="text" class="e-formula" value="${esc(e.formula ?? "")}" placeholder="2d6, 4d6kh3, 1d8 + @for" autocomplete="off" spellcheck="false">
      <input type="number" class="e-fixed" value="${Number(e.fixed) || ""}" placeholder="+ fixo">
      <button type="button" class="nas-icon-btn" data-dmg="remove" aria-label="Remover entrada"><i class="fa-solid fa-xmark"></i></button>
    </div>
    ${e.label ? `<small class="nas-muted">${esc(e.label)}</small>` : ""}
    <div class="nas-dmg-attrs">${ATTR_IDS.map((a) => `<label><input type="checkbox" class="e-attr" value="${a}" ${on.has(a) ? "checked" : ""}> ${ATTR[a]} ${attrs[a]}</label>`).join("")}</div>
    <details class="nas-dmg-types"><summary>Tipos: <span>${[...types].map((t) => DAMAGE_TYPES[t] ?? t).join(", ") || "nenhum"}</span></summary>
      ${Object.entries(DAMAGE_TYPES).map(([k, l]) => `<label><input type="checkbox" class="e-type" value="${k}" ${types.has(k) ? "checked" : ""}> ${l}</label>`).join("")}
    </details></div>`;
}

function collectEntries(root) {
  return [...root.querySelectorAll(".nas-dmg-entry")].map((el) => ({
    label: el.dataset.label || "",
    formula: el.querySelector(".e-formula").value.trim(),
    fixed: Number(el.querySelector(".e-fixed").value) || 0,
    attrs: [...el.querySelectorAll(".e-attr:checked")].map((i) => i.value),
    types: [...el.querySelectorAll(".e-type:checked")].map((i) => i.value),
  }));
}

/**
 * Damage dialog (legacy damage-dialog): entries (free formula with dice/kh/kl/@attr, fixed, attributes, types),
 * "+ Dano da arma", presets, reminders for damage, PDR to spend, critical toggle, visibility and a live preview.
 * Returns { name, entries, pdr, crit, messageMode, reminders, savePreset } or null.
 */
export async function askDamage(actor, { title = "Rolar dano", name = "", entries = [], crit = false, pdr = 0 } = {}) {
  const attrs = actor.system.derived.attributes;
  const presets = actor.system.damagePresets ?? [];
  const weapons = actor.items.filter((i) => i.type === "weapon" && i.system.profile);
  const render = (event, dialog) => {
    const root = dialog.element;
    const box = root.querySelector(".nas-dmg-entries");
    if (!box || box.dataset.ready) return;
    box.dataset.ready = "1";
    const preview = root.querySelector(".nas-dmg-preview code");
    const update = () => {
      const r = entriesFormula(collectEntries(root), attrs);
      const fixed = actor.system.derived.bonuses?.danoFixo?.total ?? 0;
      preview.textContent = r.invalid.length ? `Entrada ${r.invalid.join(", ")}: fórmula inválida` : `${r.formula || "—"}${r.formula && fixed ? ` + ${fixed} (Dano fixo)` : ""}`;
      preview.classList.toggle("is-invalid", r.invalid.length > 0);
      root.querySelectorAll(".nas-dmg-types").forEach((d) => {
        d.querySelector("summary span").textContent = [...d.querySelectorAll(".e-type:checked")].map((i) => DAMAGE_TYPES[i.value]).join(", ") || "nenhum";
      });
    };
    const add = (e) => { box.insertAdjacentHTML("beforeend", entryRow(e, attrs)); update(); };
    (entries.length ? entries : [{}]).forEach(add);
    root.addEventListener("input", update);
    root.addEventListener("change", (ev) => {
      if (ev.target.name !== "preset" || !ev.target.value) return update();
      const p = presets.find((x) => x.id === ev.target.value);
      if (!p) return;
      box.innerHTML = "";
      p.entries.forEach(add);
      root.querySelector('[name="pdr"]').value = p.pdr || 0;
      if (!root.querySelector('[name="name"]').value) root.querySelector('[name="name"]').value = p.name;
    });
    root.addEventListener("click", (ev) => {
      const b = ev.target.closest("[data-dmg]");
      if (!b) return;
      ev.preventDefault();
      if (b.dataset.dmg === "add") add({});
      if (b.dataset.dmg === "remove") { b.closest(".nas-dmg-entry").remove(); update(); }
      if (b.dataset.dmg === "weapon") {
        const w = actor.items.get(root.querySelector('[name="weaponPick"]').value);
        if (w) add(weaponEntry(actor, w));
      }
    });
  };
  return DialogV2.wait({
    window: { title },
    position: { width: 560 },
    classes: ["nas-damage-window"],
    render,
    content: `<div class="nas-dialog nas-damage-dialog">
      <div class="nas-dialog-row">
        <label class="nas-dialog-field">Nome do ataque<input type="text" name="name" value="${esc(name)}" placeholder="ex.: Corte Celestial"></label>
        ${presets.length ? `<label class="nas-dialog-field">Preset<select name="preset"><option value="">—</option>${presets.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join("")}</select></label>` : ""}
      </div>
      <div class="nas-dmg-head"><strong>Entradas de dano</strong>
        <span><button type="button" data-dmg="add"><i class="fa-solid fa-plus"></i> Entrada</button>
        ${weapons.length ? `<select name="weaponPick">${weapons.map((w) => `<option value="${w.id}" ${w.system.equipped ? "selected" : ""}>${esc(w.name)}</option>`).join("")}</select>
          <button type="button" data-dmg="weapon"><i class="fa-solid fa-khanda"></i> Dano da arma</button>` : ""}</span></div>
      <div class="nas-dmg-entries"></div>
      ${reminderBlock(actor, "dano")}
      <div class="nas-dialog-row">
        <label class="nas-dialog-field">PDR a gastar<input type="number" name="pdr" min="0" value="${Number(pdr) || 0}"></label>
        ${messageModeField()}
      </div>
      <label class="nas-check"><input type="checkbox" name="crit" ${crit ? "checked" : ""}> <span><strong>Foi crítico?</strong> <small>Dobra o dano final.</small></span></label>
      <label class="nas-dialog-field">Salvar como preset <small>(nome; vazio = não salva)</small><input type="text" name="savePreset" placeholder="ex.: Rengoku crítico"></label>
      <p class="nas-dmg-preview">Fórmula: <code>—</code></p></div>`,
    buttons: [
      {
        action: "roll", label: "Rolar dano", default: true,
        callback: (e, b) => {
          const f = b.form.elements;
          return {
            name: f.name.value.trim(), entries: collectEntries(b.form), pdr: Math.max(0, Number(f.pdr.value) || 0), crit: f.crit.checked,
            messageMode: f.messageMode.value, reminders: readReminderIds(b.form, actor, "dano"), savePreset: f.savePreset.value.trim(),
          };
        },
      },
      { action: "cancel", label: "Cancelar", callback: () => null },
    ],
    rejectClose: false,
  });
}

/**
 * Roll what the damage dialog returned: sum of entries + reminders, spends PDR, optional preset save.
 * `fromHit` = the damage of a confirmed attack: a critical there gives +1 Fôlego and Pedra's Quebra may stack.
 */
export async function rollDamageEntries(actor, res, { item = null, secondary = false, fromHit = false } = {}) {
  const sys = actor.system;
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha rola este dano.");
  const { formula, invalid } = entriesFormula(res.entries, sys.derived.attributes);
  if (invalid.length) return ui.notifications.warn(`Dano não rolado: fórmula inválida na entrada ${invalid.join(", ")} (use dados, kh/kl, números e @atributo).`);
  if (!formula) return ui.notifications.warn("Dano não rolado: nenhuma entrada com valor.");
  if (res.pdr > sys.resources.pdr.value) return ui.notifications.warn(`PDR insuficiente: ${res.pdr} pedido, ${sys.resources.pdr.value} disponível.`);
  if (res.pdr) await actor.update({ "system.resources.pdr.value": sys.resources.pdr.value - res.pdr });
  const mods = rollModifiers(actor, { scope: "dano", ids: res.reminders ?? [] });
  const types = entriesTypes(res.entries);
  const label = [res.name || res.entries.find((e) => e.label)?.label || "Dano", ...mods.chosen.map((r) => `${r.label} ${r.bonus}`)].join(" · ");
  const multiplier = fromHit ? flameTierOf(actor, item)?.multiplier ?? 1 : 1;
  const roll = await rollDamage(actor, formula, label, types, "", { crit: res.crit, messageMode: res.messageMode, extraTerms: mods.terms, multiplier, hammer: res.hammer });
  await consumeUsed(actor, res.reminders);
  if (res.savePreset) {
    const preset = { id: foundry.utils.randomID(), name: res.savePreset, entries: res.entries, pdr: res.pdr };
    await actor.update({ "system.damagePresets": [...sys.damagePresets.filter((p) => p.name !== res.savePreset), preset] });
    ui.notifications.info(`Preset de dano "${res.savePreset}" salvo.`);
  }
  if (fromHit) await afterHitDamage(actor, item, { crit: res.crit, secondary, types, hammer: res.hammer, messageMode: res.messageMode });
  return roll;
}

/** Effects of a confirmed hit's damage: critical → +1 Fôlego; Pedra · Quebra on a Concussão weapon hit. */
async function afterHitDamage(actor, item, { crit, secondary, types, hammer = false, messageMode }) {
  const sys = actor.system;
  const f = sys.resources.folego;
  if (crit && f.max !== null) {
    await actor.update({ "system.resources.folego.value": folegoGain(f.value, f.max) });
    ui.notifications.info(`${actor.name}: Crítico! +1 Fôlego.`);
  }
  // Metal · Martelo do Julgamento: after the damage of a standard critical, an extra attack in the same action.
  if (crit && !hammer && actor.system.derived.breathing?.key === "metal") {
    const data = `data-actor="${actor.uuid}" data-item="${item?.id ?? ""}"`;
    await postCard(actor, `<div class="nas-chat-card nas-attack-card"><h3>Martelo do Julgamento</h3>
      <p>Crítico padrão: ataque adicional na mesma ação (acerto padrão), metade do dano arredondada para cima, ignora resistências.</p>
      <div class="nas-chat-buttons"><button type="button" data-nas-weapon="hammer" ${data}><i class="fa-solid fa-hammer"></i> Atacar com o Martelo</button></div>
      <p class="nas-muted">Sinergia (Chamas, Pedra, Magma): um aliado pode gastar 1 PDR para o dano ser total; aplique pelo cartão.</p></div>`, messageMode);
  }
  // Pedra · Quebra: one stack per action that dealt Concussão with this weapon (the 2nd strike is the same action).
  if (item && !secondary && isStoneUser(actor) && isConcussion(types)) {
    const next = nextStoneBreak(item.system.stoneBreak, sys.derived.attributes.for);
    if (next !== item.system.stoneBreak) {
      await item.update({ "system.stoneBreak": next });
      ui.notifications.info(`${item.name}: Quebra ${next} (crítico ${weaponThreshold(actor, item)}+).`);
    }
  }
}

/**
 * Damage after a hit: opens the damage dialog pre-filled with the weapon (crit already ticked), or rolls straight
 * away with `direct` (Shift-click). Without a weapon the dialog opens empty.
 */
export async function damageFlow(actor, item, { crit = false, secondary = false, messageMode, direct = false, hammer = false } = {}) {
  const entries = item ? [weaponEntry(actor, item, secondary)] : [];
  if (direct && entries.length) {
    return rollDamageEntries(actor, {
      name: entries[0].label, entries, pdr: 0, crit, messageMode, hammer, reminders: readReminderIds(null, actor, "dano"),
    }, { item, secondary, fromHit: true });
  }
  const res = await askDamage(actor, { title: `${item?.name ?? "Acerto"}: dano`, name: entries[0]?.label ?? "", entries, crit });
  return res ? rollDamageEntries(actor, { ...res, hammer }, { item, secondary, fromHit: true }) : null;
}

/** Shift path kept for macros: weapon damage straight to chat. */
export const rollWeaponDamage = (actor, item, { crit = false, secondary = false } = {}) =>
  damageFlow(actor, item, { crit, secondary, direct: true });

/** One weapon equipped at a time; gear toggles freely. */
export async function toggleEquip(actor, item) {
  const on = !item.system.equipped;
  const updates = [{ _id: item.id, "system.equipped": on }];
  if (on && item.type === "weapon") {
    for (const w of actor.items) if (w.type === "weapon" && w.id !== item.id && w.system.equipped) updates.push({ _id: w.id, "system.equipped": false });
  }
  return actor.updateEmbeddedDocuments("Item", updates);
}

/** Use a gear item: consumables lose 1; a healing formula rolls and heals the targets (or the user); effect to chat. */
export async function useGear(actor, item) {
  const g = item.system;
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha usa o item.");
  if (g.quantity < 1) return ui.notifications.warn(`${item.name}: acabou.`);
  if (g.category === "consumivel") await item.update({ "system.quantity": g.quantity - 1 });
  await ChatMessage.implementation.create({
    speaker: ChatMessage.implementation.getSpeaker({ actor }),
    content: `<div class="nas-chat-card"><h3>${esc(item.name)}</h3><p>${esc(g.effect || "Item usado.")}</p>
      ${g.category === "consumivel" ? `<p class="nas-muted">Restam ${g.quantity - 1}.</p>` : ""}</div>`,
  });
  const heal = manualTerm(g.heal).replace(/^\+ /, "");
  if (g.heal && !heal) return ui.notifications.warn(`${item.name}: fórmula de cura "${g.heal}" inválida.`);
  if (!heal) return;
  const roll = await rollToChat(heal, actor, `Cura: ${item.name}`);
  const targets = targetActors();
  for (const a of targets.length ? targets : [actor]) await applyToActor(a, roll.total, true);
}

/** Catalog picker: copies a ported weapon into the actor as an embedded Item (the GM can still edit it). */
export async function addWeaponFromCatalog(actor) {
  const group = (cat, label) => `<optgroup label="${label}">${WEAPONS.filter((w) => w.category === cat)
    .map((w) => `<option value="${w.id}">${esc(w.name)} · ${esc(w.type)}</option>`).join("")}</optgroup>`;
  const id = await DialogV2.wait({
    window: { title: "Adicionar arma do catálogo" },
    content: `<div class="nas-dialog"><label class="nas-dialog-field">Arma
      <select name="weapon">${group("basica", "Armas Nichirin")}${group("especial", "Armas especiais")}</select></label></div>`,
    buttons: [
      { action: "add", label: "Adicionar", default: true, callback: (e, b) => b.form.elements.weapon.value },
      { action: "cancel", label: "Cancelar", callback: () => null },
    ],
    rejectClose: false,
  });
  const w = WEAPONS.find((x) => x.id === id);
  if (!w) return null;
  const { id: catalogId, name, img, ...rest } = w;
  return actor.createEmbeddedDocuments("Item", [{ name, img, type: "weapon", system: { ...rest, catalogId } }]);
}

/** Apply damage/healing to one Slayer actor, handling falls, Death Marks and statuses. */
export async function applyToActor(actor, amount, healing = false, types = []) {
  const sys = actor.system;
  if (actor.type !== "slayer") return ui.notifications.warn(`${actor.name}: aplicação automática só para Caçador nesta versão.`);
  if (!actor.isOwner) return ui.notifications.error(`${actor.name}: só o Mestre ou o dono aplica (socket desligado).`);
  if (healing) {
    const r = applyHealing({ pdv: sys.resources.pdv.value, max: sys.resources.pdv.max }, amount);
    await actor.update({ "system.resources.pdv.value": r.pdv, ...(r.revived ? { "system.death.marks": 0 } : {}) });
    if (r.revived && actor.statuses.has("beira_da_morte")) await actor.toggleStatusEffect("beira_da_morte", { active: false });
    return;
  }
  const r = applyDamage({ pdv: sys.resources.pdv.value, falls: sys.death.falls }, amount);
  const update = { "system.resources.pdv.value": r.pdv };
  // Vento · Sangue Especial: the battle's Cortante/Perfurante and Sangramento/Infecção, consolidated at the long rest.
  if (sys.derived.breathing?.key === "vento") {
    const w = windDamageSplit(amount, types);
    if (w.cut) update["system.passives.windCut"] = sys.passives.windCut + w.cut;
    if (w.bleed) update["system.passives.windBleed"] = sys.passives.windBleed + w.bleed;
  }
  if (r.fell) Object.assign(update, { "system.death.falls": r.falls, "system.death.marks": r.marks });
  await actor.update(update);
  if (r.fell) {
    await actor.toggleStatusEffect("beira_da_morte", { active: true });
    await ChatMessage.implementation.create({
      speaker: ChatMessage.implementation.getSpeaker({ actor }),
      content: r.dead
        ? `<p><strong>${esc(actor.name)}</strong> caiu pela 4ª vez neste combate: morte imediata (Vida e Morte §10), salvo decisão do Mestre.</p>`
        : `<p><strong>${esc(actor.name)}</strong> chegou a 0 PDV: À Beira da Morte (${r.falls}ª queda, começa com ${r.marks} Marca${r.marks === 1 ? "" : "s"} de Morte).</p>`,
    });
    if (r.dead) await actor.toggleStatusEffect("morto", { active: true });
  }
}

function targetActors() {
  const fromTargets = [...game.user.targets].map((t) => t.actor).filter(Boolean);
  if (fromTargets.length) return fromTargets;
  return (canvas?.tokens?.controlled ?? []).map((t) => t.actor).filter(Boolean);
}

/** Wire chat buttons and the turn hooks. Called once from the system init/ready. */
export function registerCombatAutomation() {
  Hooks.on("renderChatMessageHTML", (message, html) => {
    html.querySelectorAll("[data-nas-apply]").forEach((btn) => btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const actors = targetActors();
      if (!actors.length) return ui.notifications.warn("Selecione ou marque como alvo os tokens que recebem.");
      const amount = Number(btn.dataset.amount) || 0;
      const types = (btn.dataset.types ?? "").split(",").filter(Boolean);
      for (const a of actors) await applyToActor(a, amount, btn.dataset.nasApply === "heal", types);
    }));
    html.querySelectorAll("[data-nas-freeze]").forEach((btn) => btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const actor = fromUuidSync(btn.dataset.nasFreeze);
      if (actor) await addFreezeStack(actor);
      btn.disabled = true;
    }));
    html.querySelectorAll("[data-nas-weapon]").forEach((btn) => btn.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const actor = fromUuidSync(btn.dataset.actor);
      if (!actor) return ui.notifications.warn("Ficha do atacante não encontrada.");
      // Empty data-item = bare Acerto (no weapon): the damage dialog opens empty.
      const item = btn.dataset.item ? actor.items.get(btn.dataset.item) : null;
      if (btn.dataset.item && !item) return ui.notifications.warn("Arma não encontrada na ficha (removida?).");
      if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha rola com esta arma.");
      if (btn.dataset.nasWeapon === "second" || btn.dataset.nasWeapon === "hammer") {
        const extra = btn.dataset.nasWeapon === "second" ? { secondary: true } : { hammer: true };
        const opts = ev.shiftKey ? {} : await askAttack(actor, item, extra);
        if (opts) await attackWithWeapon(actor, item, { ...opts, ...extra });
        return;
      }
      await damageFlow(actor, item, {
        crit: btn.dataset.crit === "1", secondary: btn.dataset.secondary === "1", hammer: btn.dataset.hammer === "1", direct: ev.shiftKey && Boolean(item),
      });
    }));
  });

  const slayers = (combat) => combat.combatants.map((c) => c.actor).filter((a) => a?.type === "slayer");
  const resetActions = { movimento: false, ataque: false, especial: false, unica: false, completa: false, reacao: false };

  // Combat start: Fôlego full, actions free, fall counter reset (Compêndio §1; Vida e Morte §10 counts per combat).
  Hooks.on("combatStart", async (combat) => {
    if (!isWriter()) return;
    for (const a of slayers(combat)) {
      await a.update({ "system.resources.folego.value": a.system.resources.folego.max ?? 0, "system.actions": resetActions, "system.death.falls": 0 });
    }
  });

  // Start of a combatant's turn (forward only): actions reset and +1 Fôlego.
  Hooks.on("combatTurnChange", async (combat, prior, current) => {
    if (!isWriter()) return;
    // Combat start (prior round 0) is handled by combatStart; running both races the Fôlego refill.
    if (!(prior?.round >= 1)) return;
    const forward = current.round > prior.round || (current.round === prior.round && current.turn > prior.turn);
    if (!forward) return;
    const a = combat.combatant?.actor;
    if (a?.type !== "slayer") return;
    const f = a.system.resources.folego;
    await a.update({ "system.actions": resetActions, "system.resources.folego.value": folegoGain(f.value, f.max) });
    // Chamas · Fogo Fátuo 60: the weapon burns its wielder, 2 Concussão per turn.
    const burn = flameTierOf(a, equippedWeapon(a))?.selfDamage ?? 0;
    if (burn) {
      await applyToActor(a, burn, false, ["concussao"]);
      await postCard(a, `<p><strong>${esc(a.name)}</strong>: Fogo Fátuo no máximo, a arma causa ${burn} de dano Concussivo no usuário.</p>`);
    }
  });

  // Out of combat Fôlego returns to maximum; Pedra's Quebra and Chamas' Fogo Fátuo end with the combat.
  Hooks.on("deleteCombat", async (combat) => {
    if (!isWriter()) return;
    for (const a of slayers(combat)) {
      await a.update({ "system.resources.folego.value": a.system.resources.folego.max ?? 0, "system.actions": resetActions, "system.death.falls": 0 });
      const broken = a.items.filter((i) => i.type === "weapon" && (i.system.stoneBreak > 0 || i.system.heat > 0))
        .map((i) => ({ _id: i.id, "system.stoneBreak": 0, "system.heat": 0 }));
      if (broken.length) await a.updateEmbeddedDocuments("Item", broken);
    }
  });
}

/* ---------------------------------------------------------------- Passive actions ---------------------------------------------------------------- */

/** Neve · Congelar: with 5 stacks, an Ação Única restrains the targets (escape: Ataque + FOR vs CD 8 + CAR). */
export async function useFreeze(actor) {
  const sys = actor.system;
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha usa Congelar.");
  if (sys.passives.freeze < FREEZE_STACKS) return ui.notifications.warn(`Congelar: ${sys.passives.freeze}/${FREEZE_STACKS} acúmulos.`);
  if (sys.actions.unica) return ui.notifications.warn("Congelar gasta a Ação Única, que já foi usada neste turno.");
  const targets = [...game.user.targets].map((t) => t.actor).filter(Boolean);
  if (!targets.length) return ui.notifications.warn("Marque como alvo o inimigo que vai ser congelado.");
  await actor.update({ "system.passives.freeze": 0, "system.actions.unica": true });
  const cd = 8 + sys.derived.attributes.car;
  const applied = [];
  for (const t of targets) {
    if (t.isOwner) { await t.toggleStatusEffect("restricao", { active: true }); applied.push(t.name); }
  }
  const others = targets.filter((t) => !t.isOwner).map((t) => t.name);
  await postCard(actor, `<div class="nas-chat-card"><h3>Congelar</h3>
    <p>${esc(targets.map((t) => t.name).join(", "))}: <strong>Restrição de Movimentos</strong>.</p>
    <p>Escapa gastando uma Ação de Ataque e passando em FOR contra <strong>CD ${cd}</strong> (8 + CAR). Qualquer dano recebido desfaz o enraizamento.</p>
    ${others.length ? `<p class="nas-muted">Sem permissão para marcar o status em ${esc(others.join(", "))}: o Mestre aplica.</p>` : ""}</div>`);
  return applied;
}

/** Vento · Sangue Especial at the long rest: last battle's damage becomes scars (+CAR tests) and VIT tests. */
export async function windLongRest(actor) {
  const p = actor.system.passives;
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha consolida o descanso.");
  const next = windConsolidate({ cut: p.windCut, bleed: p.windBleed, scars: p.scars, vit: p.windVit });
  await actor.update({ "system.passives.windCut": 0, "system.passives.windBleed": 0, "system.passives.scars": next.scars, "system.passives.windVit": next.vit });
  await postCard(actor, `<div class="nas-chat-card"><h3>Sangue Especial · descanso longo</h3>
    <p>Cortante/Perfurante: ${p.windCut} → Cicatrizes ${p.scars} → <strong>${next.scars}</strong> (+${next.scars} em testes de CAR).</p>
    <p>Sangramento/Infecção: ${p.windBleed} → Resistência Vital ${p.windVit} → <strong>${next.vit}</strong> (+${next.vit} em testes de VIT).</p></div>`);
  return next;
}
