import { describe, expect, test } from 'vitest';
import { SurfaceEnding } from './ending';
import { surfacePush } from './shaft';
import { steer, type Body } from './steering';
import { TUNING } from './tuning';

const beam = { x: 20, y: 100 };
const surface = { x0: 0, x1: 60, y: 100 };

describe('the ending in the sunbeam', () => {
  test('swimming up into the sunbeam plays it, once per visit', () => {
    const e = new SurfaceEnding(beam);
    expect(e.update({ x: 20, y: 90 })).toBe(false);
    expect(e.update({ x: 20, y: 99 })).toBe(true);
    // Still up there, or bumping up again right after: not again.
    expect(e.update({ x: 20, y: 99.2 })).toBe(false);
    expect(e.update({ x: 20, y: 97 })).toBe(false);
    expect(e.update({ x: 20, y: 99 })).toBe(false);
  });

  test('bumping the surface anywhere else does nothing', () => {
    const e = new SurfaceEnding(beam);
    for (const x of [2, 10, 17, 23.5, 40, 58]) expect(e.update({ x, y: 99.5 })).toBe(false);
  });

  test('plays again after the squid has swum well away and come back', () => {
    const e = new SurfaceEnding(beam);
    e.update({ x: 20, y: 99 });
    e.update({ x: 20 + TUNING.ending.rearm + 1, y: 99 });
    expect(e.update({ x: 20, y: 99 })).toBe(true);
  });

  test('swimming up against the surface\'s soft push gets into the sunbeam', () => {
    const e = new SurfaceEnding(beam);
    const b: Body = { pos: { x: 20, y: 92 }, vel: { x: 0, y: 0 } };
    let reached = false;
    for (let t = 0; t < 5 && !reached; t += 1 / 60) {
      steer(b, { kind: 'direction', x: 0, y: 1 }, 1 / 60);
      surfacePush(b, surface, 1 / 60);
      reached = e.update(b.pos);
    }
    expect(reached).toBe(true);
  });
});
