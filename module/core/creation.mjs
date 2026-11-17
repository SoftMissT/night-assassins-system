/**
 * Character creation procedure, pure (no Foundry globals).
 * Source: the combined creation SPEC, the local progression plan and legacy
 * scripts/dialogs/attribute-dialogs.mjs (standard pool, 7d4 with 3 attempts, Discord counter).
 */
import { ATTRIBUTE_IDS, GIFTS, ORIGINS } from './progression.mjs';
/** Method A (§1.2): each value used exactly once. */
export const STANDARD_POOL = Object.freeze([4, 3, 2, 2, 1, 1, 1]);
export const MAX_POOL_ATTEMPTS = 3;
export const CREATION_CATALOG_VERSION = 2;
export const GIFT_CHOICE_FACE = 98;
export const GIFT_CHOICE_IDS = Object.freeze(['vanilla_marechi', 'vanilla_transformacao_demoniaca']);

/** 1d100 result → Gift id. Face 98 requires a separate choice. */
export function giftFromD100(n) {
    const v = Number(n);
    if (!Number.isInteger(v)) return null;
    return Object.entries(GIFTS).find(([, gift]) => {
        const [min, max = min] = gift.roll ?? [];
        return v >= min && v <= max;
    })?.[0] ?? null;
}
/** How many d100 to roll for the Gift (§4.1): 3 for Descendente Perdido or "sangue antigo", else 2. Keep the highest. */
export function giftRollCount(originId, ancientBlood = false) {
    return originId === 'origem_descendente_perdido' || ancientBlood ? 3 : 2;
}
/** 1d22 result → Origin id. The authorial entries retain faces 1–12. */
export function originFromD22(n) {
    const v = Number(n);
    if (!Number.isInteger(v)) return null;
    return Object.entries(ORIGINS).find(([, origin]) => {
        const [min, max = min] = origin.roll ?? [origin.d12];
        return v >= min && v <= max;
    })?.[0] ?? null;
}
/**
 * Method B (§1.2): which choices exist after attempt N of 7d4.
 * After 1st: use it or reroll. After 2nd: use 1st, use 2nd or reroll. 3rd: mandatory, no going back.
 */
export function poolAttemptOptions(attempt) {
    if (attempt >= MAX_POOL_ATTEMPTS)
        return {
            canReroll: false,
            usable: [attempt],
        };
    if (attempt === 2)
        return {
            canReroll: true,
            usable: [1, 2],
        };
    return {
        canReroll: true,
        usable: [1],
    };
}
/** Method C (§1.2): parse Discord values; exactly seven integers ≥ 1. Counter text mirrors the legacy dialog. */
export function parseDiscordPool(raw = '') {
    const tokens = String(raw)
        .split(/[;,\s]+/)
        .filter(Boolean);
    const values = tokens.map(Number);
    const invalid = values.some((v) => !Number.isInteger(v) || v < 1);
    const count = tokens.length;
    let text;
    if (count === 7) text = '7 de 7 pronto';
    else if (count < 7)
        text = `${7 - count} ${7 - count === 1 ? 'valor restante' : 'valores restantes'}`;
    else text = `${count - 7} ${count - 7 === 1 ? 'valor excedente' : 'valores excedentes'}`;
    if (invalid) text = 'Só números inteiros maiores ou iguais a 1';
    return {
        values: invalid ? [] : values,
        count,
        ok: count === 7 && !invalid,
        text,
    };
}
/** True when `assigned` (attr → value) uses every pool value exactly once (multiset equality). */
export function poolMatches(pool, assigned) {
    const used = ATTRIBUTE_IDS.map((id) => Number(assigned?.[id]));
    if (used.some((v) => !Number.isFinite(v))) return false;
    const a = [...pool].map(Number).sort((x, y) => x - y);
    const b = used.sort((x, y) => x - y);
    return a.length === b.length && a.every((v, i) => v === b[i]);
}
/**
 * Assignment by pool slot: `slots` maps attr → index in `pool`. Valid when the 7 indices are distinct.
 * Returns { ok, values, missing, duplicated }.
 */
export function assignPool(pool, slots) {
    const values = {};
    const seen = new Set();
    const missing = [];
    const duplicated = [];
    for (const id of ATTRIBUTE_IDS) {
        const raw = slots?.[id];
        const idx = raw === '' || raw === undefined || raw === null ? NaN : Number(raw);
        if (!Number.isInteger(idx) || idx < 0 || idx >= pool.length) {
            missing.push(id);
            continue;
        }
        if (seen.has(idx)) duplicated.push(id);
        seen.add(idx);
        values[id] = Number(pool[idx]);
    }
    const ok = !missing.length && !duplicated.length && pool.length === ATTRIBUTE_IDS.length;
    return {
        ok,
        values,
        missing,
        duplicated,
    };
}
/** Gift display label for a d100 result, e.g. "87 → Tsuyoi (O Inabalável)". */
export function giftLabel(n) {
    if (Number(n) === GIFT_CHOICE_FACE) return `${n} → escolha Marechi ou Transformação Demoníaca (vanilla)`;
    const id = giftFromD100(n);
    return id ? `${n} → ${GIFTS[id].name}` : String(n);
}
