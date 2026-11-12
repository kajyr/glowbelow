import type { Block } from '../game/collision';
import type { Vec2 } from '../game/vec';
import { generateValidZone, type GeneratedZone } from './generateValid';
import type { Level } from './level';
import { generateValidTwilight, TWILIGHT, type GeneratedTwilight } from './twilight';
import { translateLevel, type WorldMap } from './world';
import { MIDNIGHT_HOME } from './zoneRecipe';

export interface GameWorld {
  seed: number;
  home: GeneratedZone;
  twilight: GeneratedTwilight;
  /** Where Twilight's own origin sits in the world. */
  twilightOffset: Vec2;
  map: WorldMap;
  /** Everything in world coordinates, as one level for the game's systems. */
  level: Level;
}

/** Twilight's own seed, derived from the world seed so the zones vary independently. */
export const twilightSeed = (seed: number): number => (seed ^ 0x51a7e3d9) >>> 0;

/**
 * Generates the world for a seed: Midnight home at the origin, Twilight
 * directly above it, centred on home's shaft, which becomes the open passage
 * between them. The rock around narrow Twilight and between home's ceiling
 * and Twilight's floor is solid blocks, so the squid can swim sideways in
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

  const blocks: Block[] = [
    // Beside Twilight, above home's ceiling.
    { minX: h.bounds.minX - pad, maxX: tx0, minY: ceilY, maxY: top + pad },
    { minX: tx1, maxX: h.bounds.maxX + pad, minY: ceilY, maxY: top + pad },
    // Between home's ceiling and Twilight's floor, either side of the shaft.
    { minX: tx0, maxX: h.shaft.x0, minY: ceilY, maxY: offset.y },
    { minX: h.shaft.x1, maxX: tx1, minY: ceilY, maxY: offset.y },
    // Twilight's closed top, either side of the passage toward the reef.
    ...t.ceilings.map((c): Block => ({ minX: Math.max(c.x0, tx0), maxX: Math.min(c.x1, tx1), minY: c.y, maxY: top + pad })),
  ];

  const map: WorldMap = {
    bounds: { minX: h.bounds.minX, maxX: h.bounds.maxX, minY: h.bounds.minY, maxY: top },
    zones: [
      { name: 'home', rect: { minX: h.bounds.minX, maxX: h.bounds.maxX, minY: h.bounds.minY, maxY: ceilY }, offset: { x: 0, y: 0 } },
      { name: 'twilight', rect: { minX: tx0, maxX: tx1, minY: offset.y, maxY: top }, offset },
    ],
    passages: [{ from: 'home', to: 'twilight', rect: { minX: h.shaft.x0, maxX: h.shaft.x1, minY: ceilY, maxY: offset.y } }],
    blocks,
  };

  const level: Level = {
    name: 'world',
    bounds: map.bounds,
    cameraBounds: { ...map.bounds, minY: h.cameraBounds.minY },
    // Ceilings are replaced by the blocks above.
    ceilings: [],
    // The only closed way now is Twilight's top, toward the reef.
    shaft: t.shaft,
    start: h.start,
    pieces: [...h.pieces, ...t.pieces],
    plants: h.plants,
    trails: [...h.trails, ...t.trails],
    cave: h.cave,
    bubbleVents: h.bubbleVents,
    jelly: h.jelly,
    lanterns: t.lanterns,
    rings: [...(h.rings ?? []), ...(t.rings ?? [])],
    starfish: [...(h.starfish ?? []), ...(t.starfish ?? [])],
    fireflyGroups: t.fireflyGroups,
    nautilus: t.nautilus,
    blocks,
  };
  return { seed, home, twilight, twilightOffset: offset, map, level };
}
