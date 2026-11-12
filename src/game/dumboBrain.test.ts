import { describe, expect, test } from 'vitest';
import { DumboBrain, nearestUnlit, POP_TIME, type DumboEvent, type PlantInfo, type SparkleInfo, type SquidInfo } from './dumboBrain';
import { TUNING } from './tuning';

const DT = 1 / 60;
const plants: PlantInfo[] = [
  { id: 'a', x: 2, y: 0, lit: true },
  { id: 'b', x: 6, y: 0, lit: false },
  { id: 'c', x: -9, y: 0, lit: false },
];

function found(at = { x: 0, y: 0 }) {
  const d = new DumboBrain(at);
  d.discover();
  const still: SquidInfo = { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, facing: 1 };
  for (let t = 0; t <= POP_TIME + DT; t += DT) d.update(DT, still, plants);
  return d;
}

describe('dumbo brain', () => {
  test('is found only once', () => {
    const d = new DumboBrain({ x: 0, y: 0 });
    expect(d.discover()).toBe(true);
    expect(d.discover()).toBe(false);
  });

  test('stays hidden and does nothing before discovery', () => {
    const d = new DumboBrain({ x: 3, y: 1 });
    const ev = d.update(5, { pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, facing: 1 }, plants);
    expect(ev).toBeNull();
    expect(d.pos).toEqual({ x: 3, y: 1 });
  });

  test('nearest unlit plant ignores lit ones', () => {
    expect(nearestUnlit({ x: 1.5, y: 0 }, plants)?.id).toBe('b');
    expect(nearestUnlit({ x: -5, y: 0 }, plants)?.id).toBe('c');
    expect(nearestUnlit({ x: 0, y: 0 }, plants.map((p) => ({ ...p, lit: true })))).toBeNull();
  });

  test('points at the nearest unlit plant after 2 s of squid stillness, once', () => {
    const d = found();
    const squid: SquidInfo = { pos: { x: 1, y: 0 }, vel: { x: 0, y: 0 }, facing: 1 };
    const events = [];
    for (let t = 0; t < TUNING.dumbo.pointAfter + 3; t += DT) {
      const ev = d.update(DT, squid, plants);
      if (ev) events.push({ t, ev });
    }
    expect(events).toHaveLength(1);
    expect(events[0].ev).toEqual({ kind: 'point', plant: plants[1] });
    expect(events[0].t).toBeGreaterThan(TUNING.dumbo.pointAfter - 3 * DT);
  });

  test('spins instead when every plant is lit', () => {
    const d = found();
    const squid: SquidInfo = { pos: { x: 1, y: 0 }, vel: { x: 0, y: 0 }, facing: 1 };
    let ev = null;
    const allLit = plants.map((p) => ({ ...p, lit: true }));
    for (let t = 0; t < 3 && !ev; t += DT) ev = d.update(DT, squid, allLit);
    expect(ev).toEqual({ kind: 'spin' });
  });

  test('in Twilight, points at the nearest unlit lantern rather than a plant back home', () => {
    const d = found({ x: 20, y: 80 });
    const squid: SquidInfo = { pos: { x: 20, y: 80 }, vel: { x: 0, y: 0 }, facing: 1 };
    // Unlit plants down in home, one lit and one unlit lantern up in Twilight.
    const things: PlantInfo[] = [
      ...plants,
      { id: 'lantern-0', x: 22, y: 81, lit: true },
      { id: 'lantern-1', x: 14, y: 86, lit: false },
    ];
    let ev: DumboEvent = null;
    for (let t = 0; t < TUNING.dumbo.pointAfter + 1 && !ev; t += DT) ev = d.update(DT, squid, things);
    expect(ev).toEqual({ kind: 'point', plant: things[4] });
  });

  test('follows behind the squid at a short distance', () => {
    const d = found();
    const squid: SquidInfo = { pos: { x: 0, y: 0 }, vel: { x: TUNING.squid.topSpeed, y: 0 }, facing: 1 };
    for (let t = 0; t < 6; t += DT) {
      squid.pos.x += squid.vel.x * DT;
      d.update(DT, squid, plants);
    }
    const gap = squid.pos.x - d.pos.x;
    expect(gap).toBeGreaterThan(0.5); // behind, not in front
    expect(Math.hypot(squid.pos.x - d.pos.x, squid.pos.y - d.pos.y)).toBeLessThan(TUNING.dumbo.catchUpDistance);
  });

  test('catches up within a few seconds when left far behind', () => {
    const d = found();
    const squid: SquidInfo = { pos: { x: 25, y: 4 }, vel: { x: 0, y: 0 }, facing: 1 };
    let t = 0;
    while (t < 10) {
      d.update(DT, { ...squid, vel: { x: 1, y: 0 } }, plants); // moving, so no pointing
      t += DT;
      if (Math.hypot(squid.pos.x - d.pos.x, squid.pos.y - d.pos.y) < TUNING.dumbo.followDistance + 1) break;
    }
    expect(t).toBeLessThan(4);
  });

  test('never sinks into the seabed', () => {
    const d = new DumboBrain({ x: 0, y: 2 }, () => 1);
    d.discover();
    const squid: SquidInfo = { pos: { x: 0, y: -5 }, vel: { x: 1, y: 0 }, facing: 1 };
    for (let t = 0; t < 5; t += DT) d.update(DT, squid, plants);
    expect(d.pos.y).toBeGreaterThanOrEqual(1.5);
  });

  describe('gathering while the squid rests', () => {
    const still: SquidInfo = { pos: { x: 0, y: 5 }, vel: { x: 0, y: 0 }, facing: 1 };
    /** Runs dumbo with the squid still; sparkles it gathers are removed. */
    function rest(d: DumboBrain, sparkles: SparkleInfo[], seconds: number, squid = still) {
      const events: { t: number; ev: DumboEvent }[] = [];
      for (let t = 0; t < seconds; t += DT) {
        const ev = d.update(DT, squid, plants, sparkles);
        if (ev) events.push({ t, ev });
        if (ev?.kind === 'gather') sparkles.splice(sparkles.findIndex((s) => s.index === ev.index), 1);
      }
      return events;
    }
    const field = (): SparkleInfo[] => [
      { index: 1, x: 3, y: 6 },
      { index: 2, x: -4, y: 4 },
      { index: 3, x: 6, y: 9 },
      { index: 4, x: 1, y: 2 },
    ];

    test('points first, then gathers several sparkles one after another', () => {
      const d = found({ x: -1.8, y: 5.5 });
      const events = rest(d, field(), 12);
      expect(events[0].ev?.kind).toBe('point');
      const gathers = events.filter((e) => e.ev?.kind === 'gather');
      expect(gathers.length).toBeGreaterThanOrEqual(3);
      expect(gathers[0].t).toBeGreaterThan(events[0].t + TUNING.dumbo.gatherAfterPoint - DT);
    });

    test('spins when everything is lit, then gathers', () => {
      const d = found({ x: -1.8, y: 5.5 });
      const events: DumboEvent[] = [];
      const sparkles = field();
      const allLit = plants.map((p) => ({ ...p, lit: true }));
      for (let t = 0; t < 8; t += DT) {
        const ev = d.update(DT, still, allLit, sparkles);
        if (ev) events.push(ev);
      }
      expect(events[0]).toEqual({ kind: 'spin' });
      expect(events.some((e) => e?.kind === 'gather')).toBe(true);
    });

    test('goes for the sparkle nearest to dumbo, and ignores those outside the visible box around the squid', () => {
      const d = found({ x: -1.8, y: 5.5 });
      const far: SparkleInfo = { index: 9, x: TUNING.dumbo.gatherRangeX + 3, y: 5 };
      const high: SparkleInfo = { index: 10, x: 0, y: 5 + TUNING.dumbo.gatherRangeY + 2 };
      const near: SparkleInfo = { index: 7, x: -3, y: 6 };
      const events = rest(d, [far, high, near, { index: 8, x: 5, y: 5 }], 12).filter((e) => e.ev?.kind === 'gather');
      expect(events[0].ev).toEqual({ kind: 'gather', index: 7 });
      expect(events.map((e) => (e.ev as { index: number }).index)).not.toContain(9);
      expect(events.map((e) => (e.ev as { index: number }).index)).not.toContain(10);
    });

    test('with nothing in range it stays near the squid', () => {
      const d = found({ x: -1.8, y: 5.5 });
      const events = rest(d, [{ index: 1, x: 40, y: 5 }], 8);
      expect(events.filter((e) => e.ev?.kind === 'gather')).toHaveLength(0);
      expect(Math.hypot(d.pos.x - still.pos.x, d.pos.y - still.pos.y)).toBeLessThan(TUNING.dumbo.followDistance + 1);
    });

    test('is slower than the squid: at least 2 s between pickups, gather speed under the squid top speed', () => {
      expect(TUNING.dumbo.gatherSpeed).toBeLessThan(TUNING.squid.topSpeed);
      const d = found({ x: -1.8, y: 5.5 });
      const many = Array.from({ length: 20 }, (_, i) => ({ index: i, x: -1.8 + (i % 2) * 0.3, y: 5.5 }));
      const times = rest(d, many, 15).filter((e) => e.ev?.kind === 'gather').map((e) => e.t);
      expect(times.length).toBeGreaterThan(2);
      for (let i = 1; i < times.length; i++) expect(times[i] - times[i - 1]).toBeGreaterThanOrEqual(TUNING.dumbo.gatherInterval - DT);
    });

    test('stops gathering and follows again as soon as the squid moves', () => {
      const d = found({ x: -1.8, y: 5.5 });
      rest(d, field(), 5);
      expect(d.activity).toBe('gather');
      const moving: SquidInfo = { pos: { x: 0, y: 5 }, vel: { x: 3, y: 0 }, facing: 1 };
      const ev = d.update(DT, moving, plants, field());
      expect(ev).toBeNull();
      expect(d.activity).toBe('follow');
      expect(d.target).toBeNull();
      const later = rest(d, field(), 2, moving);
      expect(later.filter((e) => e.ev?.kind === 'gather')).toHaveLength(0);
    });

    test('keeps above the seabed while gathering', () => {
      const d = new DumboBrain({ x: 0, y: 3 }, () => 2);
      d.discover();
      const low = { ...still, pos: { x: 0, y: 3 } };
      for (let t = 0; t <= POP_TIME + DT; t += DT) d.update(DT, low, plants);
      let minY = Infinity;
      for (let t = 0; t < 8; t += DT) {
        d.update(DT, low, plants, [{ index: 1, x: 2, y: 2.1 }]);
        minY = Math.min(minY, d.pos.y);
      }
      expect(minY).toBeGreaterThanOrEqual(2.5);
    });

    test('nothing is gathered before dumbo is found', () => {
      const d = new DumboBrain({ x: 0, y: 5 });
      const events = rest(d, field(), 10);
      expect(events).toHaveLength(0);
    });
  });
});
