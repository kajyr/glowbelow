import { makeRng } from '../game/rng';
import type { Rect } from '../game/sparkleField';
import type { Vec2 } from '../game/vec';
import { Fields } from './clearance';
import { boundOf, rectDistance, ROCK_GAP, type Bound, type KeepOut } from './generate';
import { deriveSeed, MAX_ATTEMPTS } from './generateValid';
import { buildLevel, onSkeleton, skeletonPiece, type Level, type SkeletonPlacement } from './level';
import { placedCircles, type Placement } from './pieces';
import { placeRingChain } from './rings';
import { keepOutHits, pocketCells, unreachable } from './rules';
import { EXTENT, GIANT, GIANT_ROOM, RIB_COUNT, ribTarget } from './skeleton';
import { placeStarfish } from './starfish';
import { findPath, resample, simplify, TRAIL_SPACING, wave } from './trails';
import { ROCK_PIECES, SEABED_PIECES } from './zoneRecipe';

/**
 * What Whale fall always contains. A side room left of Midnight home, at
 * its seabed level: the swimmable part spans x 0…width, then a rock wall
 * `wall` thick, open at the bottom (the passage into home, below
 * `passageTop`). Shorter than home.
 */
export interface WhaleFallRecipe {
  name: 'whale-fall';
  width: number;
  wall: number;
  /** The rock ceiling. */
  height: number;
  passageTop: number;
  screen: { w: number; h: number };
  /** Up to this many rocks on the seabed, where the skeleton leaves room. */
  seabedRocks: number;
  floatingRocks: number;
  floatingBands: [number, number][];
  hangingRocks: number;
  decorRocks: number;
  fishSchools: number;
  ventCount: number;
}

/** About 4 screens wide and 3 tall; width plus wall is six seabed segments. */
export const WHALE_FALL: WhaleFallRecipe = {
  name: 'whale-fall',
  width: 68,
  wall: 4,
  height: 33,
  passageTop: 11,
  screen: { w: 16, h: 11 },
  seabedRocks: 2,
  floatingRocks: 6,
  floatingBands: [
    [14, 19],
    [23, 28],
  ],
  hangingRocks: 3,
  decorRocks: 16,
  fishSchools: 6,
  ventCount: 4,
};

const q = (v: number): number => Math.round(v * 20) / 20;

export interface WhaleFallLayout {
  seed: number;
  recipe: WhaleFallRecipe;
  level: Level;
  skeleton: SkeletonPlacement;
  keepOuts: KeepOut[];
}

/** A rectangle in the skeleton's units, where it lies in the level. */
function skeletonRect(s: SkeletonPlacement, r: Rect): Rect {
  const a = onSkeleton(s, { x: r.minX, y: r.minY });
  const b = onSkeleton(s, { x: r.maxX, y: r.maxY });
  return { minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x), minY: a.y, maxY: b.y };
}

/** The giant squid's spots and the ribs' pulse targets, in the level. */
export function whaleFallSpots(s: SkeletonPlacement) {
  return {
    sleep: onSkeleton(s, GIANT.sleep),
    hover: onSkeleton(s, GIANT.hover),
    arm: onSkeleton(s, GIANT.arm),
    /** Tail to head. */
    ribs: Array.from({ length: RIB_COUNT }, (_v, i) => {
      const t = ribTarget(i);
      return { ...onSkeleton(s, t), r: t.r };
    }),
  };
}

/**
 * Lays out Whale fall in its own coordinates: seabed, the skeleton along it
 * (head toward home or away), rocks kept clear of the skeleton and of the
 * room above the skull, fish schools, decoration. Null when a step finds no room.
 */
export function generateWhaleFallLayout(recipe: WhaleFallRecipe, seed: number, why: { step?: string } = {}): WhaleFallLayout | null {
  const rng = makeRng(seed);
  const rand = (a: number, b: number) => a + (b - a) * rng();
  const pick = <T>(list: T[]): T => list[Math.floor(rng() * list.length)];
  const W = recipe.width;
  const H = recipe.height;
  const outer = W + recipe.wall;

  // ---- seabed and the closed top, over the swimmable part and the wall
  const seabed: Placement[] = [];
  let prev = '';
  for (let cx = 6; cx < outer; cx += 12) {
    let piece = pick(SEABED_PIECES);
    while (piece === prev) piece = pick(SEABED_PIECES);
    prev = piece;
    seabed.push({ piece, x: cx, y: 0, mirror: rng() < 0.5 });
  }
  const ceiling: Placement[] = [];
  for (let cx = 6; cx < outer; cx += 12) ceiling.push({ piece: pick(SEABED_PIECES), x: cx, y: H + 1.4, rot: Math.PI, mirror: rng() < 0.5 });

  // ---- the skeleton: its colliders clear of both walls and of the passage
  const entry: Rect = { minX: W - 7, maxX: W, minY: -1, maxY: recipe.passageTop + 1 };
  const mirror = rng() < 0.5;
  // Collider extent left and right of its origin (the flat fluke has none, but must stay in view).
  const left = mirror ? EXTENT.maxX : 17.6;
  const right = mirror ? 17.6 : EXTENT.maxX;
  const fluke = -EXTENT.minX;
  const lo = Math.max(ROCK_GAP + left, mirror ? 1 : 1 + fluke);
  const hi = Math.min(entry.minX - 1 - right, mirror ? W - 1 - fluke : W);
  if (hi < lo) return (why.step = 'skeleton'), null;
  const skeleton: SkeletonPlacement = { x: q(rand(lo, hi)), y: 0, mirror };
  const bones: Bound[] = placedCircles(skeletonPiece(skeleton));

  const keepOuts: KeepOut[] = [
    { name: 'entry', rect: entry },
    { name: 'giant-room', rect: skeletonRect(skeleton, GIANT_ROOM) },
  ];
  const start: Vec2 = { x: W - 3, y: 5 };

  const solids: Bound[] = [];
  const fits = (b: Bound): boolean => {
    if (b.x - b.r < ROCK_GAP || b.x + b.r > W - ROCK_GAP) return false;
    if (b.y + b.r > H - 1.5 && b.y < H) return false;
    for (const k of keepOuts) if (rectDistance(b.x, b.y, k.rect) < b.r + 1) return false;
    for (const o of [...solids, ...bones]) if (Math.hypot(b.x - o.x, b.y - o.y) < b.r + o.r + ROCK_GAP) return false;
    return true;
  };
  const place = (tries: number, make: () => Placement): Placement | null => {
    for (let t = 0; t < tries; t++) {
      const p = make();
      const b = boundOf(placedCircles(p));
      if (fits(b)) {
        solids.push(b);
        return p;
      }
    }
    return null;
  };

  // ---- rocks: a few on the seabed where there is room, floating ones above the skeleton, hanging ones
  const rocks: Placement[] = [];
  for (let i = 0; i < recipe.seabedRocks; i++) {
    const p = place(40, () => ({ piece: pick(ROCK_PIECES), x: q(rand(4, W - 4)), y: 0.2, scale: q(rand(0.85, 1.2)), mirror: rng() < 0.5 }));
    if (p) rocks.push(p); // the skeleton fills most of the seabed: fewer is fine
  }
  for (let i = 0; i < recipe.floatingRocks; i++) {
    // Spread across the width (a column each, with some slack), in whichever band has room.
    const colW = (W - 8) / recipe.floatingRocks;
    const p = place(80, () => ({
      piece: pick(ROCK_PIECES),
      x: q(4 + rand(i - 0.4, i + 1.4) * colW),
      y: q(((b) => rand(b[0], b[1]))(pick(recipe.floatingBands))),
      scale: q(rand(0.9, 1.3)),
      rot: q(rand(-0.2, 0.2)),
      mirror: rng() < 0.5,
    }));
    if (!p) return (why.step = `floating-${i}`), null;
    rocks.push(p);
  }
  for (let i = 0; i < recipe.hangingRocks; i++) {
    const p = place(30, () => ({ piece: pick(ROCK_PIECES), x: q(rand(6, W - 6)), y: H + 1.3, rot: Math.PI, scale: q(rand(0.9, 1.4)), mirror: rng() < 0.5 }));
    if (!p) return (why.step = 'hanging'), null;
    rocks.push(p);
  }

  // ---- fish schools: open water, spread out (decoration: fewer is fine when there is no room)
  const schools: Vec2[] = [];
  for (let i = 0; i < recipe.fishSchools; i++) {
    let found: Vec2 | null = null;
    for (let t = 0; t < 80 && !found; t++) {
      const p = { x: q(rand(6, W - 6)), y: q(rand(11, H - 5)) };
      if ([...solids, ...bones].some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r + 3)) continue;
      if (schools.some((s) => Math.hypot(s.x - p.x, s.y - p.y) < 10)) continue;
      found = p;
    }
    if (found) schools.push(found);
  }

  // ---- decoration: big rocks further back, rock columns along the wall between the zones
  const decor: Placement[] = [];
  for (let i = 0; i < recipe.decorRocks; i++) {
    const low = i < recipe.decorRocks * 0.6;
    decor.push({
      piece: pick(ROCK_PIECES),
      x: q(rand(-2, W + 2)),
      y: low ? 0.3 : q(rand(10, H - 4)),
      z: -q(rand(4, 7.5)),
      scale: q(rand(2, 3.4)),
      rot: low ? 0 : q(rand(-0.3, 0.3)),
      mirror: rng() < 0.5,
      decor: true,
    });
  }
  // Both faces of the wall above the passage (this side and home's), and the far wall on the left.
  for (const x of [W + 0.6, outer - 0.6]) {
    for (let y = recipe.passageTop + rand(0.5, 1.5); y < H + 8; y += rand(4, 6)) {
      decor.push({ piece: pick(ROCK_PIECES), x: q(x + rand(-0.3, 0.3)), y: q(y), z: -q(rand(1.6, 2.4)), scale: q(rand(1.8, 2.6)), rot: q(rand(-0.8, 0.8)), mirror: rng() < 0.5, decor: true });
    }
  }
  for (let y = rand(2, 4); y < H + 4; y += rand(4, 6)) {
    decor.push({ piece: pick(ROCK_PIECES), x: q(rand(-2.2, -0.6)), y: q(y), z: -q(rand(1.6, 2.4)), scale: q(rand(2, 3)), rot: q(rand(-0.8, 0.8)), mirror: rng() < 0.5, decor: true });
  }
  const vents: number[] = [];
  for (let i = 0; i < recipe.ventCount; i++) vents.push(q(((i + 0.2 + rng() * 0.6) * W) / recipe.ventCount));

  const level: Level = {
    name: recipe.name,
    bounds: { minX: 0, maxX: W, minY: -1, maxY: H },
    cameraBounds: { minX: 0, maxX: W, minY: -1.2, maxY: H },
    ceilings: [{ x0: -10, x1: outer + 10, y: H }],
    // No way up here: the giant squid's arm is the lift.
    shaft: { x0: 0, x1: 0, softFrom: Infinity },
    start,
    pieces: [...seabed, ...ceiling, ...rocks, ...decor],
    plants: [],
    trails: [],
    cave: null,
    bubbleVents: vents,
    jelly: null,
    skeleton,
    fishSchools: schools,
  };
  return { seed, recipe, level, skeleton, keepOuts };
}

/** Every rule a Whale fall layout must follow; empty when it is fine to play. */
export function checkWhaleFallRules(layout: WhaleFallLayout, f: Fields): string[] {
  const { level } = layout;
  const spots = whaleFallSpots(layout.skeleton);
  const bad: string[] = [];
  if (!f.wideReach[f.idx(f.ix(level.start.x), f.iy(level.start.y))]) bad.push('start-blocked');
  // A rib counts when a small glow from comfortable water can reach it.
  if (spots.ribs.some((r) => unreachable(f, [r], r.r + 2.5).length > 0)) bad.push('ribs-unreachable');
  if (unreachable(f, [spots.arm], 1).length > 0) bad.push('arm-unreachable');
  if (unreachable(f, [spots.hover], 3).length > 0) bad.push('giant-unreachable');
  const rockCircles = level.pieces.flatMap(placedCircles);
  for (const name of keepOutHits(rockCircles, layout.keepOuts)) bad.push(`keep-out-${name}`);
  if (pocketCells(f) > 0) bad.push('pockets');
  return bad;
}

export interface GeneratedWhaleFall {
  layout: WhaleFallLayout;
  fields: Fields;
  seed: number;
  attempts: number;
  rejected: { seed: number; why: string[] }[];
}

/**
 * A Whale fall that follows every rule, with a sparkle trail from the
 * passage to the giant squid's arm, a chain of bubble rings and five
 * starfish. Bad seeds are replaced like home's.
 */
export function generateValidWhaleFall(recipe: WhaleFallRecipe, seed: number, maxAttempts = MAX_ATTEMPTS): GeneratedWhaleFall {
  const rejected: GeneratedWhaleFall['rejected'] = [];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = deriveSeed(seed, attempt);
    const why: { step?: string } = {};
    const layout = generateWhaleFallLayout(recipe, s, why);
    if (!layout) {
      rejected.push({ seed: s, why: [`no-room-${why.step}`] });
      continue;
    }
    const lv = layout.level;
    const fields = new Fields(buildLevel(lv).world, lv.start);
    const spots = whaleFallSpots(layout.skeleton);
    const path = findPath(fields, lv.start, spots.arm);
    if (path && path.length > 1) lv.trails = [wave(fields, resample(simplify(fields, path), TRAIL_SPACING))];
    const chain = placeRingChain(fields, s, {
      count: 5,
      spacing: 3.2,
      angles: [0, Math.PI, 0.3, -0.3, Math.PI + 0.3, Math.PI - 0.3],
      avoid: [lv.start, spots.hover, spots.arm],
      avoidRadius: 5,
      within: { minX: 6, maxX: recipe.width - 6, minY: 12, maxY: recipe.height - 5 },
    });
    lv.rings = chain ? [chain] : [];
    const stars = placeStarfish(fields, s, 'whale-fall', {
      count: 5,
      avoid: [lv.start, spots.arm, ...(chain?.rings ?? [])],
      avoidRadius: 3,
      apart: 10,
      awayFromBounds: 2.5,
    });
    lv.starfish = stars ?? [];
    const bad = checkWhaleFallRules(layout, fields);
    if (lv.trails.length === 0) bad.push('no-trail');
    if (!chain) bad.push('no-ring-chain');
    if (!stars) bad.push('no-room-starfish');
    if (bad.length === 0) return { layout, fields, seed: s, attempts: attempt + 1, rejected };
    rejected.push({ seed: s, why: bad });
  }
  throw new Error(`no valid whale fall layout for seed ${seed} in ${maxAttempts} attempts: ${JSON.stringify(rejected.slice(0, 6).map((r) => r.why))}`);
}
