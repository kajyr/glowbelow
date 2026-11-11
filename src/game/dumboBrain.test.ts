import { describe, expect, test } from 'vitest';
import { DumboBrain, nearestUnlit, POP_TIME, type PlantInfo, type SquidInfo } from './dumboBrain';
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
});
