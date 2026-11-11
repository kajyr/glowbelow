import { describe, expect, test } from 'vitest';
import { collide, floorAt, type CollisionWorld } from './collision';
import { steer, type Body } from './steering';
import { TUNING } from './tuning';

const DT = 1 / 60;
const R = TUNING.squid.radius;

const world = (): CollisionWorld => ({
  circles: [
    { x: 4, y: 3, r: 1 },
    { x: 5.2, y: 3.8, r: 1 }, // two rocks forming a notch with the left wall
  ],
  floor: { xs: [0, 10], ys: [1, 1] },
  bounds: { minX: 0, maxX: 10, minY: 0, maxY: 8 },
  ceilings: [{ x0: 0, x1: 4, y: 6 }],
});

function run(b: Body, w: CollisionWorld, dir: { x: number; y: number }, seconds: number) {
  for (let t = 0; t < seconds; t += DT) {
    steer(b, { kind: 'direction', ...dir }, DT);
    collide(b, R, w, DT);
  }
}

describe('collision', () => {
  test('interpolates the floor line', () => {
    expect(floorAt({ xs: [0, 2, 4], ys: [0, 2, 0] }, 1)).toBeCloseTo(1);
    expect(floorAt({ xs: [0, 2, 4], ys: [0, 2, 0] }, 9)).toBe(0);
  });

  test('the seabed eases the squid back up to just above it', () => {
    const b: Body = { pos: { x: 5, y: 1.2 }, vel: { x: 0, y: -2 } };
    for (let t = 0; t < 2; t += DT) {
      steer(b, { kind: 'none' }, DT);
      collide(b, R, world(), DT);
    }
    expect(b.pos.y).toBeGreaterThan(1 + R - 0.05);
    expect(b.pos.y).toBeLessThan(1 + R + 0.2);
  });

  test('a squid driven into each corner for 10 seconds can still leave it', () => {
    const corners = [
      { start: { x: 1, y: 2 }, into: { x: -1, y: -1 } }, // floor + left wall
      { start: { x: 2, y: 5 }, into: { x: -1, y: 1 } }, // ceiling + left wall
      { start: { x: 9, y: 2 }, into: { x: 1, y: -1 } }, // floor + right wall
      { start: { x: 3, y: 2 }, into: { x: 1, y: 1 } }, // into the rock notch
    ];
    for (const c of corners) {
      const b: Body = { pos: { ...c.start }, vel: { x: 0, y: 0 } };
      run(b, world(), c.into, 10);
      const stuckAt = { ...b.pos };
      run(b, world(), { x: -c.into.x, y: -c.into.y }, 1.5);
      const moved = Math.hypot(b.pos.x - stuckAt.x, b.pos.y - stuckAt.y);
      expect(moved).toBeGreaterThan(2);
    }
  });

  test('slides along a wall instead of stopping', () => {
    const b: Body = { pos: { x: 5, y: 1.6 }, vel: { x: 0, y: 0 } };
    run(b, world(), { x: 1, y: -1 }, 1);
    expect(b.pos.x).toBeGreaterThan(7);
  });

  test('reports a dead-centre overlap with an upward push', () => {
    const b: Body = { pos: { x: 4, y: 3 }, vel: { x: 0, y: 0 } };
    const c = collide(b, R, world(), DT);
    expect(c?.normal).toEqual({ x: 0, y: 1 });
  });
});
