import { describe, expect, it } from 'vitest';
import { Follower, type FollowerTuning } from './follower';

const T: FollowerTuning = { speed: 3, catchUpSpeed: 9, catchUpDistance: 6 };
const run = (f: Follower, seconds: number, spot: { x: number; y: number }, leader = spot) => {
  for (let i = 0; i < seconds * 60; i++) f.follow(1 / 60, spot, leader, T);
};

describe('follower', () => {
  it('reaches the spot and settles there', () => {
    const f = new Follower({ x: 0, y: 0 });
    run(f, 4, { x: 2, y: 1 });
    expect(f.pos.x).toBeCloseTo(2, 1);
    expect(f.pos.y).toBeCloseTo(1, 1);
  });

  it('catches up faster when left far behind', () => {
    const near = new Follower({ x: 0, y: 0 });
    const far = new Follower({ x: 0, y: 0 });
    // Same spot, but the far one's leader is beyond the catch-up distance.
    for (let i = 0; i < 30; i++) {
      near.follow(1 / 60, { x: 20, y: 0 }, { x: 1, y: 0 }, T);
      far.follow(1 / 60, { x: 20, y: 0 }, { x: 20, y: 0 }, T);
    }
    expect(Math.abs(far.vel.x)).toBeGreaterThan(Math.abs(near.vel.x));
    expect(Math.abs(near.vel.x)).toBeLessThanOrEqual(T.speed + 1e-6);
  });

  it('keeps above the seabed', () => {
    const f = new Follower({ x: 0, y: 5 }, () => 2, 0.5);
    run(f, 3, { x: 0, y: -10 });
    expect(f.pos.y).toBeGreaterThanOrEqual(2.5 - 1e-9);
  });

  it('faces the way it swims', () => {
    const f = new Follower({ x: 0, y: 0 });
    run(f, 1, { x: -5, y: 0 });
    expect(f.facing).toBe(-1);
    run(f, 1, { x: 5, y: 0 });
    expect(f.facing).toBe(1);
  });
});
