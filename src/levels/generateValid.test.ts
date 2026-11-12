import { describe, expect, test } from 'vitest';
import { deriveSeed, generateValidZone } from './generateValid';
import { MIDNIGHT_HOME } from './zoneRecipe';

describe('generateValidZone', () => {
  test('derived seeds differ and the first is the seed itself', () => {
    expect(deriveSeed(7, 0)).toBe(7);
    const set = new Set(Array.from({ length: 50 }, (_, i) => deriveSeed(7, i)));
    expect(set.size).toBe(50);
  });

  test('every one of 500 seeds gives a valid layout, most on the first try', () => {
    let firstTry = 0;
    const reasons: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const z = generateValidZone(MIDNIGHT_HOME, i * 104729 + 3);
      if (z.attempts === 1) firstTry++;
      for (const r of z.rejected) for (const w of r.why) reasons[w] = (reasons[w] ?? 0) + 1;
    }
    console.log('first try', firstTry, '/ 500; rejections', JSON.stringify(reasons));
    expect(firstTry).toBeGreaterThan(250);
  }, 120_000);

  test('same seed gives the same zone, including after rejections', () => {
    const a = generateValidZone(MIDNIGHT_HOME, 123456);
    const b = generateValidZone(MIDNIGHT_HOME, 123456);
    expect(b.seed).toBe(a.seed);
    expect(JSON.stringify(b.layout.level)).toBe(JSON.stringify(a.layout.level));
  });
});
