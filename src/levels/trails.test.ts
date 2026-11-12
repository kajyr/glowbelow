import { describe, expect, test } from 'vitest';
import { TUNING } from '../game/tuning';
import { generateValidZone } from './generateValid';
import { uncoveredByTrails } from './rules';
import { findPath, resample } from './trails';
import { MIDNIGHT_HOME } from './zoneRecipe';

const seeds = Array.from({ length: 40 }, (_, i) => i * 6007 + 11);
const length = (pts: { x: number; y: number }[]) => pts.slice(1).reduce((s, p, i) => s + Math.hypot(p.x - pts[i].x, p.y - pts[i].y), 0);

describe('trails', () => {
  test('resample spaces points evenly and keeps both ends', () => {
    const out = resample([{ x: 0, y: 0 }, { x: 10, y: 0 }], 2.6);
    expect(out[0]).toEqual({ x: 0, y: 0 });
    expect(out[out.length - 1].x).toBeCloseTo(10, 5);
    expect(out[1].x).toBeCloseTo(2.6, 5);
  });

  test('the first trail starts beside the start and ends at the cave entrance', () => {
    for (const s of seeds) {
      const z = generateValidZone(MIDNIGHT_HOME, s);
      const { level, cave } = z.layout;
      const first = level.trails[0];
      expect(Math.hypot(first[0].x - level.start.x, first[0].y - level.start.y)).toBeLessThan(4);
      const end = first[first.length - 1];
      expect(Math.hypot(end.x - cave.outside.x, end.y - cave.outside.y)).toBeLessThan(1.5);
    }
  });

  test('a trail is within two screens of every reachable spot, and every trail ends at plants, the cave or the shaft', () => {
    for (const s of seeds) {
      const z = generateValidZone(MIDNIGHT_HOME, s);
      const { level, cave } = z.layout;
      expect(uncoveredByTrails(z.fields, level.trails, 2 * MIDNIGHT_HOME.screen.w)).toEqual([]);
      const shaft = { x: (level.shaft.x0 + level.shaft.x1) / 2, y: MIDNIGHT_HOME.ceilingY - 5 };
      for (const t of level.trails) {
        const end = t[t.length - 1];
        const nearPlant = level.plants.some((p) => Math.hypot(p.x - end.x, (p.y ?? 0) - end.y) <= MIDNIGHT_HOME.screen.w);
        const nearCave = Math.hypot(end.x - cave.outside.x, end.y - cave.outside.y) < 1.5;
        const nearShaft = Math.hypot(end.x - shaft.x, end.y - shaft.y) < 6;
        expect(nearPlant || nearCave || nearShaft).toBe(true);
      }
    }
  });

  test('trail sparkles keep the squid comfortably clear of rocks', () => {
    const z = generateValidZone(MIDNIGHT_HOME, seeds[0]);
    for (const p of z.layout.level.trails.flat()) {
      const cell = z.fields.wideReach[z.fields.idx(z.fields.ix(p.x), z.fields.iy(p.y))];
      expect(cell).toBe(1);
    }
  });

  test('crossing the zone takes about a minute or less; the cave trail under two minutes', () => {
    for (const s of seeds) {
      const z = generateValidZone(MIDNIGHT_HOME, s);
      const f = z.fields;
      let left = -1;
      let right = -1;
      for (let ix = 0; ix < f.cols && (left < 0 || right < 0); ix++) {
        for (let iy = 0; iy < f.rows; iy++) {
          if (left < 0 && f.wideReach[f.idx(ix, iy)]) left = f.idx(ix, iy);
          if (right < 0 && f.wideReach[f.idx(f.cols - 1 - ix, iy)]) right = f.idx(f.cols - 1 - ix, iy);
        }
      }
      const a = { x: f.cx(left % f.cols), y: f.cy(Math.floor(left / f.cols)) };
      const b = { x: f.cx(right % f.cols), y: f.cy(Math.floor(right / f.cols)) };
      const route = findPath(f, a, b);
      expect(route).not.toBeNull();
      expect(length(route!) / TUNING.squid.topSpeed).toBeLessThan(60);
      expect(length(z.layout.level.trails[0]) / TUNING.squid.topSpeed).toBeLessThan(120);
    }
  });
});
