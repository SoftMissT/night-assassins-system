/**
 * Night Assassins status list (06 - Status e Condições/Tipos de Status.md), pure data.
 * `img` uses Foundry core icons. `rolls` marks the statuses that change test rolls automatically
 * (Vantagem/Desvantagem; Fadiga Mental gives Desvantagem on SAB tests, legacy status-effects.mjs).
 */
const s = (id, name, img, group, extra = {}) => ({ id, name, img: `icons/svg/${img}.svg`, group, ...extra });

export const STATUSES = Object.freeze([
  s("vantagem", "Vantagem", "upgrade", "Rolagem", { rolls: { advantage: true } }),
  s("desvantagem", "Desvantagem", "downgrade", "Rolagem", { rolls: { disadvantage: true } }),
  s("sangramento", "Sangramento", "blood", "Dano contínuo"),
  s("hemorragia", "Hemorragia", "blood", "Dano contínuo"),
  s("envenenado", "Envenenamento", "poison", "Dano contínuo"),
  s("corroido", "Corroído", "acid", "Dano contínuo"),
  s("em_chamas", "Em Chamas", "fire", "Dano contínuo"),
  s("invisivel", "Invisível / Inalvejável", "invisible", "Defesa"),
  s("vulneravel", "Vulnerável", "target", "Dano amplificado"),
  s("restricao", "Restrição de Movimentos", "net", "Mobilidade"),
  s("hipotermia", "Hipotermia", "frozen", "Mobilidade"),
  s("atordoado", "Atordoamento", "daze", "Incapacitação"),
  s("paralisado", "Paralisia", "paralysis", "Incapacitação"),
  s("colapso", "Colapso", "unconscious", "Incapacitação"),
  s("derrubado", "Derrubado", "falling", "Incapacitação"),
  s("confuso", "Confuso", "stoned", "Incapacitação"),
  s("fratura", "Fratura", "bones", "Incapacitação"),
  s("sonhando", "Sonhando", "sleep", "Incapacitação"),
  s("amedrontado", "Amedrontado", "terror", "Psicológico"),
  s("frenesi", "Frenesi (Berserk)", "lightning", "Psicológico"),
  s("desequilibrado", "Desequilibrado", "falling", "Posicionamento"),
  s("desorientado", "Desorientado", "stoned", "Posicionamento"),
  s("distraido", "Distraído", "eye", "Posicionamento"),
  s("empurrado", "Empurrado", "wing", "Posicionamento"),
  s("flanqueado", "Flanqueado", "target", "Posicionamento"),
  s("cegueira_parcial", "Cegueira Parcial", "blind", "Sensorial"),
  s("surdez_parcial", "Surdez Parcial", "deaf", "Sensorial"),
  s("corrupcao", "Corrupção", "radiation", "Espiritual"),
  s("regeneracao_suprimida", "Regeneração Suprimida", "degen", "Espiritual"),
  s("silenciado", "Silenciado", "silenced", "Espiritual"),
  s("suprimido", "Suprimido", "cancel", "Espiritual"),
  s("fadiga_corporal", "Fadiga Corporal", "down", "Fadiga"),
  s("fadiga_espiritual", "Fadiga Espiritual", "down", "Fadiga"),
  s("fadiga_mental", "Fadiga Mental", "down", "Fadiga", { rolls: { disadvantageOn: ["sab"] } }),
  s("encorajado", "Encorajado", "aura", "Benéfico"),
  s("ferida", "Ferida", "blood", "Ferida"),
  s("exaustao", "Exaustão", "sleep", "Ferida"),
  s("beira_da_morte", "À Beira da Morte", "skull", "Vida e morte"),
  s("inconsciente", "Inconsciente", "unconscious", "Vida e morte"),
  s("morto", "Morto", "skull", "Vida e morte"),
]);

/**
 * Roll-mode flags for a set of active status ids and the tested attribute, with the statuses that cause each
 * (the roll dialog names them, like the legacy "Bônus automáticos" block).
 */
export function statusRollFlags(activeIds, attrId = "") {
  const active = new Set(activeIds);
  const advantageFrom = [];
  const disadvantageFrom = [];
  for (const st of STATUSES) {
    if (!active.has(st.id) || !st.rolls) continue;
    if (st.rolls.advantage) advantageFrom.push(st.name);
    if (st.rolls.disadvantage || st.rolls.disadvantageOn?.includes(attrId)) disadvantageFrom.push(st.name);
  }
  return { advantage: advantageFrom.length > 0, disadvantage: disadvantageFrom.length > 0, advantageFrom, disadvantageFrom };
}
