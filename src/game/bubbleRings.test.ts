import { describe, expect, test } from 'vitest';
import { BubbleRings, type RingEvent } from './bubbleRings';
import type { Body } from './steering';
import { TUNING } from './tuning';

const DT = 1 / 60;
const chain = { rings: [0, 3.2, 6.4, 9.6, 12.8].map((x) => ({ x, y: 0 })), dir: { x: 1, y: 0 } };

/** Swims straight at `speed` from `fromX` to `toX` along y = 0, collecting events. */
function swim(rings: BubbleRings, fromX: number, toX: number, speed = 4): RingEvent[] {
  const b: Body = { pos: { x: fromX, y: 0 }, vel: { x: Math.sign(toX - fromX) * speed, y: 0 } };
  const out: RingEvent[] = [];
  while (Math.sign(toX - fromX) * (toX - b.pos.x) > 0) {
    out.push(...rings.update(DT, b));
    // Keep a steady speed (steering would ease the push back).
    b.vel.x = Math.sign(toX - fromX) * speed;
    b.pos.x += b.vel.x * DT;
  }
  return out;
}

describe('bubble rings', () => {
  test('a whole chain in order plays a rising run of notes, then a flourish', () => {
    const ev = swim(new BubbleRings([chain]), -2, 15);
    expect(ev.filter((e) => e.kind === 'ring').map((e) => (e.kind === 'ring' ? e.step : -1))).toEqual([0, 1, 2, 3, 4]);
    expect(ev[ev.length - 1]).toEqual({ kind: 'flourish', chain: 0 });
  });

  test('works the other way along the chain too', () => {
    const ev = swim(new BubbleRings([chain]), 15, -2);
    expect(ev.filter((e) => e.kind === 'ring').map((e) => (e.kind === 'ring' ? e.ring : -1))).toEqual([4, 3, 2, 1, 0]);
    expect(ev.some((e) => e.kind === 'flourish')).toBe(true);
  });

  test('skipping a ring starts the run again, with no flourish', () => {
    const rings = new BubbleRings([chain]);
    swim(rings, -2, 1.5); // ring 0
    for (let t = 0; t < 0.5; t += DT) rings.update(DT, { pos: { x: 50, y: 50 }, vel: { x: 0, y: 0 } });
    const ev = swim(rings, 5, 7); // jumps to ring 2
    expect(ev).toEqual([{ kind: 'ring', chain: 0, ring: 2, step: 0 }]);
  });

  test('passing through gives a short push along the swim', () => {
    const rings = new BubbleRings([chain]);
    const b: Body = { pos: { x: 0, y: 0 }, vel: { x: 0, y: 3 } };
    rings.update(DT, b);
    expect(b.vel.x).toBe(0);
    expect(b.vel.y).toBeCloseTo(3 + TUNING.rings.push);
  });

  test('a popped ring cannot be passed again until it grows back, within 5 s', () => {
    const rings = new BubbleRings([chain]);
    const at: Body = { pos: { x: 0, y: 0 }, vel: { x: 1, y: 0 } };
    expect(rings.update(DT, at)).toHaveLength(1);
    expect(rings.whole(0, 0)).toBeLessThan(0.05);
    expect(rings.update(DT, at)).toHaveLength(0);
    let t = 0;
    while (rings.whole(0, 0) < 1 && t < 10) {
      rings.update(DT, { pos: { x: 50, y: 50 }, vel: { x: 0, y: 0 } });
      t += DT;
    }
    expect(t).toBeLessThan(5);
    expect(rings.update(DT, at)).toHaveLength(1);
  });

  test('a slow pause between rings ends the run', () => {
    const rings = new BubbleRings([chain]);
    swim(rings, -2, 1.5);
    for (let t = 0; t < TUNING.rings.chainGap + 0.2; t += DT) rings.update(DT, { pos: { x: 50, y: 50 }, vel: { x: 0, y: 0 } });
    const ev = swim(rings, 2, 4);
    expect(ev).toEqual([{ kind: 'ring', chain: 0, ring: 1, step: 0 }]);
  });
});
