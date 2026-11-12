import { describe, expect, test } from 'vitest';
import type { Fields } from './clearance';
import { generateValidZone } from './generateValid';
import { PLANT_REACH } from './rules';
import type { StarfishSpot } from './starfish';
import { generateValidTwilight, TWILIGHT } from './twilight';
import { MIDNIGHT_HOME } from './zoneRecipe';

/** Five per zone, each reachable by a glow, sitting against rock or seabed, spread out, clear of the start. */
function check(f: Fields, stars: StarfishSpot[], zone: string, start: { x: number; y: number }) {
  expect(stars).toHaveLength(5);
  for (const s of stars) {
    expect(s.zone).toBe(zone);
    expect(f.distanceToWideReach(s.x, s.y, PLANT_REACH)).toBeLessThan(Infinity);
    // Against something solid: some cell within a unit is not free for the squid.
    let touches = false;
    for (let dy = -2; dy <= 2 && !touches; dy++) for (let dx = -2; dx <= 2 && !touches; dx++) touches = f.narrow[f.idx(f.ix(s.x) + dx, f.iy(s.y) + dy)] !== 1;
    expect(touches).toBe(true);
    expect(Math.hypot(s.x - start.x, s.y - start.y)).toBeGreaterThanOrEqual(3);
    // Home's edges have no drawn rock: never stuck to them.
    if (zone === 'home') {
      expect(s.x).toBeGreaterThan(f.minX + 2.4);
      expect(s.x).toBeLessThan(f.minX + f.cols * 0.5 - 2.4);
    }
  }
  for (let i = 0; i < stars.length; i++) for (let j = i + 1; j < stars.length; j++) expect(Math.hypot(stars[i].x - stars[j].x, stars[i].y - stars[j].y)).toBeGreaterThanOrEqual(14);
}

describe('starfish placement', () => {
  test('Midnight home: five findable starfish on rocks and the seabed, over 500 seeds', () => {
    for (let i = 0; i < 500; i++) {
      const z = generateValidZone(MIDNIGHT_HOME, i * 104729 + 3);
      check(z.fields, z.layout.level.starfish ?? [], 'home', z.layout.level.start);
    }
  }, 120_000);

  test('Twilight: five findable starfish on ledges and walls, over 500 seeds', () => {
    for (let i = 0; i < 500; i++) {
      const z = generateValidTwilight(TWILIGHT, i * 7919 + 11);
      check(z.fields, z.layout.level.starfish ?? [], 'twilight', z.layout.level.start);
    }
  }, 120_000);
});

describe('starfish and plants', () => {
  test('no home starfish sits on a plant, over 200 seeds', async () => {
    const { buildLevel } = await import('./level');
    for (let i = 0; i < 200; i++) {
      const z = generateValidZone(MIDNIGHT_HOME, i * 104729 + 3);
      const plants = buildLevel(z.layout.level).plants;
      for (const s of z.layout.level.starfish ?? []) for (const p of plants) expect(Math.hypot(p.x - s.x, p.y - s.y)).toBeGreaterThanOrEqual(1.4);
    }
  }, 120_000);
});
