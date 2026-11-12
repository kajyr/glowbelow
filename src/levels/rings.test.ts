import { describe, expect, test } from 'vitest';
import type { Fields } from './clearance';
import { generateValidZone } from './generateValid';
import type { RingChain } from './rings';
import { generateValidTwilight, TWILIGHT } from './twilight';
import { MIDNIGHT_HOME } from './zoneRecipe';

const open = (f: Fields, x: number, y: number) => f.wideReach[f.idx(f.ix(x), f.iy(y))] === 1;

/** Every ring and the straight swim through the chain is in open, reachable water. */
function checkChain(f: Fields, c: RingChain, start: { x: number; y: number }) {
  expect(c.rings.length).toBeGreaterThanOrEqual(4);
  expect(c.rings.length).toBeLessThanOrEqual(6);
  for (let i = 1; i < c.rings.length; i++) {
    const a = c.rings[i - 1];
    const b = c.rings[i];
    expect(Math.hypot(b.x - a.x, b.y - a.y)).toBeCloseTo(3.2, 5);
    const closed: string[] = [];
    for (let k = 0; k <= 10; k++) {
      const x = a.x + ((b.x - a.x) * k) / 10;
      const y = a.y + ((b.y - a.y) * k) / 10;
      if (!open(f, x, y)) closed.push(`${x.toFixed(2)},${y.toFixed(2)}`);
    }
    expect(closed).toEqual([]);
  }
  for (const r of c.rings) expect(Math.hypot(r.x - start.x, r.y - start.y)).toBeGreaterThan(5);
}

describe('bubble ring chains', () => {
  test('Midnight home: one reachable chain in open water, over 500 seeds', () => {
    for (let i = 0; i < 500; i++) {
      const z = generateValidZone(MIDNIGHT_HOME, i * 104729 + 3);
      expect(z.layout.level.rings).toHaveLength(1);
      checkChain(z.fields, z.layout.level.rings![0], z.layout.level.start);
    }
  }, 120_000);

  test('Twilight: one reachable chain in open water, over 500 seeds', () => {
    for (let i = 0; i < 500; i++) {
      const z = generateValidTwilight(TWILIGHT, i * 7919 + 11);
      expect(z.layout.level.rings).toHaveLength(1);
      checkChain(z.fields, z.layout.level.rings![0], z.layout.level.start);
    }
  }, 120_000);

  test('the same seed places the same chain', () => {
    const a = generateValidZone(MIDNIGHT_HOME, 4242).layout.level.rings;
    const b = generateValidZone(MIDNIGHT_HOME, 4242).layout.level.rings;
    expect(b).toEqual(a);
  });
});
