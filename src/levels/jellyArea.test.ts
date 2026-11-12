import { describe, expect, test } from 'vitest';
import { Jelly } from '../game/jelly';
import { TUNING } from '../game/tuning';
import { generateLayout } from './generate';
import { generateValidZone } from './generateValid';
import { JellyFreeArea, jellyFits, JELLY_BOX, MIN_JELLY_AREA } from './jellyArea';
import { MIDNIGHT_HOME } from './zoneRecipe';

const seeds = Array.from({ length: 12 }, (_, i) => i * 4241 + 17);

describe('phantom jelly area', () => {
  test('every free cell is wide open water, away from start, cave and shaft, with room for bell and arms', () => {
    for (const s of seeds) {
      const z = generateValidZone(MIDNIGHT_HOME, s);
      const { level, cave } = z.layout;
      const area = new JellyFreeArea(z.layout, z.fields);
      expect(area.area).toBeGreaterThanOrEqual(MIN_JELLY_AREA);
      expect(area.free(level.jelly!.start.x, level.jelly!.start.y)).toBe(true);
      for (const c of area.cells) {
        expect(Math.hypot(c.x - level.start.x, c.y - level.start.y)).toBeGreaterThanOrEqual(10);
        expect(Math.hypot(c.x - cave.outside.x, c.y - cave.outside.y)).toBeGreaterThanOrEqual(8);
        for (const dy of [JELLY_BOX.up, -JELLY_BOX.down]) {
          expect(z.fields.wideReach[z.fields.idx(z.fields.ix(c.x), z.fields.iy(c.y + dy))]).toBe(1);
        }
      }
    }
  });

  test('a spot next to the start or inside rock does not fit', () => {
    const z = generateValidZone(MIDNIGHT_HOME, seeds[0]);
    expect(jellyFits(z.layout, z.fields, z.layout.level.start.x, z.layout.level.start.y)).toBe(false);
    expect(jellyFits(z.layout, z.fields, 64, -0.5)).toBe(false);
  });

  test('the same seed gives the same start, and the jelly does not change the rest of the layout', () => {
    const a = generateValidZone(MIDNIGHT_HOME, 4242);
    const b = generateValidZone(MIDNIGHT_HOME, 4242);
    expect(b.layout.level.jelly).toEqual(a.layout.level.jelly);
    for (const s of seeds) {
      const z = generateValidZone(MIDNIGHT_HOME, s);
      const raw = generateLayout(MIDNIGHT_HOME, z.seed)!;
      expect(JSON.stringify(z.layout.level.pieces)).toBe(JSON.stringify(raw.level.pieces));
      expect(JSON.stringify(z.layout.level.plants)).toBe(JSON.stringify(raw.level.plants));
    }
  });

  test('over ten minutes the jelly stays in open water, keeps moving and roams a large part of the zone', () => {
    const spans: number[] = [];
    for (const s of seeds) {
      const z = generateValidZone(MIDNIGHT_HOME, s);
      const area = new JellyFreeArea(z.layout, z.fields);
      const j = new Jelly(area, z.layout.level.jelly!.start, z.seed);
      let minX = j.pos.x;
      let maxX = j.pos.x;
      let travel = 0;
      let prev = { ...j.pos };
      for (let step = 1; step <= 600 * 20; step++) {
        j.update(1 / 20);
        expect(area.free(j.pos.x, j.pos.y)).toBe(true);
        minX = Math.min(minX, j.pos.x);
        maxX = Math.max(maxX, j.pos.x);
        travel += Math.hypot(j.pos.x - prev.x, j.pos.y - prev.y);
        prev = { ...j.pos };
        if (step % 200 === 0) {
          expect(travel).toBeGreaterThan(TUNING.jelly.speed * 10 * 0.8); // always moving
          travel = 0;
        }
      }
      spans.push(maxX - minX);
    }
    console.log('jelly x-span over 10 min:', spans.map((v) => v.toFixed(0)).join(', '));
    const avg = spans.reduce((a, b) => a + b, 0) / spans.length;
    expect(avg).toBeGreaterThan(MIDNIGHT_HOME.width * 0.3);
  }, 60_000);
});
