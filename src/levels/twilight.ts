import { makeRng } from '../game/rng';
import type { Vec2 } from '../game/vec';
import { Fields } from './clearance';
import { boundOf, rectDistance, ROCK_GAP, type Bound, type KeepOut } from './generate';
import { buildLevel, type Level } from './level';
import { placedCircles, type PieceName, type Placement } from './pieces';
import { keepOutHits, pocketCells, unreachable } from './rules';
import { findPath, resample, simplify, TRAIL_SPACING, wave } from './trails';
import { deriveSeed, MAX_ATTEMPTS } from './generateValid';
import { ROCK_PIECES } from './zoneRecipe';

/**
 * What Twilight always contains. Twilight is a tall open shaft above home:
 * entered from below through home's shaft, closed at the top (the way to the
 * Sunlit reef comes later).
 */
export interface TwilightRecipe {
  name: 'twilight';
  width: number;
  height: number;
  screen: { w: number; h: number };
  /** Width of the opening at the bottom (home's shaft) and at the top. */
  passageWidth: number;
  ledgesPerWall: number;
  floatingRocks: number;
  lanterns: number;
  fireflyGroups: number;
  decorRocks: number;
}

/** About 3 screens wide and 10 tall, sized like the generated home. */
export const TWILIGHT: TwilightRecipe = {
  name: 'twilight',
  width: 48,
  height: 110,
  screen: { w: 16, h: 11 },
  passageWidth: 7.2,
  ledgesPerWall: 9,
  floatingRocks: 5,
  lanterns: 30,
  fireflyGroups: 5,
  decorRocks: 18,
};

const LEDGES: PieceName[] = ['ledge-1', 'ledge-2', 'ledge-3'];
const q = (v: number): number => Math.round(v * 20) / 20;
const LANTERN_R = 0.6;

export interface TwilightLayout {
  seed: number;
  recipe: TwilightRecipe;
  level: Level;
  keepOuts: KeepOut[];
}

/**
 * Lays out Twilight in its own coordinates (x 0…width, y 0…height): ledges on
 * both walls, a few floating rocks, the nautilus' column, lanterns spread
 * over the whole height and the firefly groups. Null when a step finds no room.
 */
export function generateTwilightLayout(recipe: TwilightRecipe, seed: number, why: { step?: string } = {}): TwilightLayout | null {
  const rng = makeRng(seed);
  const rand = (a: number, b: number) => a + (b - a) * rng();
  const pick = <T>(list: T[]): T => list[Math.floor(rng() * list.length)];
  const W = recipe.width;
  const H = recipe.height;
  const mid = W / 2;
  const half = recipe.passageWidth / 2;
  const topY = H - 4;

  const start: Vec2 = { x: mid, y: 3 };
  const nautilusX = q(rand(W * 0.35, W * 0.65));
  const nautilus = { x: nautilusX, y0: 8, y1: H - 12 };
  const keepOuts: KeepOut[] = [
    { name: 'entry', rect: { minX: mid - half - 1, maxX: mid + half + 1, minY: 0, maxY: 8 } },
    { name: 'top-passage', rect: { minX: mid - half - 2, maxX: mid + half + 2, minY: H - 12, maxY: H } },
    { name: 'nautilus', rect: { minX: nautilusX - 2.4, maxX: nautilusX + 2.4, minY: nautilus.y0 - 1, maxY: nautilus.y1 + 2 } },
  ];

  const solids: Bound[] = [];
  const fits = (b: Bound, againstWall: boolean): boolean => {
    if (!againstWall && (b.x - b.r < ROCK_GAP || b.x + b.r > W - ROCK_GAP)) return false;
    if (b.y - b.r < 6 || b.y + b.r > topY - 2) return false;
    for (const k of keepOuts) if (rectDistance(b.x, b.y, k.rect) < b.r + 1) return false;
    for (const o of solids) if (Math.hypot(b.x - o.x, b.y - o.y) < b.r + o.r + ROCK_GAP) return false;
    return true;
  };
  const place = (tries: number, make: () => Placement, againstWall: boolean): Placement | null => {
    for (let t = 0; t < tries; t++) {
      const p = make();
      const b = boundOf(placedCircles(p));
      if (fits(b, againstWall)) {
        solids.push(b);
        return p;
      }
    }
    return null;
  };

  // Ledges: alternating walls, spread up the whole height.
  const ledges: Placement[] = [];
  const count = recipe.ledgesPerWall * 2;
  const band = (topY - 10) / count;
  for (let i = 0; i < count; i++) {
    const left = i % 2 === 0;
    const p = place(
      25,
      () => ({
        piece: pick(LEDGES),
        x: left ? -0.4 : W + 0.4,
        y: q(8 + (i + rand(0.1, 0.9)) * band),
        scale: q(rand(0.9, 1.3)),
        mirror: !left,
        rot: q(rand(-0.12, 0.12)),
      }),
      true,
    );
    if (p) ledges.push(p); // a ledge that does not fit is simply left out
  }
  if (ledges.length < count * 0.6) return (why.step = 'ledges'), null;

  const floating: Placement[] = [];
  for (let i = 0; i < recipe.floatingRocks; i++) {
    const p = place(40, () => ({ piece: pick(ROCK_PIECES), x: q(rand(6, W - 6)), y: q(rand(14, topY - 10)), scale: q(rand(0.8, 1.2)), rot: q(rand(-0.3, 0.3)), mirror: rng() < 0.5 }), false);
    if (!p) return (why.step = 'floating'), null;
    floating.push(p);
  }

  // Lanterns: one per height band, spread sideways, away from rock.
  const lanterns: Vec2[] = [];
  const lb = (topY - 12) / recipe.lanterns;
  for (let i = 0; i < recipe.lanterns; i++) {
    let best: Vec2 | null = null;
    let bestScore = -Infinity;
    for (let t = 0; t < 30; t++) {
      const p = { x: q(rand(3, W - 3)), y: q(8 + (i + rand(0.15, 0.85)) * lb) };
      if (solids.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r + LANTERN_R + ROCK_GAP)) continue;
      if (keepOuts.some((k) => rectDistance(p.x, p.y, k.rect) < LANTERN_R + 0.5)) continue;
      if (lanterns.some((l) => Math.hypot(l.x - p.x, l.y - p.y) < 2 * LANTERN_R + ROCK_GAP)) continue;
      const score = Math.min(10, ...lanterns.slice(-3).map((l) => Math.abs(l.x - p.x)));
      if (score > bestScore) {
        bestScore = score;
        best = p;
      }
    }
    if (!best) return (why.step = 'lanterns'), null;
    lanterns.push(best);
  }

  // Firefly groups: one per fifth of the height.
  const groups: Vec2[] = [];
  const gb = (topY - 14) / recipe.fireflyGroups;
  for (let i = 0; i < recipe.fireflyGroups; i++) {
    let found: Vec2 | null = null;
    for (let t = 0; t < 40 && !found; t++) {
      const p = { x: q(rand(6, W - 6)), y: q(10 + (i + rand(0.2, 0.8)) * gb) };
      if (solids.some((s) => Math.hypot(p.x - s.x, p.y - s.y) < s.r + 2.5)) continue;
      if (lanterns.some((l) => Math.hypot(l.x - p.x, l.y - p.y) < 2.5)) continue;
      if (Math.abs(p.x - nautilusX) < 3) continue;
      found = p;
    }
    if (!found) return (why.step = 'fireflies'), null;
    groups.push(found);
  }

  // The walls: a column of big rocks just behind the play plane along each
  // side (decoration; the solid wall is a block in the assembled world).
  const decor: Placement[] = [];
  for (const side of [-1, 1]) {
    for (let y = rand(0, 3); y < H + 4; y += rand(4, 6)) {
      decor.push({
        piece: pick(ROCK_PIECES),
        x: q(side < 0 ? rand(-2.2, -0.6) : rand(W + 0.6, W + 2.2)),
        y: q(y),
        z: -q(rand(1.6, 2.4)),
        scale: q(rand(2, 3)),
        rot: q(rand(-0.8, 0.8)),
        mirror: rng() < 0.5,
        decor: true,
      });
    }
  }
  // A few big rocks further back for depth.
  for (let i = 0; i < recipe.decorRocks; i++) {
    decor.push({
      piece: pick(ROCK_PIECES),
      x: q(i % 2 === 0 ? rand(-3, 6) : rand(W - 6, W + 3)),
      y: q(rand(0, H)),
      z: -q(rand(4, 7)),
      scale: q(rand(2.4, 3.8)),
      rot: q(rand(-0.6, 0.6)),
      mirror: rng() < 0.5,
      decor: true,
    });
  }
  // The closed top: upside-down seabed segments, like home's ceiling,
  // leaving the passage toward the reef open.
  const SEABED: PieceName[] = ['seabed-1', 'seabed-2', 'seabed-3'];
  for (let cx = mid - half - 6; cx > -8; cx -= 12) decor.push({ piece: pick(SEABED), x: q(cx), y: topY + 1.4, rot: Math.PI, mirror: rng() < 0.5 });
  for (let cx = mid + half + 6; cx < W + 8; cx += 12) decor.push({ piece: pick(SEABED), x: q(cx), y: topY + 1.4, rot: Math.PI, mirror: rng() < 0.5 });

  const level: Level = {
    name: recipe.name,
    bounds: { minX: 0, maxX: W, minY: 0, maxY: H },
    cameraBounds: { minX: 0, maxX: W, minY: 0, maxY: H },
    // Closed at the top, except the passage toward the reef.
    ceilings: [
      { x0: -10, x1: mid - half, y: topY },
      { x0: mid + half, x1: W + 10, y: topY },
    ],
    shaft: { x0: mid - half, x1: mid + half, softFrom: topY + 1.5 },
    start,
    pieces: [...ledges, ...floating, ...decor],
    plants: [],
    trails: [],
    cave: null,
    bubbleVents: [],
    jelly: null,
    lanterns,
    fireflyGroups: groups,
    nautilus,
  };
  return { seed, recipe, level, keepOuts };
}

/** Every rule a Twilight layout must follow; empty when it is fine to play. */
export function checkTwilightRules(layout: TwilightLayout, f: Fields): string[] {
  const { level, recipe } = layout;
  const bad: string[] = [];
  if (!f.wideReach[f.idx(f.ix(level.start.x), f.iy(level.start.y))]) bad.push('start-blocked');
  // Measured from the bell's edge: the bell itself is a soft obstacle.
  if (unreachable(f, level.lanterns ?? [], LANTERN_R + 1.8).length > 0) bad.push('lanterns-unreachable');
  if (unreachable(f, level.fireflyGroups ?? [], 1.8).length > 0) bad.push('fireflies-unreachable');
  if (unreachable(f, [{ x: recipe.width / 2, y: level.ceilings[0].y + 1 }], 0.8).length > 0) bad.push('top-unreachable');
  const rockCircles = level.pieces.flatMap(placedCircles);
  for (const name of keepOutHits(rockCircles, layout.keepOuts)) bad.push(`keep-out-${name}`);
  if (pocketCells(f) > 0) bad.push('pockets');
  if ((level.lanterns ?? []).length !== recipe.lanterns) bad.push('lantern-count');
  if ((level.fireflyGroups ?? []).length !== recipe.fireflyGroups) bad.push('firefly-count');
  return bad;
}

export interface GeneratedTwilight {
  layout: TwilightLayout;
  fields: Fields;
  seed: number;
  attempts: number;
  rejected: { seed: number; why: string[] }[];
}

/**
 * A Twilight that follows every rule, with a trail from the entry to the
 * nearest firefly group. Bad seeds are replaced like home's.
 */
export function generateValidTwilight(recipe: TwilightRecipe, seed: number, maxAttempts = MAX_ATTEMPTS): GeneratedTwilight {
  const rejected: GeneratedTwilight['rejected'] = [];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = deriveSeed(seed, attempt);
    const why: { step?: string } = {};
    const layout = generateTwilightLayout(recipe, s, why);
    if (!layout) {
      rejected.push({ seed: s, why: [`no-room-${why.step}`] });
      continue;
    }
    const fields = new Fields(buildLevel(layout.level).world, layout.level.start);
    const groups = layout.level.fireflyGroups ?? [];
    const first = groups.reduce((a, g) => (Math.hypot(g.x - layout.level.start.x, g.y - layout.level.start.y) < Math.hypot(a.x - layout.level.start.x, a.y - layout.level.start.y) ? g : a), groups[0]);
    const path = first ? findPath(fields, layout.level.start, first) : null;
    if (path && path.length > 1) layout.level.trails = [wave(fields, resample(simplify(fields, path), TRAIL_SPACING))];
    const bad = checkTwilightRules(layout, fields);
    if (bad.length === 0) return { layout, fields, seed: s, attempts: attempt + 1, rejected };
    rejected.push({ seed: s, why: bad });
  }
  throw new Error(`no valid twilight layout for seed ${seed} in ${maxAttempts} attempts`);
}
