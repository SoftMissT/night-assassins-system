/**
 * Breathing passives, pure. Rules from the ported Forms text (module/catalogs/breathings.json) and the legacy
 * services (flame-breathing-data, metal-breathing-data, wind-breathing-service, breath-passives).
 *
 *  - Classification: a "Form" whose name starts with "Passiva" (or whose action is "Passiva") is always active:
 *    never "Usar", never spends PDR or an action.
 *  - Chamas · Esquentar (Fogo Fátuo): each Chamas technique adds heat to the weapon; tiers give hit and weapon
 *    damage bonuses, +1d6 on technique damage from 30, ×1.5 and 2 Concussão per turn on the user at 60.
 *  - Metal · Martelo do Julgamento: a standard critical hit allows an extra standard attack in the same action,
 *    half damage rounded up, ignoring resistances.
 *  - Vento · Sangue Especial: Cortante/Perfurante and Sangramento/Infecção taken in the battle become scars
 *    (+1 CAR tests per 30, max +4) and +1 VIT tests per 25 (max +4) at the long rest.
 *  - Neve · Congelar: each hit of the 1st Form gives 1 stack; with 5, an Ação Única restrains the target.
 *  - Pedra · Quebra lives in weapons.mjs (crit threshold).
 */

/** Always-on passive entries of the Forms catalog. */
export function isPassiveForm(form) {
  return /^Passiva\b/i.test(String(form?.name ?? "")) || form?.action?.label === "Passiva";
}

/* ---------------------------------------------------------------- Chamas ---------------------------------------------------------------- */

/** Weapon heat (Fogo Fátuo) and enemy heat (Brasas) of each Chamas technique (legacy FLAME_FORMS). */
export const FLAME_HEAT = Object.freeze({
  chamas_02: { weapon: 2, enemy: 0 },
  chamas_03: { weapon: 3, enemy: 2 },
  chamas_04: { weapon: 2, enemy: 0 },
  chamas_05: { weapon: 3, enemy: 3 },
  chamas_06: { weapon: 4, enemy: 4 },
  chamas_09: { weapon: 4, enemy: 4 },
});

export const FLAME_MAX_HEAT = 60;

/** Fogo Fátuo tier of a weapon heat (legacy flameWeaponTier; the next tier replaces the previous). */
export function flameTier(rawHeat) {
  const heat = Math.max(0, Math.min(FLAME_MAX_HEAT, Math.trunc(Number(rawHeat) || 0)));
  const t = (hit, weaponDamage, techniqueDie = "", multiplier = 1, selfDamage = 0) => ({ heat, hit, weaponDamage, techniqueDie, multiplier, selfDamage });
  if (heat >= 60) return t(3, 3, "1d6", 1.5, 2);
  if (heat >= 50) return t(3, 3, "1d6");
  if (heat >= 40) return t(2, 3, "1d6");
  if (heat >= 30) return t(2, 2, "1d6");
  if (heat >= 20) return t(2, 2);
  if (heat >= 10) return t(1, 2);
  if (heat >= 5) return t(1, 1);
  return t(0, 0);
}

/** Heat after a Chamas technique (capped at 60). */
export const addFlameHeat = (heat, formId) => Math.min(FLAME_MAX_HEAT, (Number(heat) || 0) + (FLAME_HEAT[formId]?.weapon ?? 0));

/** ×1.5 of the 60-heat tier, "after all calculations": rounded down like the other halves of the system. */
export const flameMultiplied = (formula, tier) => (tier.multiplier > 1 ? `floor((${formula}) * ${tier.multiplier})` : formula);

/* ---------------------------------------------------------------- Metal ---------------------------------------------------------------- */

/** Martelo do Julgamento damage: half, rounded up. */
export const hammerFormula = (formula) => `ceil((${formula}) / 2)`;

/* ---------------------------------------------------------------- Vento ---------------------------------------------------------------- */

const CUT = new Set(["cortante", "perfurante"]);
const BLEED = new Set(["sangramento", "infeccao", "infecção"]);

/** Damage taken split by Sangue Especial track: the whole hit counts when it carries one of the types. */
export function windDamageSplit(amount, types) {
  const list = (types ?? []).map((t) => String(t).toLowerCase());
  const n = Math.max(0, Math.trunc(Number(amount) || 0));
  return { cut: list.some((t) => CUT.has(t)) ? n : 0, bleed: list.some((t) => BLEED.has(t)) ? n : 0 };
}

/** Long rest: battle damage becomes scars (+1 CAR per 30) and VIT (+1 per 25), each capped at +4; counters reset. */
export function windConsolidate({ cut = 0, bleed = 0, scars = 0, vit = 0 } = {}) {
  return {
    scars: Math.min(4, (Number(scars) || 0) + Math.floor((Number(cut) || 0) / 30)),
    vit: Math.min(4, (Number(vit) || 0) + Math.floor((Number(bleed) || 0) / 25)),
    cut: 0,
    bleed: 0,
  };
}

/* ---------------------------------------------------------------- Neve ---------------------------------------------------------------- */

export const FREEZE_STACKS = 5;
export const FREEZE_FORM = "neve_01";
export const addFreeze = (stacks) => Math.min(FREEZE_STACKS, (Number(stacks) || 0) + 1);
