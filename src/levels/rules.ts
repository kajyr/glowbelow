import type { Circle } from '../game/collision';
import type { Vec2 } from '../game/vec';
import { CELL, Fields, WIDE } from './clearance';
import { rectDistance, type KeepOut, type Layout } from './generate';
import { buildLevel, type PlantSpot } from './level';

/** A plant counts as reachable when the squid can get within this distance of its top. */
export const PLANT_REACH = 1.8;
/** Cave distance from the start, in screens. */
const CAVE_MIN_SCREENS = 2;
const CAVE_MAX_SCREENS = 4;

/** Points with no comfortably wide route to within `within` units. */
export function unreachable(f: Fields, points: Vec2[], within: number): Vec2[] {
  return points.filter((p) => f.distanceToWideReach(p.x, p.y, within) === Infinity);
}

/**
 * Cells the squid can squeeze into (narrow) that are farther than a wide
 * squid-room from any comfortably reachable cell: pockets it could enter but
 * would have trouble leaving. Samples every other cell.
 */
export function pocketCells(f: Fields): number {
  const r = Math.ceil((WIDE + CELL) / CELL);
  let count = 0;
  for (let iy = 0; iy < f.rows; iy += 2) {
    for (let ix = 0; ix < f.cols; ix += 2) {
      if (!f.narrowReach[f.idx(ix, iy)]) continue;
      let near = false;
      for (let dy = -r; dy <= r && !near; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const x = ix + dx;
          const y = iy + dy;
          if (x < 0 || y < 0 || x >= f.cols || y >= f.rows) continue;
          if (f.wideReach[f.idx(x, y)] && Math.hypot(dx, dy) * CELL <= WIDE + CELL) {
            near = true;
            break;
          }
        }
      }
      if (!near) count++;
    }
  }
  return count;
}

/** Names of keep-out areas that a collider reaches into. */
export function keepOutHits(circles: Circle[], keepOuts: KeepOut[]): string[] {
  return keepOuts.filter((k) => circles.some((c) => rectDistance(c.x, c.y, k.rect) < c.r - 1e-6)).map((k) => k.name);
}

/** Indices of plants whose base is buried deeper than 0.35 in a collider. */
export function plantsInRocks(plants: { x: number; y: number }[], circles: Circle[]): number[] {
  const out: number[] = [];
  plants.forEach((p, i) => {
    if (circles.some((c) => Math.hypot(p.x - c.x, p.y - c.y) < c.r - 0.35)) out.push(i);
  });
  return out;
}

/** Whether the cave is 2–4 screens from the start. */
export function caveDistanceOk(start: Vec2, cave: Vec2, screenWidth: number): boolean {
  const d = Math.hypot(cave.x - start.x, cave.y - start.y);
  return d >= CAVE_MIN_SCREENS * screenWidth && d <= CAVE_MAX_SCREENS * screenWidth + 2;
}

/** Reachable sample points (every `step` units) with no trail sparkle within `within` units. */
export function uncoveredByTrails(f: Fields, trails: Vec2[][], within: number, step = 4): Vec2[] {
  const sparkles = trails.flat();
  const out: Vec2[] = [];
  const stride = Math.round(step / CELL);
  for (let iy = 0; iy < f.rows; iy += stride) {
    for (let ix = 0; ix < f.cols; ix += stride) {
      if (!f.wideReach[f.idx(ix, iy)]) continue;
      const x = f.cx(ix);
      const y = f.cy(iy);
      if (!sparkles.some((p) => Math.hypot(p.x - x, p.y - y) <= within)) out.push({ x, y });
    }
  }
  return out;
}

/** Plant positions with their pulse point (a little above the base). */
const pulsePoints = (plants: PlantSpot[]): Vec2[] => plants.map((p) => ({ x: p.x, y: (p.y ?? 0) + 0.9 }));

/**
 * Every rule a generated layout must follow. Returns the names of the rules
 * it breaks; an empty list means the layout is fine to play.
 */
export function checkRules(layout: Layout, fields: Fields): string[] {
  const { level, recipe } = layout;
  const built = buildLevel(level);
  const bad: string[] = [];

  if (!fields.wideReach[fields.idx(fields.ix(level.start.x), fields.iy(level.start.y))]) bad.push('start-blocked');
  if (unreachable(fields, pulsePoints(level.plants), PLANT_REACH).length > 0) bad.push('plants-unreachable');
  if (unreachable(fields, [layout.cave.interior, layout.cave.outside], 0.8).length > 0) bad.push('cave-unreachable');
  const shaftTop = { x: (level.shaft.x0 + level.shaft.x1) / 2, y: level.ceilings[0].y + 1 };
  if (unreachable(fields, [shaftTop], 0.8).length > 0) bad.push('shaft-unreachable');
  for (const name of keepOutHits(built.world.circles, layout.keepOuts)) bad.push(`keep-out-${name}`);
  if (plantsInRocks(built.plants, built.world.circles).length > 0) bad.push('plant-in-rock');
  if (!caveDistanceOk(level.start, layout.cave.interior, recipe.screen.w)) bad.push('cave-distance');
  if (pocketCells(fields) > 0) bad.push('pockets');

  const first = level.trails[0];
  if (!first) bad.push('no-trails');
  else {
    const a = first[0];
    const b = first[first.length - 1];
    if (Math.hypot(a.x - level.start.x, a.y - level.start.y) > 4) bad.push('first-trail-start');
    if (Math.hypot(b.x - layout.cave.outside.x, b.y - layout.cave.outside.y) > 1.5) bad.push('first-trail-end');
    if (uncoveredByTrails(fields, level.trails, 2 * recipe.screen.w).length > 0) bad.push('trail-coverage');
  }
  return bad;
}
