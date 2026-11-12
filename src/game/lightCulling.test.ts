import { describe, expect, test } from 'vitest';
import { makeRng } from './rng';
import { selectLights, type LightCandidate } from './lightCulling';

const view = (x: number) => ({ minX: x - 9, maxX: x + 9, minY: 0, maxY: 11 });

describe('light culling', () => {
  test('drops lights that cannot touch the view', () => {
    const lights: LightCandidate[] = [{ x: 0, y: 5, radius: 3 }, { x: 100, y: 5, radius: 3 }];
    expect(selectLights(lights, view(0), 32)).toEqual([lights[0]]);
  });

  test('never uses more than the slots and keeps priority lights first', () => {
    const lights: LightCandidate[] = Array.from({ length: 60 }, (_, i) => ({ x: i * 0.3, y: 5, radius: 4 }));
    const squid = { x: 8, y: 5, radius: 3, priority: true };
    const out = selectLights([...lights, squid], view(8), 32);
    expect(out.length).toBe(32);
    expect(out[0]).toBe(squid);
  });

  test('keeps the lights nearest the view centre', () => {
    const lights: LightCandidate[] = Array.from({ length: 40 }, (_, i) => ({ x: i, y: 5, radius: 30 }));
    const out = selectLights(lights, view(20), 10);
    const xs = out.map((l) => l.x);
    expect(Math.min(...xs)).toBeGreaterThanOrEqual(15);
    expect(Math.max(...xs)).toBeLessThanOrEqual(25);
  });

  test('45 lit plants across 128 units: every light inside the view stays selected while the view slides (no flicker)', () => {
    const rng = makeRng(5);
    const lights: LightCandidate[] = Array.from({ length: 45 }, () => ({ x: rng() * 128, y: rng() * 30, radius: 4.2 }));
    for (let x = 9; x <= 119; x += 0.25) {
      const v = view(x);
      const out = new Set(selectLights(lights, v, 32));
      for (const l of lights) if (l.x >= v.minX && l.x <= v.maxX && l.y >= v.minY && l.y <= v.maxY) expect(out.has(l)).toBe(true);
    }
  });

  test('a light only leaves the selection once it is outside the margin', () => {
    const rng = makeRng(9);
    const lights: LightCandidate[] = Array.from({ length: 45 }, () => ({ x: rng() * 128, y: rng() * 30, radius: 4.2 }));
    let prev = new Set(selectLights(lights, view(9), 32));
    for (let x = 9.25; x <= 119; x += 0.25) {
      const v = view(x);
      const cur = new Set(selectLights(lights, v, 32));
      for (const l of prev) {
        if (cur.has(l)) continue;
        // It no longer touches the screen at all: its light is already out of sight.
        const dx = Math.max(v.minX - l.x, 0, l.x - v.maxX);
        const dy = Math.max(v.minY - l.y, 0, l.y - v.maxY);
        expect(Math.hypot(dx, dy)).toBeGreaterThan(l.radius + 3);
      }
      prev = cur;
    }
  });
});
