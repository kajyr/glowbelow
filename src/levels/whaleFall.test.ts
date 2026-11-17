import { describe, expect, test } from 'vitest';
import { rectDistance } from './generate';
import { onSkeleton } from './level';
import { placedCircles } from './pieces';
import { GIANT_ROOM, RIB_COUNT } from './skeleton';
import { generateValidWhaleFall, WHALE_FALL, whaleFallSpots } from './whaleFall';

describe('whale fall generation', () => {
  test('every one of 500 seeds gives a valid Whale fall, most on the first try', () => {
    let first = 0;
    const reasons: Record<string, number> = {};
    for (let i = 0; i < 500; i++) {
      const z = generateValidWhaleFall(WHALE_FALL, i * 7919 + 13);
      if (z.attempts === 1) first++;
      for (const r of z.rejected) for (const w of r.why) reasons[w] = (reasons[w] ?? 0) + 1;
    }
    console.log('whale fall first try', first, '/ 500; rejections', JSON.stringify(reasons));
    expect(first).toBeGreaterThan(400);
  }, 120_000);

  test('follows its recipe: the skeleton, the giant squid, five starfish and a ring chain', () => {
    for (const s of [1, 2, 3, 4, 5, 6]) {
      const { level } = generateValidWhaleFall(WHALE_FALL, s).layout;
      expect(level.skeleton).toBeTruthy();
      expect(whaleFallSpots(level.skeleton!).ribs).toHaveLength(RIB_COUNT);
      expect(level.starfish).toHaveLength(5);
      expect(level.starfish!.every((st) => st.zone === 'whale-fall')).toBe(true);
      expect(level.rings).toHaveLength(1);
      expect(level.fishSchools!.length).toBeGreaterThanOrEqual(WHALE_FALL.fishSchools - 2);
      expect(level.trails.length).toBeGreaterThan(0);
      expect(level.cave).toBeNull();
    }
  });

  test('about 4 screens wide and 3 tall, shorter than home', () => {
    const { level } = generateValidWhaleFall(WHALE_FALL, 1).layout;
    expect((level.bounds.maxX - level.bounds.minX) / WHALE_FALL.screen.w).toBeCloseTo(4.25, 1);
    expect((level.bounds.maxY - level.bounds.minY) / WHALE_FALL.screen.h).toBeCloseTo(3.1, 1);
  });

  test('the room above the skull and the passage from home are free of rock', () => {
    for (const s of [7, 8, 9, 10, 11, 12]) {
      const z = generateValidWhaleFall(WHALE_FALL, s);
      const sk = z.layout.skeleton;
      const a = onSkeleton(sk, { x: GIANT_ROOM.minX, y: GIANT_ROOM.minY });
      const b = onSkeleton(sk, { x: GIANT_ROOM.maxX, y: GIANT_ROOM.maxY });
      const room = { minX: Math.min(a.x, b.x), maxX: Math.max(a.x, b.x), minY: a.y, maxY: b.y };
      const passage = { minX: WHALE_FALL.width - 6, maxX: WHALE_FALL.width, minY: 0, maxY: WHALE_FALL.passageTop };
      for (const c of z.layout.level.pieces.flatMap(placedCircles)) {
        expect(rectDistance(c.x, c.y, room)).toBeGreaterThanOrEqual(c.r);
        expect(rectDistance(c.x, c.y, passage)).toBeGreaterThanOrEqual(c.r);
      }
    }
  });

  test('the skeleton lies either way round, head toward home or away', () => {
    const mirrors = new Set<boolean>();
    for (let s = 0; s < 20; s++) mirrors.add(generateValidWhaleFall(WHALE_FALL, s).layout.skeleton.mirror);
    expect(mirrors).toEqual(new Set([true, false]));
  });

  test('the same seed gives the same Whale fall', () => {
    const a = generateValidWhaleFall(WHALE_FALL, 321);
    const b = generateValidWhaleFall(WHALE_FALL, 321);
    expect(JSON.stringify(b.layout.level)).toBe(JSON.stringify(a.layout.level));
  });
});
