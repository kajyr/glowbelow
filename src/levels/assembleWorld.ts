import type { Block } from '../game/collision';
import { makeRng } from '../game/rng';
import type { Vec2 } from '../game/vec';
import { Fields } from './clearance';
import { generateValidZone, type GeneratedZone } from './generateValid';
import { buildLevel, type Level } from './level';
import type { Placement } from './pieces';
import { findPath, resample, simplify } from './trails';
import { generateValidTwilight, TWILIGHT, type GeneratedTwilight } from './twilight';
import { generateValidWhaleFall, WHALE_FALL, whaleFallSpots, type GeneratedWhaleFall } from './whaleFall';
import { translateLevel, type WorldMap } from './world';
import { MIDNIGHT_HOME, ROCK_PIECES } from './zoneRecipe';

export interface GameWorld {
  seed: number;
  home: GeneratedZone;
  twilight: GeneratedTwilight;
  /** Where Twilight's own origin sits in the world. */
  twilightOffset: Vec2;
  whaleFall: GeneratedWhaleFall;
  /** Where Whale fall's own origin sits in the world. */
  whaleFallOffset: Vec2;
  /** Where a continued game starts in each zone. */
  entries: Record<string, Vec2>;
  /** The top of the world: where the giant squid's arm sets the squid down. */
  landing: Vec2;
  map: WorldMap;
  /** Everything in world coordinates, as one level for the game's systems. */
  level: Level;
}

/** Twilight's own seed, derived from the world seed so the zones vary independently. */
export const twilightSeed = (seed: number): number => (seed ^ 0x51a7e3d9) >>> 0;
/** Whale fall's own seed, likewise. */
export const whaleFallSeed = (seed: number): number => (seed ^ 0x2c9b6f15) >>> 0;

/** How far past the ends of the world the camera may look, so the rock walls there show. */
export const WALL_VIEW = 2.5;

/**
 * A column of rocks standing along home's right edge, the far end of the
 * world, so it is clear the water ends there (Whale fall builds its own at
 * the other end). Decoration only: the edge itself is the world's bounds,
 * with solid rock beyond. Its own random stream, so home's layout is unchanged.
 */
export function endWall(seed: number, x: number, bottom: number, top: number): Placement[] {
  const rng = makeRng((seed ^ 0x7e11a5d3) >>> 0);
  const rand = (a: number, b: number) => a + (b - a) * rng();
  const q = (v: number) => Math.round(v * 20) / 20;
  const out: Placement[] = [];
  for (let y = bottom + rand(0, 2); y < top + 3; y += rand(3.5, 5)) {
    out.push({
      piece: ROCK_PIECES[Math.floor(rng() * ROCK_PIECES.length)],
      x: q(x + rand(0.3, 1.4)),
      y: q(y),
      z: -q(rand(1.6, 2.4)),
      scale: q(rand(2, 3)),
      rot: q(rand(-0.8, 0.8)),
      mirror: rng() < 0.5,
      decor: true,
    });
  }
  return out;
}

/**
 * Generates the world for a seed: Midnight home at the origin, Twilight
 * directly above it, centred on home's shaft, which becomes the open passage
 * between them, and Whale fall to the left of home at its seabed level,
 * behind a rock wall with a wide passage at the bottom. The rock around
 * narrow Twilight, between home's ceiling and Twilight's floor, above Whale
 * fall and the wall is solid blocks, so the squid can swim sideways in
 * Twilight above home's ceiling and never sees empty water.
 */
export function generateWorld(seed: number): GameWorld {
  const home = generateValidZone(MIDNIGHT_HOME, seed);
  const twilight = generateValidTwilight(TWILIGHT, twilightSeed(seed));
  const h = home.layout.level;
  const shaftMid = (h.shaft.x0 + h.shaft.x1) / 2;
  const offset = { x: shaftMid - TWILIGHT.width / 2, y: MIDNIGHT_HOME.topY };
  const t = translateLevel(twilight.layout.level, offset);
  const tx0 = offset.x;
  const tx1 = offset.x + TWILIGHT.width;
  const top = offset.y + TWILIGHT.height;
  const ceilY = MIDNIGHT_HOME.ceilingY;
  const pad = 10;

  const whaleFall = generateValidWhaleFall(WHALE_FALL, whaleFallSeed(seed));
  const wfOffset = { x: h.bounds.minX - WHALE_FALL.width - WHALE_FALL.wall, y: 0 };
  const wf = translateLevel(whaleFall.layout.level, wfOffset);
  const wallX0 = h.bounds.minX - WHALE_FALL.wall;

  const blocks: Block[] = [
    // Beside Twilight, above home's ceiling.
    { minX: h.bounds.minX - pad, maxX: tx0, minY: ceilY, maxY: top + pad },
    { minX: tx1, maxX: h.bounds.maxX + pad, minY: ceilY, maxY: top + pad },
    // Between home's ceiling and Twilight's floor, either side of the shaft.
    { minX: tx0, maxX: h.shaft.x0, minY: ceilY, maxY: offset.y },
    { minX: h.shaft.x1, maxX: tx1, minY: ceilY, maxY: offset.y },
    // Twilight's closed top, either side of the passage toward the reef.
    ...t.ceilings.map((c): Block => ({ minX: Math.max(c.x0, tx0), maxX: Math.min(c.x1, tx1), minY: c.y, maxY: top + pad })),
    // The wall between Whale fall and home, above the passage; the rock above Whale fall.
    { minX: wallX0, maxX: h.bounds.minX, minY: WHALE_FALL.passageTop, maxY: ceilY + pad },
    { minX: wfOffset.x - pad, maxX: wallX0, minY: WHALE_FALL.height, maxY: top + pad },
    // Solid rock beyond both ends of the world.
    { minX: wfOffset.x - pad, maxX: wfOffset.x, minY: h.bounds.minY - pad, maxY: WHALE_FALL.height },
    { minX: h.bounds.maxX, maxX: h.bounds.maxX + pad, minY: h.bounds.minY - pad, maxY: ceilY },
  ];

  const map: WorldMap = {
    bounds: { minX: wfOffset.x, maxX: h.bounds.maxX, minY: h.bounds.minY, maxY: top },
    zones: [
      { name: 'home', rect: { minX: h.bounds.minX, maxX: h.bounds.maxX, minY: h.bounds.minY, maxY: ceilY }, offset: { x: 0, y: 0 } },
      { name: 'twilight', rect: { minX: tx0, maxX: tx1, minY: offset.y, maxY: top }, offset },
      { name: 'whale-fall', rect: { minX: wfOffset.x, maxX: wallX0, minY: h.bounds.minY, maxY: WHALE_FALL.height }, offset: wfOffset },
    ],
    passages: [
      { from: 'home', to: 'twilight', rect: { minX: h.shaft.x0, maxX: h.shaft.x1, minY: ceilY, maxY: offset.y } },
      { from: 'home', to: 'whale-fall', rect: { minX: wallX0, maxX: h.bounds.minX, minY: h.bounds.minY, maxY: WHALE_FALL.passageTop } },
    ],
    blocks,
  };

  const level: Level = {
    name: 'world',
    bounds: map.bounds,
    cameraBounds: { ...map.bounds, minX: map.bounds.minX - WALL_VIEW, maxX: map.bounds.maxX + WALL_VIEW, minY: h.cameraBounds.minY },
    // Ceilings are replaced by the blocks above.
    ceilings: [],
    // The only closed way now is Twilight's top, toward the reef.
    shaft: t.shaft,
    start: h.start,
    pieces: [...h.pieces, ...t.pieces, ...wf.pieces, ...endWall(seed, h.bounds.maxX, h.bounds.minY, ceilY)],
    plants: h.plants,
    trails: [...h.trails, ...t.trails, ...wf.trails],
    cave: h.cave,
    bubbleVents: [...h.bubbleVents, ...wf.bubbleVents],
    jelly: h.jelly,
    lanterns: t.lanterns,
    rings: [...(h.rings ?? []), ...(t.rings ?? []), ...(wf.rings ?? [])],
    starfish: [...(h.starfish ?? []), ...(t.starfish ?? []), ...(wf.starfish ?? [])],
    fireflyGroups: t.fireflyGroups,
    nautilus: t.nautilus,
    skeleton: wf.skeleton,
    fishSchools: wf.fishSchools,
    blocks,
  };
  const shaftPass = map.passages[0].rect;
  const entries = {
    home: h.start,
    twilight: { x: (shaftPass.minX + shaftPass.maxX) / 2, y: offset.y + 3 },
    'whale-fall': wf.start,
  };
  // Below Twilight's closed top, in the middle of the passage toward the reef.
  const landing = { x: (t.shaft.x0 + t.shaft.x1) / 2, y: t.ceilings[0].y - 6 };
  return { seed, home, twilight, twilightOffset: offset, whaleFall, whaleFallOffset: wfOffset, entries, landing, map, level };
}

/**
 * The way the giant squid carries the squid: from the tip of its offered
 * arm in Whale fall, through home and up to the top of the world, in open
 * water all the way (the squid's own size has room everywhere along it).
 * Built once, when first needed: it searches the whole world.
 */
export function ridePath(w: GameWorld): Vec2[] {
  const from = whaleFallSpots(w.level.skeleton!).arm;
  const fields = new Fields(buildLevel(w.level).world, from);
  const path = findPath(fields, from, w.landing);
  if (!path) throw new Error('no way up from the giant squid');
  return resample(simplify(fields, path), 1);
}
