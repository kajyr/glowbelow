import type { Block } from '../game/collision';
import { CORAL_COLOURS, type CoralColour } from '../game/colours';
import { makeRng } from '../game/rng';
import type { Vec2 } from '../game/vec';
import { Fields } from './clearance';
import { boundOf, type KeepOut } from './generate';
import { deriveSeed, MAX_ATTEMPTS } from './generateValid';
import { buildLevel, type CoralSpot, type Level } from './level';
import { CORAL_SHAPES, placedCircles, type CoralPiece, type Placement } from './pieces';
import { placeRingChain } from './rings';
import { keepOutHits, PLANT_REACH, pocketCells, unreachable } from './rules';
import { placeStarfish } from './starfish';
import { findPath, resample, simplify, TRAIL_SPACING, wave } from './trails';
import { ROCK_PIECES, SEABED_PIECES } from './zoneRecipe';

/**
 * What the Sunlit reef always contains. The bright zone at the top of the
 * world, above Twilight: a coral garden on its seabed, a shimmering surface
 * the squid cannot leave through, and a hole in the seabed (the one-way
 * passage down into Twilight) in the middle. The squid arrives only on the
 * giant squid's arm, at the landing spot.
 */
export interface ReefRecipe {
  name: 'sunlit-reef';
  width: number;
  height: number;
  screen: { w: number; h: number };
  /** Width of the hole down into Twilight (Twilight's top passage). */
  passageWidth: number;
  /** At least this many corals; the garden fills the seabed. */
  corals: number;
  /** Share of corals in the large size. */
  largeShare: number;
  decorRocks: number;
}

/** About 4 screens wide and 2 tall. */
export const SUNLIT_REEF: ReefRecipe = {
  name: 'sunlit-reef',
  width: 64,
  height: 22,
  screen: { w: 16, h: 11 },
  passageWidth: 7.2,
  corals: 16,
  largeShare: 0.35,
  decorRocks: 10,
};

/** Where the sunbeam may be: this far from the cuttlefish's hiding place and the landing spot, along the reef. */
export const SUNBEAM = { awayFromCuttlefish: 16, awayFromLanding: 6 };

/** How deep the hole goes below the reef's seabed, in the reef's own coordinates (Twilight's passage, when assembled). */
export const REEF_HOLE = 6;

const q = (v: number): number => Math.round(v * 20) / 20;

export interface ReefLayout {
  seed: number;
  recipe: ReefRecipe;
  level: Level;
  keepOuts: KeepOut[];
}

/** The top edge of a coral, where touching and glowing reach it. */
export function coralTop(c: Placement): Vec2 {
  const b = boundOf(placedCircles(c));
  return { x: b.x, y: b.y + b.r };
}

/**
 * Lays out the reef in its own coordinates (x 0…width, y 0…height; the
 * seabed is y = 0, solid rock below it except the hole in the middle):
 * the coral garden along the seabed with the cuttlefish's spot among it, a
 * clear landing spot up in the water, rocks behind. Neighbouring corals
 * never start in the same colour, so a coral flickering the wrong colour
 * stands out. Null when a step finds no room.
 */
export function generateReefLayout(recipe: ReefRecipe, seed: number, why: { step?: string } = {}): ReefLayout | null {
  const rng = makeRng(seed);
  const rand = (a: number, b: number) => a + (b - a) * rng();
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rng() * list.length)];
  const W = recipe.width;
  const H = recipe.height;
  const mid = W / 2;
  const half = recipe.passageWidth / 2;

  // The landing spot: high in the open water, off to one side of the hole.
  const side = rng() < 0.5 ? -1 : 1;
  const landing: Vec2 = { x: q(mid + side * rand(8, 14)), y: q(rand(H * 0.5, H * 0.62)) };
  const keepOuts: KeepOut[] = [
    { name: 'passage', rect: { minX: mid - half - 1.5, maxX: mid + half + 1.5, minY: -REEF_HOLE, maxY: 5 } },
    { name: 'landing', rect: { minX: landing.x - 3.5, maxX: landing.x + 3.5, minY: landing.y - 3.5, maxY: landing.y + 3.5 } },
  ];

  // ---- the cuttlefish's spot: on the seabed, well away from the hole and the ends
  const cfSide = rng() < 0.5 ? -1 : 1;
  const cuttlefish = { x: q(mid + cfSide * rand(10, W / 2 - 8)), y: 0, piece: `coral-${pick(CORAL_SHAPES)}-1` as CoralPiece };
  // A gap in the garden wide enough to swim down into comfortably.
  keepOuts.push({ name: 'cuttlefish', rect: { minX: cuttlefish.x - 1.6, maxX: cuttlefish.x + 1.6, minY: 0, maxY: 3 } });

  // ---- the sunbeam: the one gap in the surface where the journey ends, well
  // away from the cuttlefish (looking for it, the squid will not stumble in)
  // and from the landing spot. Its own random stream, so the garden is unchanged.
  const beamRng = makeRng((seed ^ 0x5b0a3e71) >>> 0);
  const spots: number[] = [];
  for (let x = 6; x <= W - 6; x += 0.5) if (Math.abs(x - cuttlefish.x) >= SUNBEAM.awayFromCuttlefish && Math.abs(x - landing.x) >= SUNBEAM.awayFromLanding) spots.push(x);
  const far = (x: number) => Math.abs(x - cuttlefish.x);
  const beamX = spots.length > 0 ? spots[Math.floor(beamRng() * spots.length)] : [6, W - 6].reduce((a, b) => (far(a) > far(b) ? a : b));
  const sunbeam: Vec2 = { x: q(beamX), y: H };

  // ---- the coral garden: along the seabed from wall to wall, either side of
  // the hole, packed edge to edge (corals are not solid: the squid brushes past)
  const corals: CoralSpot[] = [];
  const floorOuts = keepOuts.filter((k) => k.rect.minY <= 0).map((k) => k.rect).sort((a, b) => a.minX - b.minX);
  const blockedAt = (x0: number, x1: number) => floorOuts.find((r) => x1 > r.minX - 0.3 && x0 < r.maxX + 0.3);
  let edge = 0.1;
  let prev: CoralColour | null = null;
  let segmentStart = 0;
  while (edge < W - 0.9) {
    const large = rng() < recipe.largeShare;
    const piece = `coral-${pick(CORAL_SHAPES)}-${large ? 2 : 1}` as CoralPiece;
    const scale = q(rand(1.2, 1.45));
    const at0 = boundOf(placedCircles({ piece, x: 0, y: -0.05, scale }));
    const gap = rand(0, 0.4);
    const x0 = edge + gap;
    const x1 = x0 + 2 * at0.r;
    if (x1 > W - 0.1) {
      // Too big for the room left: try a small one, or stop.
      if (large) continue;
      break;
    }
    const block = blockedAt(x0, x1);
    if (block) {
      edge = block.maxX + 0.3;
      segmentStart = corals.length;
      continue;
    }
    const mirror = rng() < 0.5;
    const p: Placement = { piece, x: q(x0 + at0.r - (mirror ? -at0.x : at0.x)), y: -0.05, scale, mirror };
    let colour = pick(CORAL_COLOURS);
    while (colour === prev) colour = pick(CORAL_COLOURS);
    prev = colour;
    corals.push({ ...p, piece, colour });
    edge = x1;
  }
  // The room left at the right wall is shared out between the last corals' gaps.
  const left = W - 0.1 - edge;
  const last = corals.slice(segmentStart);
  if (left > 0 && last.length > 0) last.forEach((c, i) => (c.x = q(c.x + (left * (i + 1)) / last.length)));
  if (corals.length < recipe.corals) return (why.step = 'corals'), null;

  // ---- the seabed: decoration on the rock blocks, leaving the hole open
  const seabed: Placement[] = [];
  for (let cx = 6; cx < W + 6; cx += 12) {
    if (Math.abs(cx - mid) < half + 6) continue;
    seabed.push({ piece: pick(SEABED_PIECES), x: cx, y: 0, mirror: rng() < 0.5, decor: true });
  }
  // The hole's rim: a rock on either side, half sunk.
  const rim: Placement[] = [-1, 1].map((s) => ({ piece: pick(ROCK_PIECES), x: q(mid + s * (half + 1.6)), y: -0.6, z: -0.6, scale: q(rand(1, 1.3)), rot: q(rand(-0.2, 0.2)), mirror: s > 0, decor: true }));

  // ---- decoration: rocks behind the garden, and the reef's walls
  const decor: Placement[] = [];
  for (let i = 0; i < recipe.decorRocks; i++) {
    decor.push({ piece: pick(ROCK_PIECES), x: q(rand(0, W)), y: 0.2, z: -q(rand(5, 8)), scale: q(rand(1.2, 2)), mirror: rng() < 0.5, decor: true });
  }
  for (const [wx, s] of [[0, -1], [W, 1]] as const) {
    for (let y = rand(0, 2); y < H + 2; y += rand(4, 6)) {
      decor.push({ piece: pick(ROCK_PIECES), x: q(wx + s * rand(0.6, 2.2)), y: q(y), z: -q(rand(1.6, 2.4)), scale: q(rand(2, 3)), rot: q(rand(-0.8, 0.8)), mirror: rng() < 0.5, decor: true });
    }
  }

  // Solid rock under the seabed either side of the hole (in the assembled
  // world, the blocks above Twilight do this).
  const blocks: Block[] = [
    { minX: -10, maxX: mid - half, minY: -REEF_HOLE - 10, maxY: 0 },
    { minX: mid + half, maxX: W + 10, minY: -REEF_HOLE - 10, maxY: 0 },
  ];
  const level: Level = {
    name: recipe.name,
    bounds: { minX: 0, maxX: W, minY: -REEF_HOLE, maxY: H },
    cameraBounds: { minX: 0, maxX: W, minY: 0, maxY: H },
    ceilings: [],
    // The hole down into Twilight is open going down; Twilight's lid stops anyone coming up.
    shaft: { x0: 0, x1: 0, softFrom: Infinity },
    start: landing,
    pieces: [...seabed, ...rim, ...decor],
    plants: [],
    trails: [],
    cave: null,
    bubbleVents: [],
    jelly: null,
    blocks,
    corals,
    cuttlefish,
    landing,
    sunbeam,
  };
  return { seed, recipe, level, keepOuts };
}

/** Every rule a reef layout must follow; empty when it is fine to play. */
export function checkReefRules(layout: ReefLayout, f: Fields): string[] {
  const { level, recipe } = layout;
  const bad: string[] = [];
  if (!f.wideReach[f.idx(f.ix(level.start.x), f.iy(level.start.y))]) bad.push('landing-blocked');
  // A clear way down: the hole, from the landing spot.
  if (unreachable(f, [{ x: recipe.width / 2, y: -REEF_HOLE + 1.5 }], 0.8).length > 0) bad.push('passage-unreachable');
  // Every coral can be touched: comfortable water comes within a squid's reach of its top.
  if (unreachable(f, (level.corals ?? []).map(coralTop), PLANT_REACH).length > 0) bad.push('corals-unreachable');
  if (level.cuttlefish && unreachable(f, [{ x: level.cuttlefish.x, y: 1 }], 1.6).length > 0) bad.push('cuttlefish-unreachable');
  for (const name of keepOutHits(level.pieces.flatMap(placedCircles), layout.keepOuts)) bad.push(`keep-out-${name}`);
  if (pocketCells(f) > 0) bad.push('pockets');
  return bad;
}

export interface GeneratedReef {
  layout: ReefLayout;
  fields: Fields;
  seed: number;
  attempts: number;
  rejected: { seed: number; why: string[] }[];
}

/**
 * A reef that follows every rule, with a sparkle trail from the landing
 * spot to the cuttlefish, a chain of bubble rings and five starfish. Bad
 * seeds are replaced like the other zones'.
 */
export function generateValidReef(recipe: ReefRecipe, seed: number, maxAttempts = MAX_ATTEMPTS): GeneratedReef {
  const rejected: GeneratedReef['rejected'] = [];
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const s = deriveSeed(seed, attempt);
    const why: { step?: string } = {};
    const layout = generateReefLayout(recipe, s, why);
    if (!layout) {
      rejected.push({ seed: s, why: [`no-room-${why.step}`] });
      continue;
    }
    const lv = layout.level;
    const fields = new Fields(buildLevel(lv).world, lv.start);
    const cf = lv.cuttlefish!;
    const above = { x: cf.x, y: 2.6 };
    const path = findPath(fields, lv.start, above);
    if (path && path.length > 1) lv.trails = [wave(fields, resample(simplify(fields, path), TRAIL_SPACING))];
    const hole = { x: recipe.width / 2, y: 1 };
    // Down the sunbeam, so the way out stays clear.
    const beam = [3, 7].map((d) => ({ x: lv.sunbeam!.x, y: recipe.height - d }));
    const chain = placeRingChain(fields, s, {
      count: 5,
      spacing: 3.2,
      angles: [0, Math.PI, 0.3, -0.3, Math.PI + 0.3, Math.PI - 0.3],
      avoid: [lv.start, hole, above, ...beam],
      avoidRadius: 5,
      within: { minX: 6, maxX: recipe.width - 6, minY: 5, maxY: recipe.height - 4 },
    });
    lv.rings = chain ? [chain] : [];
    const stars = placeStarfish(fields, s, 'sunlit-reef', {
      count: 5,
      avoid: [lv.start, hole, above, ...(chain?.rings ?? [])],
      avoidRadius: 3,
      apart: 8,
      awayFromBounds: 1.5,
      minY: 0,
    });
    lv.starfish = stars ?? [];
    const bad = checkReefRules(layout, fields);
    if (lv.trails.length === 0) bad.push('no-trail');
    if (!chain) bad.push('no-ring-chain');
    if (!stars) bad.push('no-room-starfish');
    if (bad.length === 0) return { layout, fields, seed: s, attempts: attempt + 1, rejected };
    rejected.push({ seed: s, why: bad });
  }
  throw new Error(`no valid sunlit reef layout for seed ${seed} in ${maxAttempts} attempts: ${JSON.stringify(rejected.slice(0, 6).map((r) => r.why))}`);
}
