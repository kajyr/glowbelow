import { describe, expect, test } from 'vitest';
import { collide, type CollisionWorld } from './collision';
import { GlowMeter } from './glowMeter';
import { Jelly, type RoamArea } from './jelly';
import { steer, type Body } from './steering';
import { TUNING } from './tuning';

const DT = 1 / 60;
const R = TUNING.squid.radius;
/** A rectangle of free water. */
const box = (minX: number, maxX: number, minY: number, maxY: number): RoamArea => {
  const free = (x: number, y: number) => x >= minX && x <= maxX && y >= minY && y <= maxY;
  return {
    free,
    randomFree: (rng) => ({ x: minX + rng() * (maxX - minX), y: minY + rng() * (maxY - minY) }),
    // A rectangle is convex: a straight line always stays inside.
    path: (from, to) => (free(from.x, from.y) && free(to.x, to.y) ? [to] : null),
  };
};
const open = box(-1000, 1000, -1000, 1000);

describe('glow meter spill', () => {
  test('takes up to the spill amount, never more than there are', () => {
    const n = TUNING.jelly.spill;
    expect(n).toBe(5);
    const m = new GlowMeter();
    for (let i = 0; i < 10; i++) m.add();
    expect(m.spill(n)).toBe(5);
    expect(m.count).toBe(5);
    const low = new GlowMeter();
    low.add();
    low.add();
    expect(low.spill(n)).toBe(2);
    expect(low.count).toBe(0);
    expect(new GlowMeter().spill(n)).toBe(0);
  });

  test('a full meter is no longer full after a spill', () => {
    const m = new GlowMeter();
    for (let i = 0; i < 15; i++) m.add();
    m.spill(TUNING.jelly.spill);
    expect(m.full).toBe(false);
    expect(m.count).toBe(10);
  });
});

describe('phantom jelly', () => {
  test('roams slowly', () => {
    const j = new Jelly(open, { x: 0, y: 0 }, 3);
    for (let t = 0; t < 10; t += DT) j.update(DT);
    const d = Math.hypot(j.pos.x, j.pos.y);
    expect(d).toBeLessThanOrEqual(TUNING.jelly.speed * 10 + 0.01);
    expect(d).toBeGreaterThan(TUNING.jelly.speed * 10 * 0.5);
  });

  test('never leaves its area and keeps moving', () => {
    for (const seed of [1, 2, 3, 4, 5]) {
      const area = box(0, 20, 0, 12);
      const j = new Jelly(area, { x: 10, y: 6 }, seed);
      let travel = 0;
      let prev = { ...j.pos };
      for (let step = 1; step <= 600 * 20; step++) {
        j.update(1 / 20);
        expect(area.free(j.pos.x, j.pos.y)).toBe(true);
        travel += Math.hypot(j.pos.x - prev.x, j.pos.y - prev.y);
        prev = { ...j.pos };
        // Every 10 s it has drifted most of the way its speed allows.
        if (step % 200 === 0) {
          expect(travel).toBeGreaterThan(TUNING.jelly.speed * 10 * 0.8);
          travel = 0;
        }
      }
    }
  });

  test('the same seed wanders the same way', () => {
    const a = new Jelly(box(0, 30, 0, 20), { x: 10, y: 10 }, 7);
    const b = new Jelly(box(0, 30, 0, 20), { x: 10, y: 10 }, 7);
    for (let t = 0; t < 60; t += DT) {
      a.update(DT);
      b.update(DT);
    }
    expect(b.pos).toEqual(a.pos);
  });

  test('touching the bell is a touch, then nothing more during the grace period', () => {
    const j = new Jelly(open, { x: 10, y: 10 }, 1);
    const b = j.bell();
    const body: Body = { pos: { x: b.x + b.r + R - 0.2, y: b.y }, vel: { x: 0, y: 0 } };
    expect(j.touch(body, R, false, DT)).not.toBeNull();
    let touches = 0;
    for (let t = 0; t < 1; t += DT) {
      body.pos.x = b.x + b.r + R - 0.2;
      if (j.touch(body, R, false, DT)) touches++;
      j.update(0); // only the grace timer
    }
    expect(touches).toBe(0);
  });

  test('touching an arm is a touch, and the arms do not block', () => {
    const j = new Jelly(open, { x: 10, y: 10 }, 1);
    const arm = j.arms()[20]; // middle of the third arm
    const body: Body = { pos: { x: arm.x - 3, y: arm.y }, vel: { x: 0, y: 0 } };
    let touched = false;
    for (let t = 0; t < 3; t += DT) {
      steer(body, { kind: 'direction', x: 1, y: 0 }, DT);
      if (j.touch(body, R, false, DT)) touched = true;
    }
    expect(touched).toBe(true);
    expect(body.pos.x).toBeGreaterThan(arm.x + 3); // swam straight through
  });

  test('the bell pushes the squid out gently', () => {
    const j = new Jelly(open, { x: 10, y: 10 }, 1);
    const b = j.bell();
    const body: Body = { pos: { x: b.x + 0.8, y: b.y }, vel: { x: 0, y: 0 } };
    for (let t = 0; t < 1; t += DT) j.touch(body, R, false, DT);
    expect(Math.hypot(body.pos.x - b.x, body.pos.y - b.y)).toBeGreaterThan(b.r + R - 0.05);
  });

  test('a squid next to a rock is never squeezed and can always swim away', () => {
    // A rock just right of the squid, the jelly drifting toward it from the left.
    const world: CollisionWorld = {
      circles: [{ x: 22, y: 10.5, r: 1.5 }],
      floor: { xs: [], ys: [] },
      bounds: { minX: -50, maxX: 50, minY: -50, maxY: 50 },
      ceilings: [],
    };
    // The jelly can only drift back and forth along a line that passes the squid.
    const j = new Jelly(box(12, 30, 9.95, 10.05), { x: 14, y: 10 }, 2);
    const body: Body = { pos: { x: 22 - 1.5 - R + 0.05, y: 10.5 }, vel: { x: 0, y: 0 } };
    for (let t = 0; t < 40; t += DT) {
      j.update(DT);
      steer(body, { kind: 'none' }, DT);
      const contact = collide(body, R, world, DT);
      j.touch(body, R, contact !== null, DT);
      expect(Math.hypot(body.pos.x - 22, body.pos.y - 10.5)).toBeGreaterThan(1.5 + R - 0.3); // never pressed into the rock
    }
    // And it can swim away upward, out of everything.
    const start = { ...body.pos };
    for (let t = 0; t < 2; t += DT) {
      j.update(DT);
      steer(body, { kind: 'direction', x: 0, y: 1 }, DT);
      const contact = collide(body, R, world, DT);
      j.touch(body, R, contact !== null, DT);
    }
    expect(body.pos.y - start.y).toBeGreaterThan(4);
  });

  test('the squid bounces off the jelly on a touch', () => {
    const j = new Jelly(open, { x: 10, y: 10 }, 1);
    const b = j.bell();
    // Swimming right into the bell at full speed.
    const body: Body = { pos: { x: b.x - b.r - R - 0.3, y: b.y }, vel: { x: TUNING.squid.topSpeed, y: 0 } };
    let touchedAt = -1;
    let t = 0;
    for (; t < 1.5; t += DT) {
      // Swim in until the touch, then let the bounce play out.
      steer(body, touchedAt < 0 ? { kind: 'direction', x: 1, y: 0 } : { kind: 'none' }, DT);
      if (j.touch(body, R, false, DT) && touchedAt < 0) {
        touchedAt = t;
        expect(body.vel.x).toBeCloseTo(-TUNING.jelly.bounce, 5);
      }
    }
    expect(touchedAt).toBeGreaterThanOrEqual(0);
    // It ends up clearly away from the bell: about a squid width beyond touching.
    expect(b.x - body.pos.x).toBeGreaterThan(b.r + R + 0.9);
  });

  test('touching an arm bounces the squid away from that arm', () => {
    const j = new Jelly(open, { x: 10, y: 10 }, 1);
    const arm = j.arms()[25];
    const body: Body = { pos: { x: arm.x + arm.r + R - 0.1, y: arm.y }, vel: { x: -1, y: 0 } };
    expect(j.touch(body, R, false, DT)).not.toBeNull();
    expect(body.vel.x).toBeGreaterThan(0);
    expect(Math.hypot(body.vel.x, body.vel.y)).toBeCloseTo(TUNING.jelly.bounce, 5);
  });
});
