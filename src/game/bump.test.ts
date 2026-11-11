import { describe, expect, test } from 'vitest';
import { BumpState } from './bump';
import { collide, type CollisionWorld } from './collision';
import { steer, type Body } from './steering';
import { TUNING } from './tuning';

const DT = 1 / 60;
const rock: CollisionWorld = {
  circles: [{ x: 6, y: 5, r: 1 }],
  floor: { xs: [], ys: [] },
  bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
  ceilings: [],
};

/** Swims right into the rock; returns the time of the first bump, or null. */
function swimInto(startX: number, wantSpeed: number) {
  const b: Body = { pos: { x: startX, y: 5 }, vel: { x: wantSpeed, y: 0 } };
  const bump = new BumpState();
  for (let t = 0; t < 3; t += DT) {
    const input = bump.locked ? { kind: 'none' as const } : { kind: 'direction' as const, x: 1, y: 0 };
    if (wantSpeed < TUNING.squid.topSpeed) {
      // Drift slowly: no steering, keep the slow velocity.
      b.pos.x += b.vel.x * DT;
    } else steer(b, input, DT);
    if (bump.update(collide(b, TUNING.squid.radius, rock, DT), DT)) return { t, bump };
  }
  return null;
}

describe('bump', () => {
  test('a full-speed hit spins and returns control within 0.5 s', () => {
    const result = swimInto(0, TUNING.squid.topSpeed);
    expect(result).not.toBeNull();
    const bump = result!.bump;
    expect(bump.spin).toBeGreaterThan(0);
    let locked = 0;
    while (bump.locked) {
      bump.update(null, DT);
      locked += DT;
    }
    expect(locked).toBeLessThanOrEqual(0.5);
  });

  test('a slow drift into a rock only pushes', () => {
    expect(swimInto(3, TUNING.squid.topSpeed * 0.3)).toBeNull();
  });

  test('does not bump twice in a row while touching', () => {
    const bump = new BumpState();
    const hard = { normal: { x: -1, y: 0 }, impactSpeed: 10 };
    expect(bump.update(hard, DT)).toBe(true);
    expect(bump.update(hard, DT)).toBe(false);
  });
});
