import { describe, expect, test } from 'vitest';
import { boundOf, generateLayout, rectDistance, ROCK_GAP } from './generate';
import { placedCircles } from './pieces';
import { expectedPlants, MIDNIGHT_HOME } from './zoneRecipe';

const seeds = Array.from({ length: 500 }, (_, i) => i * 7919 + 1);

describe('generateLayout', () => {
  test('same seed gives the same layout, different seeds differ', () => {
    const a = generateLayout(MIDNIGHT_HOME, 42)!;
    expect(JSON.stringify(generateLayout(MIDNIGHT_HOME, 42)!.level)).toBe(JSON.stringify(a.level));
    expect(JSON.stringify(generateLayout(MIDNIGHT_HOME, 43)!.level)).not.toBe(JSON.stringify(a.level));
  });
  test('shaft is in the middle 60% and recipe counts hold', () => {
    let built = 0;
    for (const s of seeds) {
      const l = generateLayout(MIDNIGHT_HOME, s);
      if (!l) continue;
      built++;
      const c = (l.level.shaft.x0 + l.level.shaft.x1) / 2;
      expect(c).toBeGreaterThanOrEqual(MIDNIGHT_HOME.width * 0.2);
      expect(c).toBeLessThanOrEqual(MIDNIGHT_HOME.width * 0.8);
      expect(l.level.plants.length).toBe(expectedPlants(MIDNIGHT_HOME));
      const d = Math.abs(l.cave.interior.x - l.level.start.x);
      expect(d).toBeGreaterThanOrEqual(32);
      expect(d).toBeLessThanOrEqual(64);
    }
    expect(built).toBeGreaterThan(seeds.length * 0.8);
  });
  test('cave and arch never overlap each other or the start', () => {
    for (const s of seeds) {
      const l = generateLayout(MIDNIGHT_HOME, s);
      if (!l) continue;
      const arch = boundOf(placedCircles(l.level.pieces.find((p) => p.piece === 'arch')!));
      const gap = Math.hypot(arch.x - l.cave.bound.x, arch.y - l.cave.bound.y) - arch.r - l.cave.bound.r;
      expect(gap).toBeGreaterThanOrEqual(2.6);
      expect(Math.hypot(l.cave.interior.x - l.level.start.x, l.cave.interior.y - l.level.start.y)).toBeGreaterThan(30);
    }
  });
  test('rocks keep their distance and keep-out areas stay empty', () => {
    for (const s of seeds.slice(0, 200)) {
      const l = generateLayout(MIDNIGHT_HOME, s);
      if (!l) continue;
      const solid = l.level.pieces.filter((p) => !(p.decor ?? Math.abs(p.z ?? 0) > 1.5) && placedCircles(p).length > 0);
      const bounds = solid.map((p) => boundOf(placedCircles(p)));
      for (let i = 0; i < bounds.length; i++)
        for (let j = i + 1; j < bounds.length; j++)
          expect(Math.hypot(bounds[i].x - bounds[j].x, bounds[i].y - bounds[j].y) - bounds[i].r - bounds[j].r).toBeGreaterThanOrEqual(ROCK_GAP - 1e-6);
      for (const k of l.keepOuts)
        for (const p of solid) for (const c of placedCircles(p)) expect(rectDistance(c.x, c.y, k.rect)).toBeGreaterThanOrEqual(c.r - 1e-6);
    }
  });

  test('every part of the zone has a plant within about one screen', () => {
    let good = 0;
    let total = 0;
    for (const s of seeds.slice(0, 100)) {
      const l = generateLayout(MIDNIGHT_HOME, s);
      if (!l) continue;
      total++;
      let worst = 0;
      for (let x = 2; x < MIDNIGHT_HOME.width; x += 4)
        for (let y = 2; y < MIDNIGHT_HOME.ceilingY - 1; y += 4)
          worst = Math.max(worst, Math.min(...l.level.plants.map((p) => Math.hypot(p.x - x, (p.y ?? 0) - y))));
      if (worst <= MIDNIGHT_HOME.screen.w) good++;
    }
    expect(good).toBe(total);
  });
});
