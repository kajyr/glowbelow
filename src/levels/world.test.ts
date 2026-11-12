import { describe, expect, test } from 'vitest';
import { blockOverlap, collide, type CollisionWorld } from '../game/collision';
import { steer, type Body } from '../game/steering';
import { TUNING } from '../game/tuning';
import { generateValidZone } from './generateValid';
import { translateLevel, zoneAt, type WorldMap } from './world';
import { MIDNIGHT_HOME } from './zoneRecipe';

// Home below (0..128 × -1..44.5), Twilight above, centred on a shaft at x 60..67.
const map: WorldMap = {
  bounds: { minX: 0, maxX: 128, minY: -1, maxY: 155 },
  zones: [
    { name: 'home', rect: { minX: 0, maxX: 128, minY: -1, maxY: 40 }, offset: { x: 0, y: 0 } },
    { name: 'twilight', rect: { minX: 39.6, maxX: 87.6, minY: 44.5, maxY: 155 }, offset: { x: 39.6, y: 44.5 } },
  ],
  passages: [{ from: 'home', to: 'twilight', rect: { minX: 60, maxX: 67.2, minY: 40, maxY: 44.5 } }],
  blocks: [],
};

describe('world map', () => {
  test('finds the zone a point is in', () => {
    expect(zoneAt(map, { x: 10, y: 5 })).toBe('home');
    expect(zoneAt(map, { x: 60, y: 100 })).toBe('twilight');
    expect(zoneAt(map, { x: 63, y: 42 })).toBe('home'); // in the shaft, the passage up
    expect(zoneAt(map, { x: 10, y: 100 })).toBeNull(); // the rock beside Twilight
    expect(zoneAt(map, { x: 20, y: 42 })).toBeNull(); // inside home's ceiling
  });

  test('moving a level shifts everything in it', () => {
    const home = generateValidZone(MIDNIGHT_HOME, 5).layout.level;
    const moved = translateLevel(home, { x: 10, y: 50 });
    expect(moved.start).toEqual({ x: home.start.x + 10, y: home.start.y + 50 });
    expect(moved.pieces[3].x).toBeCloseTo(home.pieces[3].x + 10);
    expect(moved.trails[0][0].y).toBeCloseTo(home.trails[0][0].y + 50);
    expect(moved.bounds.maxY).toBeCloseTo(home.bounds.maxY + 50);
    expect(moved.cave!.eyes.x).toBeCloseTo(home.cave!.eyes.x + 10);
    expect(moved.shaft.softFrom).toBeCloseTo(home.shaft.softFrom + 50);
  });
});

describe('solid blocks', () => {
  test('overlap: from outside, and from inside through the nearest side', () => {
    const b = { minX: 0, maxX: 10, minY: 0, maxY: 4 };
    expect(blockOverlap(5, 4.3, 0.5, b)).toEqual({ nx: 0, ny: 1, depth: expect.closeTo(0.2) });
    expect(blockOverlap(5, 6, 0.5, b)).toBeNull();
    expect(blockOverlap(9.5, 2, 0.5, b)).toEqual({ nx: 1, ny: 0, depth: expect.closeTo(1) });
  });

  test('the squid slides along a block and can always leave it', () => {
    const world: CollisionWorld = {
      circles: [],
      floor: { xs: [], ys: [] },
      bounds: { minX: -50, maxX: 50, minY: -50, maxY: 50 },
      ceilings: [],
      blocks: [{ minX: -20, maxX: 20, minY: 5, maxY: 10 }],
    };
    const b: Body = { pos: { x: 0, y: 3 }, vel: { x: 0, y: 0 } };
    for (let t = 0; t < 3; t += 1 / 60) {
      steer(b, { kind: 'direction', x: 1, y: 1 }, 1 / 60);
      collide(b, TUNING.squid.radius, world, 1 / 60);
    }
    expect(b.pos.y).toBeLessThan(5 - TUNING.squid.radius + 0.1); // stayed under the block
    expect(b.pos.x).toBeGreaterThan(8); // slid along it
  });
});
