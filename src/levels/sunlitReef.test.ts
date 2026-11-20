import { describe, expect, test } from 'vitest';
import { generateValidReef, SUNBEAM, SUNLIT_REEF } from './sunlitReef';

describe('sunlit reef generation', () => {
  test('every one of 300 seeds gives a valid reef, most on the first try', () => {
    let first = 0;
    const reasons: Record<string, number> = {};
    for (let i = 0; i < 300; i++) {
      const z = generateValidReef(SUNLIT_REEF, i * 7919 + 13);
      if (z.attempts === 1) first++;
      for (const r of z.rejected) for (const w of r.why) reasons[w] = (reasons[w] ?? 0) + 1;
    }
    console.log('reef first try', first, '/ 300; rejections', JSON.stringify(reasons));
    expect(first).toBeGreaterThan(280);
  }, 120_000);

  test('follows its recipe: a coral garden, the cuttlefish, a landing spot, five starfish and a ring chain', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      const { level } = generateValidReef(SUNLIT_REEF, s).layout;
      expect(level.corals!.length).toBeGreaterThanOrEqual(SUNLIT_REEF.corals);
      expect(level.cuttlefish).toBeTruthy();
      expect(level.landing).toEqual(level.start);
      expect(level.starfish).toHaveLength(5);
      expect(level.starfish!.every((st) => st.zone === 'sunlit-reef' && st.y >= 0)).toBe(true);
      expect(level.rings).toHaveLength(1);
      expect(level.trails.length).toBeGreaterThan(0);
    }
  });

  test('neighbouring corals never start in the same colour', () => {
    for (const s of [7, 8, 9, 10]) {
      const corals = [...generateValidReef(SUNLIT_REEF, s).layout.level.corals!].sort((a, b) => a.x - b.x);
      for (let i = 1; i < corals.length; i++) expect(corals[i].colour).not.toBe(corals[i - 1].colour);
    }
  });

  test('the corals stand on the seabed, either side of an open hole in the middle', () => {
    for (const s of [11, 12, 13]) {
      const { level } = generateValidReef(SUNLIT_REEF, s).layout;
      const mid = SUNLIT_REEF.width / 2;
      for (const c of level.corals!) {
        expect(c.y).toBeCloseTo(-0.05, 5);
        expect(Math.abs(c.x - mid)).toBeGreaterThan(SUNLIT_REEF.passageWidth / 2);
      }
    }
  });

  test('about 4 screens wide and 2 tall', () => {
    const { level } = generateValidReef(SUNLIT_REEF, 1).layout;
    expect((level.cameraBounds.maxX - level.cameraBounds.minX) / SUNLIT_REEF.screen.w).toBeCloseTo(4, 1);
    expect((level.cameraBounds.maxY - level.cameraBounds.minY) / SUNLIT_REEF.screen.h).toBeCloseTo(2, 1);
  });

  test('the sunbeam is at the surface, well away from the cuttlefish and the landing spot', () => {
    for (let s = 0; s < 100; s++) {
      const { level } = generateValidReef(SUNLIT_REEF, s * 131 + 5).layout;
      const b = level.sunbeam!;
      expect(b.y).toBe(SUNLIT_REEF.height);
      expect(b.x).toBeGreaterThanOrEqual(6);
      expect(b.x).toBeLessThanOrEqual(SUNLIT_REEF.width - 6);
      expect(Math.abs(b.x - level.cuttlefish!.x)).toBeGreaterThanOrEqual(SUNBEAM.awayFromCuttlefish);
      expect(Math.abs(b.x - level.landing!.x)).toBeGreaterThanOrEqual(SUNBEAM.awayFromLanding);
    }
  });
});
