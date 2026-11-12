import { describe, expect, test } from 'vitest';
import type { CollisionWorld } from '../game/collision';
import { Fields } from './clearance';
import { caveDistanceOk, keepOutHits, plantsInRocks, pocketCells, unreachable } from './rules';

const room = (circles: { x: number; y: number; r: number }[]): CollisionWorld => ({
  circles,
  floor: { xs: [0, 40], ys: [0, 0] },
  bounds: { minX: 0, maxX: 40, minY: 0, maxY: 20 },
  ceilings: [],
});
const wallWithGap = (gap: number) => {
  const rocks = [];
  for (let y = -2; y <= 8; y += 1) rocks.push({ x: 20, y, r: 1.5 });
  for (let y = 8 + 1.5 + gap + 1.5; y <= 24; y += 1) rocks.push({ x: 20, y, r: 1.5 });
  return rocks;
};
const start = { x: 5, y: 10 };

describe('rules', () => {
  test('a plant behind a squeeze is unreachable, behind a wide gap it is reachable', () => {
    const target = [{ x: 35, y: 10 }];
    expect(unreachable(new Fields(room(wallWithGap(3.4)), start), target, 1.8)).toEqual([]);
    expect(unreachable(new Fields(room(wallWithGap(2)), start), target, 1.8)).toEqual(target);
  });

  test('a sealed-off pocket behind a squeeze is reported, a wide gap is not', () => {
    expect(pocketCells(new Fields(room(wallWithGap(3.4)), start))).toBe(0);
    expect(pocketCells(new Fields(room(wallWithGap(2)), start))).toBeGreaterThan(0);
  });

  test('a rock in a keep-out area is reported', () => {
    const k = [{ name: 'cave-mouth', rect: { minX: 10, maxX: 14, minY: 0, maxY: 4 } }];
    expect(keepOutHits([{ x: 30, y: 5, r: 1 }], k)).toEqual([]);
    expect(keepOutHits([{ x: 12, y: 3, r: 1 }], k)).toEqual(['cave-mouth']);
  });

  test('a plant inside a rock is reported, one on its surface is not', () => {
    const rock = [{ x: 10, y: 3, r: 2 }];
    expect(plantsInRocks([{ x: 10, y: 3 }], rock)).toEqual([0]);
    expect(plantsInRocks([{ x: 10, y: 4.9 }], rock)).toEqual([]);
  });

  test('cave distance must be 2 to 4 screens', () => {
    expect(caveDistanceOk({ x: 0, y: 0 }, { x: 20, y: 0 }, 16)).toBe(false);
    expect(caveDistanceOk({ x: 0, y: 0 }, { x: 40, y: 0 }, 16)).toBe(true);
    expect(caveDistanceOk({ x: 0, y: 0 }, { x: 90, y: 0 }, 16)).toBe(false);
  });
});
