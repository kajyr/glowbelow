import { describe, expect, test } from 'vitest';
import { collide } from '../game/collision';
import { shaftPush } from '../game/shaft';
import { steer, type Body } from '../game/steering';
import { TUNING } from '../game/tuning';
import { generateWorld, ridePath } from './assembleWorld';
import { ROCK_GAP } from './generate';
import { generateValidZone } from './generateValid';
import { placedCircles } from './pieces';
import { WHALE_FALL, whaleFallSpots } from './whaleFall';
import { MIDNIGHT_HOME } from './zoneRecipe';
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

  test('Whale fall sits left of home, at its seabed level, and is shorter', () => {
    for (const s of [11, 12, 13]) {
      const w = generateWorld(s);
      const home = w.map.zones.find((z) => z.name === 'home')!;
      const wf = w.map.zones.find((z) => z.name === 'whale-fall')!;
      expect(wf.rect.maxX).toBeCloseTo(home.rect.minX - WHALE_FALL.wall, 5);
      expect(wf.rect.minY).toBe(home.rect.minY);
      expect(wf.rect.maxY).toBeLessThan(home.rect.maxY);
      expect(zoneAt(w.map, { x: wf.rect.minX + 10, y: 5 })).toBe('whale-fall');
    }
  });

  test('the squid swims left along the seabed from home into Whale fall, and back', () => {
    for (const s of [14, 15, 16]) {
      const w = generateWorld(s);
      const world = buildLevel(w.level).world;
      const body: Body = { pos: { x: 3, y: 5 }, vel: { x: 0, y: 0 } };
      for (let t = 0; t < 3; t += DT) {
        steer(body, { kind: 'direction', x: -1, y: 0 }, DT);
        collide(body, R, world, DT);
      }
      expect(zoneAt(w.map, body.pos)).toBe('whale-fall');
      for (let t = 0; t < 3; t += DT) {
        steer(body, { kind: 'direction', x: 1, y: 0 }, DT);
        collide(body, R, world, DT);
      }
      expect(zoneAt(w.map, body.pos)).toBe('home');
    }
  });

  test('above the passage, the wall between Whale fall and home is solid', () => {
    const w = generateWorld(17);
    const world = buildLevel(w.level).world;
    const body: Body = { pos: { x: 3, y: 22 }, vel: { x: 0, y: 0 } };
    for (let t = 0; t < 4; t += DT) {
      steer(body, { kind: 'direction', x: -1, y: 0 }, DT);
      collide(body, R, world, DT);
    }
    expect(body.pos.x).toBeGreaterThan(-0.1);
  });

  test('home generation always leaves the passage to Whale fall clear of rock', () => {
    // Rocks keep at least two squid widths (ROCK_GAP) from home's left edge, so the passage stays wide open.
    for (let i = 0; i < 200; i++) {
      const z = generateValidZone(MIDNIGHT_HOME, i * 7919 + 13);
      for (const c of z.layout.level.pieces.flatMap(placedCircles)) {
        if (c.y - c.r < WHALE_FALL.passageTop) expect(c.x - c.r).toBeGreaterThan(ROCK_GAP - 0.2);
      }
    }
  }, 60_000);

  test('the giant squid\'s ride goes from its arm to the top of the world, in open water', () => {
    for (const s of [18, 19, 20]) {
      const w = generateWorld(s);
      const path = ridePath(w);
      const arm = whaleFallSpots(w.level.skeleton!).arm;
      const end = path[path.length - 1];
      expect(Math.hypot(path[0].x - arm.x, path[0].y - arm.y)).toBeLessThan(1.5);
      expect(Math.hypot(end.x - w.landing.x, end.y - w.landing.y)).toBeLessThan(1.5);
      expect(zoneAt(w.map, end)).toBe('twilight');
      const world = buildLevel(w.level).world;
      for (const p of path) for (const c of world.circles) expect(Math.hypot(p.x - c.x, p.y - c.y)).toBeGreaterThan(c.r + R);
    }
  });

  test('a continued game has an entry in every zone', () => {
    const w = generateWorld(21);
    for (const z of w.map.zones) expect(zoneAt(w.map, w.entries[z.name])).toBe(z.name);
  });

  test('both ends of the world show a rock wall: the camera sees just past them, and rock stands there', () => {
    for (const s of [22, 23]) {
      const w = generateWorld(s);
      const right = w.map.bounds.maxX;
      const left = w.map.bounds.minX;
      expect(w.level.cameraBounds.maxX).toBeGreaterThan(right);
      expect(w.level.cameraBounds.minX).toBeLessThan(left);
      for (const [edge, side] of [[right, 1], [left, -1]] as const) {
        // Rock columns all the way up the edge, from the seabed to the top of the zone there.
        const rocks = w.level.pieces.filter((p) => p.decor && (p.x - edge) * side > 0 && Math.abs(p.x - edge) < 2.5);
        const top = side > 0 ? MIDNIGHT_HOME.ceilingY : WHALE_FALL.height;
        for (let y = 2; y < top - 2; y += 5) expect(rocks.some((p) => Math.abs(p.y - y) < 4)).toBe(true);
        // And the squid cannot get past it.
        const world = buildLevel(w.level).world;
        const body: Body = { pos: { x: edge - side * 3, y: 6 }, vel: { x: 0, y: 0 } };
        for (let t = 0; t < 3; t += DT) {
          steer(body, { kind: 'direction', x: side, y: 0 }, DT);
          collide(body, R, world, DT);
        }
        expect((body.pos.x - edge) * side).toBeLessThan(0);
      }
    }
  });
});
