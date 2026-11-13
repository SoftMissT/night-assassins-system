/**
 * Per-level milestones of the Slayer (patente, Breathing level, class rank, events), pure.
 * Data ported from the legacy catalogs/slayer/progression.json by tools/port-legacy-catalogs.mjs.
 */
import PROGRESSION from "../catalogs/slayer-progression.json" with { type: "json" };

export const LEVELS = Object.freeze(PROGRESSION.levels);

/** Patente by level; level 0 = not created yet. */
export function patente(level) {
  return LEVELS[String(level)]?.patente ?? "Civil (não criado)";
}

/** Breathing level 1–4 by character level (0 before creation). */
export function breathingLevel(level) {
  return LEVELS[String(level)]?.breathingLevel ?? 0;
}

/** Events unlocked exactly at `level`. */
export function levelEvents(level) {
  return LEVELS[String(level)]?.events ?? [];
}

/** Class is shown/usable from level 4, or earlier only when a table exception set it. */
export function classVisible(level, classId) {
  return level >= 4 || Boolean(classId);
}
