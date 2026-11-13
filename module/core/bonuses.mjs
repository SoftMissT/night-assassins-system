/**
 * Derived bonus channels, pure (no Foundry globals). Ported from the legacy derived-bonus-service.mjs
 * (channels, Habilidade fallbacks, Metal/Cor) plus the Blood Gift milestones of
 * plans/night-assassins-criacao-atributos-progressao.md §4.3.
 */
import { ATTRIBUTE_IDS } from "./progression.mjs";

export const BONUS_CHANNELS = Object.freeze([
  "acerto", "bloqueio", "esquiva", "percepcaoVisual", "percepcaoAuditiva",
  "socialVoz", "danoFixo", "iniciativa", "pdrMaximo", "teste",
]);
export const CHANNEL_LABELS = Object.freeze({
  acerto: "Acerto", bloqueio: "Bloqueio", esquiva: "Esquiva", percepcaoVisual: "Percepção visual",
  percepcaoAuditiva: "Percepção auditiva", socialVoz: "Social (voz)", danoFixo: "Dano fixo",
  iniciativa: "Iniciativa", pdrMaximo: "PDR máximo", teste: "Testes",
});

/** Nichirin Metal & Color (legacy metalFallback). Colors without a channel bonus still exist for the narrative. */
export const METALS = Object.freeze({
  metal_cinza: "Cinza", metal_laranja: "Laranja", metal_azul: "Azul", metal_verde: "Verde", metal_branca: "Branca",
  metal_preto: "Preta", metal_dourada: "Dourada", metal_roxa: "Roxa", metal_coral: "Coral", metal_rosa: "Rosa",
  metal_vermelha: "Vermelha", metal_ambar: "Âmbar",
});

function metalBonus(metal, channel, breathingLevel) {
  const values = {
    acerto: metal === "metal_dourada" ? 4 : 0,
    bloqueio: metal === "metal_preto" ? 4 : metal === "metal_azul" ? 3 : 0,
    esquiva: metal === "metal_azul" ? 3 : 0,
    percepcaoVisual: metal === "metal_branca" ? 3 : 0,
    danoFixo: metal === "metal_vermelha" ? 2 : 0,
    iniciativa: metal === "metal_coral" ? 4 : 0,
    pdrMaximo: metal === "metal_rosa" ? 4 * Math.max(0, breathingLevel) : 0,
  };
  return values[channel] ?? 0;
}

/** Blood Gift channel bonuses (legacy abilityFallback; level ≥ 6 upgrades). */
function giftBonus(gift, channel, level) {
  if (gift === "tato_sensitivo") {
    if (channel === "bloqueio") return level >= 6 ? 3 : 2;
    if (channel === "esquiva") return level >= 6 ? 2 : 1;
  }
  if (gift === "visao_agucada") {
    if (channel === "acerto" || channel === "esquiva") return 1;
    if (channel === "percepcaoVisual") return 2;
  }
  if (gift === "audicao_sobrenatural" && (channel === "percepcaoAuditiva" || channel === "socialVoz")) {
    return level >= 6 ? 3 : 2;
  }
  return 0;
}

/**
 * Permanent attribute bonuses from the Blood Gift (§4.3): Tsuyoi +1 VIT and +1 FOR;
 * Marca do Destino +2 (+3 from level 6) in the chosen attribute.
 */
export function giftAttributeBonuses(gift, level, giftAttr = "") {
  const out = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, 0]));
  if (gift === "tsuyoi") { out.vit += 1; out.for += 1; }
  if (gift === "marca_do_destino" && ATTRIBUTE_IDS.includes(giftAttr)) out[giftAttr] += level >= 6 ? 3 : 2;
  return out;
}

/**
 * Resolve every channel with an auditable source list.
 * @returns {Record<string,{total:number,sources:{label:string,value:number}[]}>}
 */
export function resolveBonuses({ gift = "", level = 1, metal = "", breathingLevel = 0, fixed = {} } = {}) {
  const channels = Object.fromEntries(BONUS_CHANNELS.map((c) => [c, { total: 0, sources: [] }]));
  const add = (channel, value, label) => {
    const v = Number(value) || 0;
    if (!v) return;
    channels[channel].total += v;
    channels[channel].sources.push({ label, value: v });
  };
  for (const c of BONUS_CHANNELS) {
    add(c, giftBonus(gift, c, level), "Dom do Sangue");
    add(c, metalBonus(metal, c, breathingLevel), `Metal ${METALS[metal] ?? ""}`.trim());
    add(c, fixed?.[c], "Bônus fixo");
  }
  return channels;
}
