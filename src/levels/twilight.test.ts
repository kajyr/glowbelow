import { describe, expect, test } from 'vitest';
import { placedCircles } from './pieces';
import { generateValidTwilight, TWILIGHT } from './twilight';

describe('twilight generation', () => {
  test('every one of 500 seeds gives a valid Twilight, most on the first try', () => {
    let first = 0;
    const reasons: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const z = generateValidTwilight(TWILIGHT, i * 7919 + 13);
      if (z.attempts === 1) first++;
      for (const r of z.rejected) for (const w of r.why) reasons[w] = (reasons[w] ?? 0) + 1;
    }
    console.log('twilight first try', first, '/ 500; rejections', JSON.stringify(reasons));
    expect(first).toBeGreaterThan(350);
  }, 120_000);

  test('follows its recipe and spreads lanterns up the whole height', () => {
    for (const s of [1, 2, 3, 4, 5]) {
      const { level } = generateValidTwilight(TWILIGHT, s).layout;
      expect(level.lanterns).toHaveLength(30);
      expect(level.fireflyGroups).toHaveLength(5);
      expect(level.nautilus).toBeTruthy();
      expect(level.cave).toBeNull();
      // A lantern in every 11-unit (one-screen) band of the shaft.
      for (let y = 8; y < TWILIGHT.height - 16; y += 11) {
        expect(level.lanterns!.some((l) => l.y >= y && l.y < y + 11)).toBe(true);
      }
    }
  });

  test('the nautilus column, the entry and the top passage are free of rock', () => {
    for (const s of [7, 8, 9, 10]) {
      const z = generateValidTwilight(TWILIGHT, s);
      const n = z.layout.level.nautilus!;
      for (const p of z.layout.level.pieces.filter((p) => !p.decor)) {
        for (const c of placedCircles(p)) {
          const inColumn = Math.abs(c.x - n.x) < c.r + 2 && c.y > n.y0 && c.y < n.y1;
          expect(inColumn).toBe(false);
        }
      }
    }
  });

  test('the same seed gives the same Twilight', () => {
    const a = generateValidTwilight(TWILIGHT, 321);
    const b = generateValidTwilight(TWILIGHT, 321);
    expect(JSON.stringify(b.layout.level)).toBe(JSON.stringify(a.layout.level));
  });
});
