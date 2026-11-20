import { describe, expect, test } from 'vitest';
import { SurfaceEnding } from './ending';
import { TUNING } from './tuning';
import { surfacePush } from './shaft';
import { steer, type Body } from './steering';

const surface = { x0: 0, x1: 60, y: 100 };

describe('the ending at the surface', () => {
  test('plays when the squid reaches the surface, once per visit', () => {
    const e = new SurfaceEnding(surface);
    expect(e.update({ x: 20, y: 90 })).toBe(false);
    expect(e.update({ x: 20, y: 99 })).toBe(true);
    // Still up there, or bumping the surface again right after: not again.
    expect(e.update({ x: 20, y: 99.2 })).toBe(false);
    expect(e.update({ x: 20, y: 97 })).toBe(false);
    expect(e.update({ x: 20, y: 99 })).toBe(false);
  });

  test('plays again after the squid has swum well away and come back', () => {
    const e = new SurfaceEnding(surface);
    e.update({ x: 20, y: 99 });
    e.update({ x: 20, y: 100 - TUNING.ending.rearm - 0.5 });
    expect(e.update({ x: 20, y: 99 })).toBe(true);
  });

  test('only over the reef', () => {
    const e = new SurfaceEnding(surface);
    expect(e.update({ x: -5, y: 99.5 })).toBe(false);
    expect(e.update({ x: 65, y: 99.5 })).toBe(false);
  });
});

test('swimming up against the surface\'s soft push gets close enough to reach it', () => {
  const e = new SurfaceEnding(surface);
  const b: Body = { pos: { x: 20, y: 92 }, vel: { x: 0, y: 0 } };
  let reached = false;
  for (let t = 0; t < 5 && !reached; t += 1 / 60) {
    steer(b, { kind: 'direction', x: 0, y: 1 }, 1 / 60);
    surfacePush(b, surface, 1 / 60);
    reached = e.update(b.pos);
  }
  expect(reached).toBe(true);
});
