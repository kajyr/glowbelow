import { describe, expect, test } from 'vitest';
import { collide } from '../game/collision';
import { shaftPush } from '../game/shaft';
import { steer, type Body } from '../game/steering';
import { TUNING } from '../game/tuning';
import { generateWorld } from './assembleWorld';
import { Fields } from './clearance';
import { buildLevel } from './level';
import { zoneAt } from './world';

const R = TUNING.squid.radius;
const DT = 1 / 60;

describe('the assembled world', () => {
  test('Twilight sits above home, centred on the shaft', () => {
    for (const s of [1, 2, 3]) {
      const w = generateWorld(s);
      const shaft = w.home.layout.level.shaft;
      const tw = w.map.zones.find((z) => z.name === 'twilight')!;
      expect((tw.rect.minX + tw.rect.maxX) / 2).toBeCloseTo((shaft.x0 + shaft.x1) / 2, 5);
      expect(tw.rect.minY).toBeCloseTo(44.5, 5);
      expect(zoneAt(w.map, { x: (shaft.x0 + shaft.x1) / 2, y: 80 })).toBe('twilight');
    }
  });

  test('from home, the whole of Twilight is reachable through the shaft', () => {
    for (const s of [4, 5, 6]) {
      const w = generateWorld(s);
      const f = new Fields(buildLevel(w.level).world, w.level.start);
      const lanterns = w.level.lanterns!;
      const unreached = lanterns.filter((l) => f.distanceToWideReach(l.x, l.y, 2.4) === Infinity);
      expect(unreached).toEqual([]);
    }
  });

  test('the squid swims up the open shaft into Twilight, and back down', () => {
    for (const s of [7, 8, 9]) {
      const w = generateWorld(s);
      const world = buildLevel(w.level).world;
      const shaft = w.home.layout.level.shaft;
      const body: Body = { pos: { x: (shaft.x0 + shaft.x1) / 2, y: 34 }, vel: { x: 0, y: 0 } };
      for (let t = 0; t < 8; t += DT) {
        steer(body, { kind: 'direction', x: 0, y: 1 }, DT);
        collide(body, R, world, DT);
        shaftPush(body, w.level.shaft, DT);
      }
      expect(zoneAt(w.map, body.pos)).toBe('twilight');
      expect(body.pos.y).toBeGreaterThan(55);
      for (let t = 0; t < 10; t += DT) {
        steer(body, { kind: 'direction', x: 0, y: -1 }, DT);
        collide(body, R, world, DT);
        shaftPush(body, w.level.shaft, DT);
      }
      expect(zoneAt(w.map, body.pos)).toBe('home');
    }
  });

  test('the squid cannot get beside Twilight: the rock there is solid', () => {
    const w = generateWorld(10);
    const world = buildLevel(w.level).world;
    const tw = w.map.zones.find((z) => z.name === 'twilight')!;
    const body: Body = { pos: { x: tw.rect.minX + 3, y: 70 }, vel: { x: 0, y: 0 } };
    for (let t = 0; t < 4; t += DT) {
      steer(body, { kind: 'direction', x: -1, y: 0 }, DT);
      collide(body, R, world, DT);
    }
    expect(body.pos.x).toBeGreaterThan(tw.rect.minX - 0.1);
  });
});
