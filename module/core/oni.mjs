/**
 * Oni PDV/PDK progression, pure (no Foundry globals).
 * Source: plans/night-assassins-criacao-atributos-progressao.md §2.2, §7.
 * PDV dice are rolled once per level and stored; this module only sums what was rolled.
 */

/** Per-level gains (§7.2). `pdvDice` is rolled at level-up; `pdvFlat(vit)` is a fixed gain. Level 9 PDK = +20 (Pulso de Sangue Superior). */
export const ONI_LEVEL_GAINS = Object.freeze({
  2: { pdvDice: "1d4", pdk: 4 },
  3: { pdvDice: "1d4", pdk: 4 },
  4: { pdvDice: "1d6", pdk: 6 },
  5: { pdvDice: "1d6", pdk: 6 },
  6: { pdvDice: "1d6", pdk: 6 },
  7: { pdvDice: "2d4", pdk: 8 },
  8: { pdvDice: "2d4", pdk: 8 },
  9: { pdvDice: "2d4", pdk: 20 },
  10: { pdvDice: "2d6", pdk: 10 },
  11: { pdvDice: "2d6", pdk: 10 },
  12: { pdvDice: "2d6", pdk: 12 },
  13: { pdvFlat: (vit) => 30 + vit, pdk: 12 },
  14: { pdvFlat: (vit) => 30 + vit, pdk: 14 },
  15: { pdvFlat: (vit) => 30 + vit, pdk: 14 },
  16: { pdvFlat: (vit) => 40 + vit, pdk: 16 },
  17: { pdvFlat: (vit) => 40 + vit, pdk: 16 },
  18: { pdvFlat: (vit) => 40 + vit, pdk: 18 },
  19: { pdvFlat: (vit) => 40 + vit, pdk: 20 },
  20: { pdvFlat: (vit) => 50 + vit * 5, pdk: 50 },
});

/** Oni Origins (§7.3): base PDV/PDK as functions of VIT/FDV. Formulas kept exactly as written (do not normalize). */
export const ONI_ORIGINS = Object.freeze({
  passado_triste: { name: "Passado Triste", pdv: (a) => 22 + a.vit, pdk: (a) => 2 + a.fdv + a.fdv * 3 },
  personalidade_maligna: { name: "Personalidade Maligna", pdv: (a) => 16 + a.vit, pdk: (a) => 3 + a.fdv + a.fdv * 3 },
  rastreador_de_sangue: { name: "Rastreador de Sangue", pdv: (a) => 20 + a.vit, pdk: (a) => 1 + a.fdv + a.fdv * 3 },
  genio_do_mal: { name: "Gênio do Mal", pdv: (a) => 20 + a.vit, pdk: (a) => 2 + a.fdv + a.fdv * 3 },
  adepto_das_trevas: { name: "Adepto das Trevas", pdv: (a) => 19 + a.vit, pdk: (a) => 4 + a.fdv + a.fdv * 3 },
  oni_comum: { name: "Oni Comum", pdv: (a) => 18 + a.vit, pdk: (a) => 8 + a.fdv * 3 },
  corte_palida: { name: "Oni da Corte Pálida", pdv: (a) => 18 + a.vit, pdk: (a) => 18 + a.fdv * 3 },
  mare_negra: { name: "Oni da Maré Negra", pdv: (a) => 20 + a.vit, pdk: (a) => 17 + a.fdv * 3 },
  raiz_podre: { name: "Oni da Raiz Podre", pdv: (a) => 23 + a.vit, pdk: (a) => 16 + a.fdv * 3 },
  realidade_distorcida: { name: "Oni da Realidade Distorcida", pdv: (a) => 17 + a.vit, pdk: (a) => 20 + a.fdv * 3 },
  tela_do_submundo: { name: "Oni da Tela do Submundo", pdv: (a) => 18 + a.vit, pdk: (a) => 20 + a.fdv * 3 },
  outras_terras: { name: "Oni de Outras Terras", pdv: (a) => 18 + a.vit, pdk: (a) => 19 + a.fdv * 3 },
  transfigurado: { name: "Oni Transfigurado", pdv: (a) => 24 + a.vit, pdk: (a) => 16 + a.fdv * 3 },
  eco_eterno: { name: "Oni do Eco Eterno", pdv: (a) => 18 + a.vit, pdk: (a) => 19 + a.fdv * 3 },
  espirito_ceifador: { name: "Espírito Ceifador", pdv: (a) => 20 + a.vit, pdk: (a) => 18 + a.fdv * 3 },
  chama_negra: { name: "Oni da Chama Negra", pdv: (a) => 20 + a.vit, pdk: (a) => 19 + a.fdv * 3 },
  vampiro_de_linhagem: { name: "Vampiro de Linhagem", pdv: (a) => 19 + a.vit, pdk: (a) => 20 + a.fdv * 3 },
  monarca_demoniaco: { name: "Monarca Demoníaco", pdv: (a) => 22 + a.vit, pdk: (a) => 20 + a.fdv * 3 },
  linhagem_infernal: { name: "Demônio de Linhagem Infernal", pdv: (a) => 21 + a.vit, pdk: (a) => 20 + a.fdv * 3 },
  // Exterminador Corrompido depends on the fallen level and the former PDR max (§7.3).
  exterminador_corrompido: {
    name: "Exterminador Corrompido",
    pdv: (a, x = {}) => 30 + a.vit * 3 + 10 * (x.fallLevel ?? 0),
    pdk: (a, x = {}) => (x.formerPdrMax ?? 0) + (x.fallLevel ?? 0) * 2 + a.fdv * 3,
  },
});

/** Attribute-gain levels of the Oni (§2.2). */
export const ONI_ATTRIBUTE_LEVELS = Object.freeze([3, 4, 6, 8, 11, 12, 13, 16]);

/**
 * Oni maxima (§7.1): Origin base + accumulated gains.
 * `pdvRolls` maps level → total rolled for that level's PDV dice (stored, never rerolled).
 * Fixed gains use the current VIT (automation choice noted in §7.5). Missing rolls are reported, not guessed.
 */
export function oniMaxResources({ level, origin, attributes, pdvRolls = {}, extra = {} }) {
  const o = typeof origin === "string" ? ONI_ORIGINS[origin] : origin;
  if (!o) return { pdv: null, pdk: null, missingRolls: [] };
  const n = Math.max(1, Math.min(20, Math.trunc(Number(level) || 1)));
  let pdv = o.pdv(attributes, extra);
  let pdk = o.pdk(attributes, extra);
  const missingRolls = [];
  for (let i = 2; i <= n; i++) {
    const g = ONI_LEVEL_GAINS[i];
    pdk += g.pdk;
    if (g.pdvFlat) pdv += g.pdvFlat(attributes.vit);
    else if (Number.isFinite(Number(pdvRolls[i]))) pdv += Number(pdvRolls[i]);
    else missingRolls.push(i);
  }
  return { pdv, pdk, missingRolls };
}
