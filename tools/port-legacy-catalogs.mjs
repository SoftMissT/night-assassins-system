#!/usr/bin/env node
/**
 * Ports canonical data from the legacy CSB module into native JSON catalogs (data, not code).
 *   node tools/port-legacy-catalogs.mjs [legacyRepo] [rulesDir]
 * Sources (canonical per CLAUDE.md): <legacy>/catalogs/slayer/progression.json, <legacy>/catalogs/breathing.json.
 * Breathing display names come from the rule files in <rulesDir>/03 - Respirações (43 names, correct article).
 * Output: module/catalogs/slayer-progression.json, module/catalogs/breathings.json.
 */
import { readFileSync, readdirSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const legacy = process.argv[2] ?? "D:/GIthub/night-assassins-csb-automation";
const rulesDir = process.argv[3] ?? "D:/d&D/LORES E CONCEITOS PARA MESAS DE AMIGOS DE RPG/Toemasa - O Vale das Almas Roubadas/Sistema";
const out = new URL("../module/catalogs/", import.meta.url);
mkdirSync(out, { recursive: true });

const slug = (t) => String(t).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Legacy progression events → readable Portuguese labels. */
const EVENT_LABELS = {
  "attributes:create": "Criação dos atributos",
  "breathing:choose-primary": "Escolha da Respiração Primária",
  "weapon:choose-proficiency": "Escolha da arma proficiente",
  "selection-final:complete": "Conclusão da Seleção Final",
  "nichirin:receive": "Recebe a Nichirin (Metal e Cor)",
  "attributes:gain-one": "+1 em um atributo",
  "class:choose": "Escolha da Classe/Especialização",
  "class:unlock-C": "Habilidade de Classe Rank C",
  "breathing:unlock-2": "Respiração nível 2",
  "breathing:variation": "Variação de Respiração",
  "class:unlock-B": "Habilidade de Classe Rank B",
  "ability:unlock-6": "Habilidade de Origem e marco do Dom (nível 6)",
  "transparent-world:eligible": "Elegível ao Mundo Transparente",
  "class:unlock-A": "Habilidade de Classe Rank A",
  "breathing:unlock-3": "Respiração nível 3",
  "breathing:exclusive-technique": "Técnica exclusiva de Respiração",
  "breathing:master-discovery": "Descoberta de Mestre (Respiração)",
  "crimson-blade:eligible": "Elegível à Lâmina Carmesim",
  "class:unlock-S": "Habilidade de Classe Rank S",
  "altruistic-state:eligible": "Elegível ao Estado Altruísta",
  "class:unlock-SS": "Habilidade de Classe Rank SS",
  "breathing:unlock-4": "Respiração nível 4",
  "ability:unlock-12": "Marco do Dom (nível 12)",
  "breathing:creative-versatility": "Versatilidade criativa (Respiração)",
  "mark:higher-power": "Poder superior da Marca",
};

// ---- progression ----
const prog = JSON.parse(readFileSync(join(legacy, "catalogs/slayer/progression.json"), "utf8"));
const levels = Object.fromEntries(Object.entries(prog.levels).map(([lvl, v]) => [lvl, {
  patente: v.rank,
  breathingLevel: v.breathingLevel,
  classRank: v.classRank ?? null,
  events: v.events.map((id) => ({ id, label: EVENT_LABELS[id] ?? id })),
}]));
writeFileSync(new URL("slayer-progression.json", out), JSON.stringify({ source: "legacy catalogs/slayer/progression.json", levels }, null, 1) + "\n");

// ---- breathings ----
/** "Ataque ou Especial" → { mode: "or", keys: ["ataque","especial"] }; "Passiva"/unknown → none. */
function actionCost(raw) {
  const t = String(raw ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\bacao (de )?/g, "").trim();
  const map = { unica: "unica", ataque: "ataque", especial: "especial", completa: "completa", reacao: "reacao", movimento: "movimento", livre: "livre", passiva: "passiva" };
  const mode = /\bou\b|\//.test(t) ? "or" : /\+/.test(t) ? "and" : "one";
  const keys = t.split(/\bou\b|\/|\+/).map((s) => map[s.trim()]).filter(Boolean);
  return { label: String(raw ?? "Não informada"), mode: keys.length > 1 ? mode : "one", keys };
}
const docs = JSON.parse(readFileSync(join(legacy, "catalogs/breathing.json"), "utf8")).documents.filter((d) => d.system?.props?.forma_id);
const forms = {};
for (const d of docs) {
  const p = d.system.props;
  const key = slug(p.respiracao_nome);
  const levelsOf = [1, 2, 3, 4].filter((n) => Number(p[`tem_nvl${n}`]) === 1).map((n) => ({
    level: n,
    cost: Number(p[`nvl${n}_custo`]) || 0,
    damage: String(p[`nvl${n}_dano`] ?? "").trim(),
    effect: String(p[`nvl${n}_efeito`] ?? "").trim(),
    status: String(p[`nvl${n}_status`] ?? "").trim(),
    buff: String(p[`nvl${n}_buff`] ?? "").trim(),
    damageTypes: String(p[`nvl${n}_tipos_dano`] ?? "").split(/[,;]\s*/).filter(Boolean),
  }));
  (forms[key] ??= []).push({
    id: p.forma_id, order: Number(p.forma_ordem) || 0, name: p.nome_forma, nameJp: p.nome_jp ?? "",
    requiredBreathingLevel: Number(p.nivel_req) || 1, action: actionCost(p.tipo_manobra),
    baseDamageType: p.tipo_dano_base ?? "", description: p.descricao ?? "", requirement: p.requisito_texto ?? "",
    levels: levelsOf,
  });
}
for (const list of Object.values(forms)) list.sort((a, b) => a.order - b.order);

// Names from rule files ("Respiração da Água.md" → name with the correct article).
const ruleFiles = readdirSync(join(rulesDir, "03 - Respirações")).filter((f) => f.endsWith(".md"));
const breathings = ruleFiles.map((f) => {
  const name = f.replace(/\.md$/, "");
  const base = name.replace(/^Respiração (da|do|das|dos|de) /, "");
  const key = slug(base);
  const alias = { flores: "flores", insetos: "insetos" }[key] ?? key;
  return { key: alias, name, formsCatalogued: Boolean(forms[alias]) };
}).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

writeFileSync(new URL("breathings.json", out), JSON.stringify({
  source: "legacy catalogs/breathing.json (forms) + rules 03 - Respirações (names)",
  breathings, forms,
}) + "\n");

const missing = breathings.filter((b) => !b.formsCatalogued).map((b) => b.name);
const orphan = Object.keys(forms).filter((k) => !breathings.some((b) => b.key === k));
console.log(`progression: ${Object.keys(levels).length} níveis`);
console.log(`breathings: ${breathings.length} nomes, ${Object.keys(forms).length} com Formas, ${docs.length} Formas`);
console.log(`sem Formas no legado: ${missing.join(", ") || "-"}`);
console.log(`Formas sem arquivo de regra: ${orphan.join(", ") || "-"}`);

// ---------- Weapons (legacy catalogs/slayer-weapons.json; special data from catalogs/special-weapons.json) ----------
const weaponDocs = JSON.parse(readFileSync(join(legacy, "catalogs/slayer-weapons.json"), "utf8")).documents.filter((d) => d.system?.props?.arma_nome);
const specialByName = new Map(JSON.parse(readFileSync(join(legacy, "catalogs/special-weapons.json"), "utf8")).documents.map((d) => [d.name, d.system.props]));
const ATTR_KEYS = ["VIT", "DEX", "FOR", "CAR", "FDV", "INT", "SAB"];
const props = (t) => String(t ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[ *_]/g, "")
  .split(/[/,&;]|\s+e\s+/).map((p) => p.replace(/\d+$/, "").trim()).filter(Boolean);
/** Hit attribute(s), legacy weapon-service: explicit > Acuidade FOR/DEX > Concussão FOR > Manejável DEX > profile attrs. */
function hitAttrs(p, profile) {
  const keys = props(p.arma_propriedades);
  if (keys.includes("acuidade")) return ["for", "dex"];
  if (keys.includes("concussao")) return ["for"];
  if (keys.includes("manejavel")) return ["dex"];
  const fromProfile = (profile?.atributos ?? []).map((a) => String(a.key).toLowerCase()).filter((k) => ATTR_KEYS.includes(k.toUpperCase()));
  return fromProfile.length ? [...new Set(fromProfile)] : ["for", "dex"];
}
const diceOf = (t) => [...String(t ?? "").matchAll(/\b\d+d\d+\b/gi)].map((m) => m[0]).join(" + ");
const weapons = weaponDocs.map((d) => {
  const p = { ...d.system.props, ...(specialByName.get(d.name) ?? {}) };
  const special = p.arma_categoria === "especial";
  const profiles = (p.arma_perfis_ataque ?? []).map((pf) => ({
    name: pf.nome ?? "Ataque Base",
    mode: pf.modo ?? "",
    text: pf.formula_texto ?? "",
    fixed: Number(pf.dano_fixo) || 0,
    dice: String(pf.dano_dados ?? "").trim(),
    attrs: (pf.atributos_dano ?? pf.atributos ?? []).map((a) => ({ key: String(a.key).toLowerCase(), mult: Number(a.multiplicador) || 1, choice: a.escolha === true })),
    types: pf.tipos_dano ?? p.arma_tipos_dano ?? [],
    range: pf.alcance ?? p.arma_alcance ?? "",
    crit: Number(pf.critico ?? p.arma_critico) || 20,
    attacks: Math.max(1, Number(pf.ataques) || 1),
    secondPenalty: Number(pf.penalidade_segundo_acerto) || 0,
    secondNoAttr: pf.acerto_segundo_sem_atributo === true,
    secondDamage: pf.dano_segundo_golpe ?? "normal",
    hitAttrs: (pf.atributos_acerto ?? []).map((a) => String(a.key).toLowerCase()),
  }));
  const evo = p.arma_dado_evolutivo_por_rank ?? {};
  const byRank = p.arma_formulas_por_rank ?? {};
  const rankDice = special ? Object.fromEntries(["D", "C", "B", "A", "S", "SS"].map((r) => [r, typeof evo[r] === "string" ? evo[r] : diceOf(Array.isArray(byRank[r]) ? byRank[r][0] : byRank[r])])) : null;
  const icon = d.img.split("/").pop();
  return {
    id: slug(d.name), name: d.name, category: special ? "especial" : "basica",
    img: `systems/night-assassins/assets/icons/${icon.startsWith("na_") ? "items" : "weapons"}/${icon}`,
    type: p.arma_tipo ?? "", crit: Number(p.arma_critico) || 20, range: p.arma_alcance ?? "",
    properties: p.arma_propriedades ?? "", requirement: p.arma_requisito ?? "", damageTypes: [].concat(p.arma_tipos_dano ?? []).flatMap((t) => String(t).split(/[,;]\s*/)).filter(Boolean),
    hitAttrs: profiles[0]?.hitAttrs?.length ? [...new Set(profiles[0].hitAttrs)] : hitAttrs(p, p.arma_perfis_ataque?.[0]), profiles, rankDice,
    description: String(p.descricao ?? "").trim(),
    rule: String(p.arma_regra_completa ?? "").trim(),
    special: special ? {
      entity: p.arma_entidade ?? "", demon: p.arma_demonio ?? "",
      summary: Array.isArray(p.arma_resumo_rapido) ? p.arma_resumo_rapido : [],
      critRule: String(p.arma_critico_regra ?? "").trim(),
    } : null,
  };
}).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name, "pt-BR"));
writeFileSync(new URL("weapons.json", out), JSON.stringify({ source: "legacy catalogs/slayer-weapons.json + special-weapons.json", weapons }) + "\n");
console.log(`weapons: ${weapons.length} (${weapons.filter((w) => w.category === "basica").length} básicas, ${weapons.filter((w) => w.special).length} especiais)`);
