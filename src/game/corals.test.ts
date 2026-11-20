import { describe, expect, test } from 'vitest';
import { CoralTouch, type Coral } from './corals';

const coral = (id: string, x: number): Coral => ({ id, circles: [{ x, y: 0.5, r: 0.5 }], first: 'pink', top: { x, y: 1 } });

describe('touching corals', () => {
  test('swimming into a coral touches it once, until the squid swims clear', () => {
    const t = new CoralTouch([coral('a', 0), coral('b', 3)]);
    expect(t.update({ x: -3, y: 0.6 }, 0.55)).toEqual([]);
    expect(t.update({ x: -0.9, y: 0.6 }, 0.55)).toEqual(['a']);
    expect(t.update({ x: -0.5, y: 0.6 }, 0.55)).toEqual([]);
    expect(t.update({ x: 0, y: 0.6 }, 0.55)).toEqual([]);
    // Just past the edge: not clear yet.
    expect(t.update({ x: 1.2, y: 0.6 }, 0.55)).toEqual([]);
    expect(t.update({ x: 0, y: 0.6 }, 0.55)).toEqual([]);
    // Clear, then back: it counts again.
    expect(t.update({ x: 1.9, y: 0.6 }, 0.55)).toEqual([]);
    expect(t.update({ x: 0.5, y: 0.6 }, 0.55)).toEqual(['a']);
  });

  test('swimming along the garden touches each coral in turn', () => {
    const t = new CoralTouch([coral('a', 0), coral('b', 3), coral('c', 6)]);
    const seen: string[] = [];
    for (let x = -2; x <= 8; x += 0.1) seen.push(...t.update({ x, y: 0.8 }, 0.55));
    expect(seen).toEqual(['a', 'b', 'c']);
  });
});
