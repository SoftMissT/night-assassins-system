/**
 * Slayer creation and progression rules, pure (no Foundry globals).
 * Source: plans/night-assassins-criacao-atributos-progressao.md (§2, §3, §4, §5, §6).
 */

export const ATTRIBUTE_IDS = Object.freeze(["vit", "dex", "for", "car", "fdv", "int", "sab"]);
export const MAX_SLAYER_LEVEL = 14;

/** d12 Origin table (§3.2): base PDV is added every level, base PDR only at level 1. */
export const ORIGINS = Object.freeze({
  origem_artista_marcial: { name: "Artista Marcial", d12: 1, pdv: 16, pdr: 10, hab1: "Corpo de Diamante", hab6: "Oito Portões" },
  origem_civilizado: { name: "Civilizado", d12: 2, pdv: 10, pdr: 5, hab1: "Rede de Informantes", hab6: "Controle de Multidão" },
  origem_corsario: { name: "Corsário", d12: 3, pdv: 14, pdr: 7, hab1: "Jūken-Ryū", hab6: "Pólvora" },
  origem_criado_ex_hashira: { name: "Criado por Ex-Hashira", d12: 4, pdv: 12, pdr: 9, hab1: "Memória do Mestre", hab6: "Forma Secreta" },
  origem_descendente_perdido: { name: "Descendente Perdido", d12: 5, pdv: 12, pdr: 10, hab1: "Ressonância Sanguínea", hab6: "Marca Latente" },
  origem_estrangeiro: { name: "Estrangeiro", d12: 6, pdv: 13, pdr: 8, hab1: "Ritmo Desconhecido", hab6: "Adaptação Cultural" },
  origem_isolado: { name: "Isolado", d12: 7, pdv: 16, pdr: 4, hab1: "Pele Grossa", hab6: "Segundo Fôlego" },
  origem_militar: { name: "Militar", d12: 8, pdv: 13, pdr: 6, hab1: "Ordem de Campo", hab6: "Fogo de Cobertura" },
  origem_monge: { name: "Monge", d12: 9, pdv: 12, pdr: 14, hab1: "Chama Interna", hab6: "Mantra de Proteção" },
  origem_ninja: { name: "Ninja", d12: 10, pdv: 13, pdr: 14, hab1: "Passo Fantasma", hab6: "Ponto Cego" },
  origem_samurai: { name: "Samurai", d12: 11, pdv: 14, pdr: 6, hab1: "Bushidō", hab6: "Iaidō" },
  origem_tsuguko: { name: "Tsuguko", d12: 12, pdv: 12, pdr: 16, hab1: "Herança Viva", hab6: "Sucessão Perfeita" },
});

/** d100 Blood Gift table (§4.2). */
export const GIFTS = Object.freeze({
  sem_habilidade: { name: "Sem Habilidade", range: "01–25" },
  tato_sensitivo: { name: "Tato Sensitivo", range: "26–36" },
  audicao_sobrenatural: { name: "Audição Sobrenatural", range: "37–47" },
  visao_agucada: { name: "Visão Aguçada", range: "48–58" },
  olfato_sobrenatural: { name: "Olfato Sobrenatural", range: "59–69" },
  metamorfose_carnivora: { name: "Metamorfose Carnívora", range: "70–80" },
  tsuyoi: { name: "Tsuyoi (O Inabalável)", range: "81–91" },
  marechi: { name: "Marechi (O Sangue Raro)", range: "92–98" },
  oketsu: { name: "Ōketsu (O Sangue Real)", range: "99" },
  marca_do_destino: { name: "Marca do Destino", range: "100" },
});

/** Class rank by level (§5.1); null before level 4. */
export function classRank(level) {
  if (level >= 12) return "SS";
  if (level >= 11) return "S";
  if (level >= 8) return "A";
  if (level >= 6) return "B";
  if (level >= 4) return "C";
  return null;
}

/** Snapshot level used by the PDV/PDR formulas (§6.1): 1–2 → 1, 3–6 → 3, 7–14 → 7. */
export function snapshotLevel(level) {
  if (level >= 7) return 7;
  if (level >= 3) return 3;
  return 1;
}

/**
 * Attribute values at snapshots 1, 3 and 7 from the creation values plus the +1 gains of levels 3 and 7 (§2.1).
 * `gain3`/`gain7` are attribute ids or "".
 */
export function attributeSnapshots(base, gain3 = "", gain7 = "") {
  const s1 = Object.fromEntries(ATTRIBUTE_IDS.map((id) => [id, Number(base?.[id]) || 0]));
  const s3 = { ...s1 };
  if (ATTRIBUTE_IDS.includes(gain3)) s3[gain3] += 1;
  const s7 = { ...s3 };
  if (ATTRIBUTE_IDS.includes(gain7)) s7[gain7] += 1;
  return { 1: s1, 3: s3, 7: s7 };
}

/** Current attributes for a level: the snapshot in force at that level. */
export function currentAttributes(level, snapshots) {
  return { ...snapshots[snapshotLevel(level)] };
}

/** Blood Gift bonus per level, retroactive (§4.5, §6.4). Tsuyoi tiers: 1–5 +2, 6–11 +3, 12+ +4. */
export function giftBonusPerLevel(gift, level) {
  const pdv = gift === "tsuyoi" ? (level >= 12 ? 4 : level >= 6 ? 3 : 2) : 0;
  const pdr = gift === "marechi" ? 1 : gift === "oketsu" ? 2 : 0;
  return { pdv, pdr };
}

/**
 * Maximum PDV/PDR (§6.1–6.2).
 *   PDV(1) = OrigemPDV + VIT(1) + habPDV;  PDV(N) = PDV(N-1) + OrigemPDV + VIT(t) + habPDV
 *   PDR(1) = OrigemPDR + FDV(1) + habPDR;  PDR(N) = PDR(N-1) + 1 + FDV(t) + habPDR
 * Level 14 permanent choice: "pdv" adds VIT×3, "pdr" adds FDV×2 (snapshot 7).
 * Returns null fields when the Origin is unknown, so callers never show a guessed number.
 */
export function slayerMaxResources({ level, origin, snapshots, gift = "", level14 = "" }) {
  const o = typeof origin === "string" ? ORIGINS[origin] : origin;
  if (!o) return { pdv: null, pdr: null };
  const n = Math.max(1, Math.min(MAX_SLAYER_LEVEL, Math.trunc(Number(level) || 1)));
  const hab = giftBonusPerLevel(gift, n);
  let pdv = 0;
  let pdr = 0;
  for (let i = 1; i <= n; i++) {
    const snap = snapshots[snapshotLevel(i)];
    pdv += o.pdv + snap.vit + hab.pdv;
    pdr += (i === 1 ? o.pdr : 1) + snap.fdv + hab.pdr;
  }
  if (n === MAX_SLAYER_LEVEL) {
    const s7 = snapshots[7];
    if (level14 === "pdv") pdv += s7.vit * 3;
    if (level14 === "pdr") pdr += s7.fdv * 2;
  }
  return { pdv, pdr };
}

/** Combat Breath maximum (Sistema_NAS_Compendio §1): 2 + FDV. */
export function folegoMax(fdv) {
  return 2 + (Number(fdv) || 0);
}
