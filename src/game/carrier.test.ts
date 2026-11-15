import { describe, expect, test } from 'vitest';
import { Carrier } from './carrier';

const DT = 1 / 60;
const path = [
  { x: 0, y: 0 },
  { x: 10, y: 0 },
  { x: 10, y: 30 },
];

describe('carrier', () => {
  test('carries the squid along the path to its end', () => {
    const c = new Carrier(path, { speed: 9, ease: 1 });
    c.board();
    let ev = null;
    let t = 0;
    for (; t < 30 && !ev; t += DT) ev = c.update(DT, false);
    expect(ev).toBe('arrive');
    expect(c.riding).toBe(false);
    expect(c.seat).toEqual({ x: 10, y: 30 });
    // 40 units at up to 9 per second, with easing at both ends.
    expect(t).toBeGreaterThan(40 / 9);
    expect(t).toBeLessThan(40 / 9 + 4);
  });

  test('the seat follows the path, never cutting the corner', () => {
    const c = new Carrier(path, { speed: 9, ease: 1 });
    c.board();
    for (let t = 0; t < 30 && c.riding; t += DT) {
      c.update(DT, false);
      const p = c.seat;
      expect(p.y < 1e-6 || Math.abs(p.x - 10) < 1e-6).toBe(true);
    }
  });

  test('steering hops off, but only after letting go of the touch that boarded', () => {
    const c = new Carrier(path, { speed: 9, ease: 1 });
    c.board();
    // Still holding the finger that touched the arm: keeps riding.
    for (let t = 0; t < 1; t += DT) expect(c.update(DT, true)).toBeNull();
    expect(c.riding).toBe(true);
    c.update(DT, false);
    expect(c.update(DT, true)).toBe('hop');
    expect(c.riding).toBe(false);
  });

  test('pointAt clamps to both ends', () => {
    const c = new Carrier(path, { speed: 9, ease: 1 });
    expect(c.length).toBe(40);
    expect(c.pointAt(-5)).toEqual({ x: 0, y: 0 });
    expect(c.pointAt(15)).toEqual({ x: 10, y: 5 });
    expect(c.pointAt(99)).toEqual({ x: 10, y: 30 });
  });
});
