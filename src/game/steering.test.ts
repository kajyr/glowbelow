import { describe, expect, test } from 'vitest';
import { steer, type Body } from './steering';
import { TUNING } from './tuning';

const DT = 1 / 60;
const body = (): Body => ({ pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 } });
const speed = (b: Body) => Math.hypot(b.vel.x, b.vel.y);

describe('steering', () => {
  test('diagonal top speed equals straight top speed', () => {
    const straight = body();
    const diagonal = body();
    for (let i = 0; i < 180; i++) {
      steer(straight, { kind: 'direction', x: 1, y: 0 }, DT);
      steer(diagonal, { kind: 'direction', x: 1, y: 1 }, DT);
    }
    expect(speed(straight)).toBeCloseTo(TUNING.squid.topSpeed, 2);
    expect(speed(diagonal)).toBeCloseTo(speed(straight), 5);
  });

  test('accelerates smoothly instead of jumping to top speed', () => {
    const b = body();
    steer(b, { kind: 'direction', x: 1, y: 0 }, DT);
    expect(speed(b)).toBeGreaterThan(0);
    expect(speed(b)).toBeLessThan(TUNING.squid.topSpeed * 0.2);
  });

  test('drifts to a stop within about a second, not instantly', () => {
    const b = body();
    for (let i = 0; i < 180; i++) steer(b, { kind: 'direction', x: 1, y: 0 }, DT);
    let t = 0;
    let after100ms = 0;
    while (speed(b) > 0 && t < 3) {
      steer(b, { kind: 'none' }, DT);
      t += DT;
      if (Math.abs(t - 0.1) < DT / 2) after100ms = speed(b);
    }
    expect(after100ms).toBeGreaterThan(TUNING.squid.topSpeed * 0.5); // glides
    expect(t).toBeGreaterThan(0.5);
    expect(t).toBeLessThan(1.1);
  });

  test('swims toward a held target and hovers there', () => {
    const b = body();
    for (let i = 0; i < 600; i++) steer(b, { kind: 'target', x: 4, y: 3 }, DT);
    expect(Math.hypot(b.pos.x - 4, b.pos.y - 3)).toBeLessThan(TUNING.squid.deadZone + 0.05);
    expect(speed(b)).toBeLessThan(0.05);
  });
});
