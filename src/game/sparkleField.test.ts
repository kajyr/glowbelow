import { describe, expect, test } from 'vitest';
import { makeRng } from './rng';
import { SparkleField } from './sparkleField';
import { TUNING } from './tuning';

const DT = 1 / 60;
const bounds = { minX: 0, maxX: 40, minY: 0, maxY: 20 };
const floor = () => 0.5;

describe('sparkle field', () => {
  test('a sparkle about one squid-width from the path is pulled in and collected', () => {
    const squidWidth = 1.35;
    const field = new SparkleField({ bounds, floor, trails: [{ x: 10, y: 5 + squidWidth }], count: 0, rng: makeRng(2) });
    const squid = { x: 2, y: 5 };
    let got = 0;
    for (let t = 0; t < 4; t += DT) {
      squid.x += TUNING.squid.topSpeed * DT;
      got += field.update(DT, squid, bounds).length;
    }
    expect(got).toBe(1);
  });

  test('a sparkle far from the path is left alone', () => {
    const field = new SparkleField({ bounds, floor, trails: [{ x: 10, y: 9 }], count: 0, rng: makeRng(2) });
    const squid = { x: 2, y: 5 };
    let got = 0;
    for (let t = 0; t < 4; t += DT) {
      squid.x += TUNING.squid.topSpeed * DT;
      got += field.update(DT, squid, bounds).length;
    }
    expect(got).toBe(0);
  });

  test('collected sparkles come back inside the view within 10 seconds', () => {
    const view = { minX: 10, maxX: 25, minY: 2, maxY: 13 };
    const trails = Array.from({ length: 8 }, (_, i) => ({ x: 12 + i, y: 6 }));
    const field = new SparkleField({ bounds, floor, trails, count: 0, rng: makeRng(5) });
    // Sweep the squid along the trail to eat everything.
    let eaten = 0;
    for (let x = 11; x < 21; x += 0.25) eaten += field.update(DT, { x, y: 6 }, view).length;
    expect(eaten).toBe(8);
    expect(field.countIn(view)).toBe(0);
    const away = { x: 100, y: 100 };
    for (let t = 0; t < 10; t += DT) field.update(DT, away, view);
    expect(field.countIn(view)).toBe(8);
  });

  test('drifting sparkles fall and never run out', () => {
    const field = new SparkleField({ bounds, floor, trails: [], rng: makeRng(9) });
    const total = field.sparkles.length;
    expect(total).toBe(Math.round(40 * 20 * TUNING.sparkles.density));
    expect(total).toBeGreaterThan(5);
    const y0 = field.sparkles[0].baseY;
    field.update(1, { x: -50, y: -50 }, bounds);
    expect(field.sparkles[0].baseY).toBeLessThan(y0);
    for (let t = 0; t < 120; t += 0.1) field.update(0.1, { x: -50, y: -50 }, bounds);
    expect(field.sparkles.filter((s) => s.alive).length).toBe(total);
    expect(field.countIn({ minX: -1, maxX: 41, minY: 0, maxY: 20 })).toBe(total);
  });

  test('friends only see drifting sparkles, never trails', () => {
    const field = new SparkleField({ bounds, floor, trails: [{ x: 10, y: 5 }, { x: 12, y: 5 }], count: 5, rng: makeRng(3) });
    const list = field.drifting();
    expect(list).toHaveLength(5);
    for (const d of list) expect(field.sparkles[d.index].kind).toBe('drift');
    expect(field.collect(0)).toBeNull(); // index 0 is a trail sparkle
    expect(field.sparkles[0].alive).toBe(true);
  });

  test('a sparkle collected for a friend respawns under the usual rules', () => {
    const field = new SparkleField({ bounds, floor, trails: [], count: 3, rng: makeRng(4) });
    const view = { minX: 10, maxX: 25, minY: 2, maxY: 13 };
    const at = field.collect(1);
    expect(at).not.toBeNull();
    expect(field.sparkles[1].alive).toBe(false);
    expect(field.collect(1)).toBeNull(); // already gone
    expect(field.drifting().map((d) => d.index)).not.toContain(1);
    for (let t = 0; t < TUNING.sparkles.respawnMax + 0.1; t += 1 / 60) field.update(1 / 60, { x: -50, y: -50 }, view);
    expect(field.sparkles[1].alive).toBe(true);
    expect(field.sparkles[1].x).toBeGreaterThanOrEqual(view.minX);
    expect(field.sparkles[1].x).toBeLessThanOrEqual(view.maxX);
  });
});
