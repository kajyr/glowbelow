import { describe, expect, it } from 'vitest';
import type { PlantInfo, SquidInfo } from './dumboBrain';
import { shapeFor, shapePoints, Swarm } from './swarm';
import { TUNING } from './tuning';

const DT = 1 / 60;
const groups = [
  { x: 0, y: 50 },
  { x: 10, y: 60 },
  { x: -8, y: 70 },
  { x: 6, y: 80 },
  { x: -4, y: 90 },
];
const still = (x = 0, y = 55): SquidInfo => ({ pos: { x, y }, vel: { x: 0, y: 0 }, facing: 1 });
const run = (s: Swarm, seconds: number, squid: SquidInfo, unlit: PlantInfo[] = []) => {
  for (let t = 0; t < seconds; t += DT) s.update(DT, squid, unlit);
};

describe('swarm shapes', () => {
  it('picks the shape from how many groups joined', () => {
    expect(shapeFor(0)).toBeNull();
    expect(shapeFor(1)).toBe('arrow');
    expect(shapeFor(2)).toBe('arrow');
    expect(shapeFor(3)).toBe('star');
    expect(shapeFor(4)).toBe('star');
    expect(shapeFor(5)).toBe('heart');
  });

  it('points the arrow at the target: its tip is the point nearest the target', () => {
    const centre = { x: 0, y: 0 };
    const toward = { x: 0, y: 10 };
    const pts = shapePoints('arrow', 12, centre, toward);
    expect(pts).toHaveLength(12);
    const nearest = pts.reduce((a, b) => (Math.hypot(b.x - toward.x, b.y - toward.y) < Math.hypot(a.x - toward.x, a.y - toward.y) ? b : a));
    // The tip sits straight up from the squid, between it and the target.
    expect(nearest.x).toBeCloseTo(0, 5);
    expect(nearest.y).toBeCloseTo(TUNING.firefly.arrowDistance + TUNING.firefly.arrowLength / 2, 5);
    // Every point is on the target's side of the squid.
    expect(pts.every((p) => p.y > 0)).toBe(true);
  });

  it('draws star and heart around the squid with one spot per firefly', () => {
    for (const shape of ['star', 'heart'] as const) {
      const pts = shapePoints(shape, 30, { x: 5, y: 5 }, null);
      expect(pts).toHaveLength(30);
      const cx = pts.reduce((a, p) => a + p.x, 0) / pts.length;
      expect(cx).toBeCloseTo(5, 1);
      expect(pts.every((p) => Math.hypot(p.x - 5, p.y - 5) < 3.5)).toBe(true);
    }
  });
});

describe('swarm', () => {
  it('has five groups of six hovering at home before any joins', () => {
    const s = new Swarm(groups, { x: 0, y: 55 });
    expect(s.fireflies).toHaveLength(30);
    run(s, 3, still());
    for (const f of s.fireflies) {
      const g = groups[f.group];
      expect(Math.hypot(f.pos.x - g.x, f.pos.y - g.y)).toBeLessThan(TUNING.firefly.groupRadius);
    }
  });

  it('a group joins once; only the very first join is "first"', () => {
    const s = new Swarm(groups, { x: 0, y: 55 });
    expect(s.join(1)).toEqual({ kind: 'join', group: 1, first: true });
    expect(s.join(1)).toBeNull();
    expect(s.join(3)).toEqual({ kind: 'join', group: 3, first: false });
    expect(s.joined).toEqual([1, 3]);
  });

  it('trails behind a swimming squid, staying on screen (the view is about 16 units wide)', () => {
    const s = new Swarm(groups, { x: 0, y: 55 });
    s.join(0);
    const squid: SquidInfo = { pos: { x: 0, y: 50 }, vel: { x: 4, y: 0 }, facing: 1 };
    for (let t = 0; t < 4; t += DT) {
      squid.pos.x += squid.vel.x * DT;
      s.update(DT, squid, []);
    }
    const members = s.fireflies.filter((f) => f.group === 0);
    const meanX = members.reduce((a, f) => a + f.pos.x, 0) / members.length;
    expect(meanX).toBeLessThan(squid.pos.x);
    expect(squid.pos.x - meanX).toBeLessThan(7);
    expect(members.every((f) => squid.pos.x - f.pos.x < 8)).toBe(true);
  });

  it('with one group, a still squid gets an arrow pointing at the nearest unlit lantern', () => {
    const s = new Swarm(groups, { x: 0, y: 55 });
    s.join(0);
    const unlit: PlantInfo[] = [
      { id: 'lantern-0', x: 0, y: 52, lit: true },
      { id: 'lantern-1', x: 6, y: 55, lit: false },
      { id: 'plant-3', x: -30, y: 2, lit: false },
    ];
    run(s, TUNING.firefly.shapeAfter + 0.1, still(), unlit);
    expect(s.shape).toBe('arrow');
    expect(s.pointing?.id).toBe('lantern-1');
  });

  it('with all five groups, a still squid gets a heart the fireflies fly into', () => {
    const s = new Swarm(groups, { x: 0, y: 55 });
    for (let g = 0; g < 5; g++) s.join(g);
    const squid = still(0, 55);
    run(s, TUNING.firefly.shapeAfter + 4, squid);
    expect(s.shape).toBe('heart');
    const spots = shapePoints('heart', 30, squid.pos, null);
    const off = s.fireflies.map((f, i) => Math.hypot(f.pos.x - spots[i].x, f.pos.y - spots[i].y));
    expect(off.reduce((a, b) => a + b, 0) / off.length).toBeLessThan(0.5);
  });

  it('breaks the shape as soon as the squid moves', () => {
    const s = new Swarm(groups, { x: 0, y: 55 });
    s.join(0);
    run(s, TUNING.firefly.shapeAfter + 0.1, still());
    expect(s.shape).toBe('arrow');
    s.update(DT, { pos: { x: 0, y: 55 }, vel: { x: 3, y: 0 }, facing: 1 }, []);
    expect(s.shape).toBeNull();
  });
});
