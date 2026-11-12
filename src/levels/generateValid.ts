import { buildLevel } from './level';
import { Fields } from './clearance';
import { generateLayout, type Layout } from './generate';
import { checkRules } from './rules';
import { layTrails } from './trails';
import { JellyFreeArea, pickJellyStart } from './jellyArea';
import type { Vec2 } from '../game/vec';
import type { ZoneRecipe } from './zoneRecipe';

export const MAX_ATTEMPTS = 50;

/** The seed to try on a given attempt: the seed itself first, then well-mixed derived seeds. */
export function deriveSeed(seed: number, attempt: number): number {
  if (attempt === 0) return seed >>> 0;
  let h = (seed + Math.imul(attempt, 0x9e3779b9)) >>> 0;
  h = Math.imul(h ^ (h >>> 16), 0x85ebca6b) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
}

export interface GeneratedZone {
  layout: Layout;
  fields: Fields;
  /** The smoothed trail routes, for the debug overlay. */
  paths: Vec2[][];
  /** The seed that produced this layout (may differ from the one asked for). */
  seed: number;
  /** How many seeds were tried, 1 when the first one worked. */
  attempts: number;
  /** Why earlier seeds were rejected, for debugging. */
  rejected: { seed: number; why: string[] }[];
}

/**
 * Generates a zone that follows every rule. A layout that breaks a rule is
 * dropped and the next derived seed is tried, so the player never sees a
 * broken one. Throws only if all attempts fail (it should not happen).
 */
export function generateValidZone(recipe: ZoneRecipe, seed: number, maxAttempts = MAX_ATTEMPTS): GeneratedZone {
  const rejected: GeneratedZone['rejected'] = [];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = deriveSeed(seed, attempt);
    const why: { step?: string } = {};
    const layout = generateLayout(recipe, s, why);
    if (!layout) {
      rejected.push({ seed: s, why: [`no-room-${why.step}`] });
      continue;
    }
    const fields = new Fields(buildLevel(layout.level).world, layout.level.start);
    const { trails, paths } = layTrails(layout, fields);
    layout.level.trails = trails;
    if (recipe.phantomJelly) {
      const start = pickJellyStart(layout, new JellyFreeArea(layout, fields), s);
      layout.level.jelly = start ? { start } : null;
    }
    const bad = checkRules(layout, fields);
    if (bad.length === 0) return { layout, fields, paths, seed: s, attempts: attempt + 1, rejected };
    rejected.push({ seed: s, why: bad });
  }
  throw new Error(`no valid ${recipe.name} layout for seed ${seed} in ${maxAttempts} attempts`);
}
