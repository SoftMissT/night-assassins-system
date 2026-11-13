/**
 * Slayer level-up modal (plans/night-assassins-criacao-atributos-progressao.md §2.1, §5.1, §6, §8).
 * Shows the PDV/PDR gain, asks the +1 attribute at levels 3 and 7, the Class at level 4 (Rank C)
 * and the permanent level-14 choice. Current PDV/PDR grow by the gain (damage taken is kept).
 */
import { ATTRIBUTE_IDS, MAX_SLAYER_LEVEL, attributeSnapshots, classRank, currentAttributes, folegoMax, giftBonusPerLevel, slayerMaxResources } from "../core/progression.mjs";
import { giftAttributeBonuses, resolveBonuses } from "../core/bonuses.mjs";
import { breathingLevel, levelEvents, patente } from "../core/levels.mjs";
import { chatNotice } from "./rolls.mjs";

const { DialogV2 } = foundry.applications.api;
const ATTR_LABELS = { vit: "VIT", dex: "DEX", for: "FOR", car: "CAR", fdv: "FDV", int: "INT", sab: "SAB" };
const CLASSES = [
  ["classe_mb", "Mestre de Batalha"],
  ["classe_usuario_de_veneno", "Usuário de Veneno"],
  ["classe_kakushi", "Kakushi"],
  ["classe_companheiro_oni", "Companheiro Oni"],
  ["classe_usuario_de_duas_resp", "Usuário de Duas Respirações"],
];

/** Maxima for a given level and choices, using the actor's creation values. */
function maxAt(sys, level, progression) {
  // Same composition as SlayerData.prepareDerivedData: permanent Gift bonuses count; Metal Rosa adds per Breathing level.
  const gift = giftAttributeBonuses(sys.gift, level, sys.giftAttr);
  const permanent = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, sys.attributes[id] + gift[id]]));
  const snaps = attributeSnapshots(permanent, progression.gain3, progression.gain7);
  const res = slayerMaxResources({ level, origin: sys.originId, snapshots: snaps, gift: sys.gift, level14: progression.level14 });
  const rosa = resolveBonuses({ metal: sys.metal, breathingLevel: breathingLevel(level) }).pdrMaximo.total;
  return { pdv: res.pdv, pdr: res.pdr + rosa, folego: folegoMax(currentAttributes(level, snaps).fdv + sys.attributeBonus.fdv) };
}

export async function levelUp(actor) {
  const sys = actor.system;
  const from = sys.level;
  if (!actor.isOwner) return ui.notifications.error("Só o dono da ficha pode subir de nível.");
  if (from < 1) return ui.notifications.warn("Faça a criação do personagem (nível 0 → 1) primeiro.");
  if (from >= MAX_SLAYER_LEVEL) return ui.notifications.info(`Nível máximo do Caçador: ${MAX_SLAYER_LEVEL}.`);
  if (!sys.originId) return ui.notifications.warn("A ficha precisa de Origem para calcular PDV/PDR.");
  const to = from + 1;
  const needGain = to === 3 || to === 7;
  const needClass = to === 4 && !sys.classId;
  const need14 = to === MAX_SLAYER_LEVEL;
  const cur = sys.derived.attributes;
  const before = maxAt(sys, from, sys.progression);
  const preview = maxAt(sys, to, sys.progression);
  const rank = classRank(to);
  const giftNote = sys.gift === "tsuyoi" && (to === 6 || to === 12)
    ? `<p>Tsuyoi sobe para +${giftBonusPerLevel("tsuyoi", to).pdv} PDV por nível, retroativo.</p>` : "";

  const attrSelect = needGain
    ? `<label>+1 permanente (nível ${to})<select name="gain">${ATTRIBUTE_IDS.map((id) => `<option value="${id}">${ATTR_LABELS[id]} ${cur[id]} → ${cur[id] + 1}</option>`).join("")}</select></label>` : "";
  const classSelect = needClass
    ? `<label>Classe / Especialização (Rank C)<select name="classId">${CLASSES.map(([id, n]) => `<option value="${id}">${n}</option>`).join("")}</select></label>` : "";
  const l14Select = need14
    ? `<label>Escolha permanente do nível 14<select name="level14"><option value="pdv">+VIT×3 PDV (+${cur.vit * 3})</option><option value="pdr">+FDV×2 PDR (+${cur.fdv * 2})</option></select></label>` : "";

  const result = await DialogV2.wait({
    window: { title: `${actor.name}: nível ${from} → ${to}`, icon: "fa-solid fa-stairs" },
    classes: ["nas-sheet", "nas-levelup"],
    content: `<div class="nas-levelup-body">
      <p><strong>Ganho de PDV:</strong> +${preview.pdv - before.pdv} · <strong>Ganho de PDR:</strong> +${preview.pdr - before.pdr}${needGain ? " (antes do +1)" : ""}</p>
      <p><strong>Patente:</strong> ${patente(from)} → ${patente(to)} · <strong>Respiração:</strong> nível ${breathingLevel(to)}${breathingLevel(to) > breathingLevel(from) ? " (sobe!)" : ""}</p>
      ${rank ? `<p><strong>Rank da Classe:</strong> ${rank}</p>` : ""}${giftNote}
      <ul class="nas-events">${levelEvents(to).map((e) => `<li><i class="fa-solid fa-flag"></i> ${e.label}</li>`).join("")}</ul>
      <div class="nas-fields">${attrSelect}${classSelect}${l14Select}</div>
    </div>`,
    buttons: [
      {
        action: "up", label: `Subir para o nível ${to}`, default: true, icon: "fa-solid fa-check",
        callback: (event, button) => {
          const f = button.form.elements;
          return { gain: f.gain?.value ?? "", classId: f.classId?.value ?? "", level14: f.level14?.value ?? "" };
        },
      },
      { action: "cancel", label: "Cancelar", icon: "fa-solid fa-xmark" },
    ],
    rejectClose: false,
  });
  if (!result || result === "cancel") return;

  const progression = { ...sys.progression };
  if (to === 3) progression.gain3 = result.gain;
  if (to === 7) progression.gain7 = result.gain;
  if (need14) progression.level14 = result.level14;
  const after = maxAt(sys, to, progression);
  const dPdv = after.pdv - before.pdv;
  const dPdr = after.pdr - before.pdr;
  const update = {
    "system.level": to,
    "system.progression": progression,
    "system.resources.pdv.value": Math.max(0, sys.resources.pdv.value + dPdv),
    "system.resources.pdr.value": Math.max(0, sys.resources.pdr.value + dPdr),
  };
  if (needClass && result.classId) update["system.classId"] = result.classId;
  await actor.update(update);
  const extra = [
    needGain ? `+1 ${ATTR_LABELS[result.gain]}` : null,
    needClass ? `Classe: ${CLASSES.find(([id]) => id === result.classId)?.[1]}` : null,
    rank ? `Rank ${rank}` : null,
    need14 ? `Nível 14: ${result.level14 === "pdv" ? "+VIT×3 PDV" : "+FDV×2 PDR"}` : null,
  ].filter(Boolean).join(" · ");
  await chatNotice(actor, `<h3>${actor.name} subiu para o nível ${to}</h3>
    <p>PDV máximo ${before.pdv} → ${after.pdv} (+${dPdv}) · PDR máximo ${before.pdr} → ${after.pdr} (+${dPdr}) · Fôlego ${after.folego}</p>
    <p>Patente: <strong>${patente(to)}</strong> · Respiração nível ${breathingLevel(to)}</p>
    ${extra ? `<p>${extra}</p>` : ""}
    <p>${levelEvents(to).map((e) => e.label).join(" · ")}</p>`);
}
