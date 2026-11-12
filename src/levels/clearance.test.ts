import { describe, expect, test } from 'vitest';
import type { CollisionWorld } from '../game/collision';
import { Fields } from './clearance';

/** A flat room 40 wide and 20 tall with the given rocks. */
const room = (circles: { x: number; y: number; r: number }[]): CollisionWorld => ({
  circles,
  floor: { xs: [0, 40], ys: [0, 0] },
  bounds: { minX: 0, maxX: 40, minY: 0, maxY: 20 },
  ceilings: [],
});

/** Two big rocks forming a wall at x = 20 with a vertical gap of `gap` units. */
const wallWithGap = (gap: number) => {
  const bottomEdge = 8;
  const rocks = [];
  for (let y = -2; y <= bottomEdge; y += 1) rocks.push({ x: 20, y, r: 1.5 }); // up to 9.5 at the top
  for (let y = bottomEdge + 1.5 + gap + 1.5; y <= 24; y += 1) rocks.push({ x: 20, y, r: 1.5 });
  return rocks;
};

describe('clearance fields', () => {
  test('an open room is reachable everywhere away from the walls', () => {
    const f = new Fields(room([]), { x: 5, y: 10 });
    expect(f.wideReach[f.idx(f.ix(35), f.iy(10))]).toBe(1);
    expect(f.wideReach[f.idx(f.ix(0.5), f.iy(10))]).toBe(0); // too close to the wall
  });

  test('a 3.4-unit gap lets the wide field through', () => {
    const f = new Fields(room(wallWithGap(3.4)), { x: 5, y: 10 });
    expect(f.wideReach[f.idx(f.ix(35), f.iy(10))]).toBe(1);
  });

  test('a 2-unit gap blocks the wide field but not the narrow one', () => {
    const f = new Fields(room(wallWithGap(2)), { x: 5, y: 10 });
    expect(f.wideReach[f.idx(f.ix(35), f.iy(10))]).toBe(0);
    expect(f.narrowReach[f.idx(f.ix(35), f.iy(10))]).toBe(1);
  });

  test('a gap narrower than the squid blocks both', () => {
    const f = new Fields(room(wallWithGap(0.8)), { x: 5, y: 10 });
    expect(f.narrowReach[f.idx(f.ix(35), f.iy(10))]).toBe(0);
  });

  test('floor and ceiling take their share of the clearance', () => {
    const f = new Fields({ ...room([]), floor: { xs: [0, 40], ys: [3, 3] }, ceilings: [{ x0: 0, x1: 40, y: 15 }] }, { x: 5, y: 9 });
    expect(f.wide[f.idx(f.ix(20), f.iy(3.9))]).toBe(0); // 0.9 above the floor
    expect(f.wide[f.idx(f.ix(20), f.iy(5))]).toBe(1);
    expect(f.wide[f.idx(f.ix(20), f.iy(14.2))]).toBe(0);
  });

  test('distance to the reachable area', () => {
    const f = new Fields(room([]), { x: 5, y: 10 });
    expect(f.distanceToWideReach(20, 10, 2)).toBeLessThan(0.5);
    expect(f.distanceToWideReach(20, -5, 2)).toBe(Infinity);
  });
});
