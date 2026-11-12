import { describe, expect, test } from 'vitest';
import { nearestUnlit, type GlowTarget } from './glowTargets';

// Home plants down low, Twilight lanterns high up, the cave and a friend.
const targets: GlowTarget[] = [
  { id: 'plant-0', kind: 'plant', x: 10, y: 1, r: 0.5 },
  { id: 'plant-1', kind: 'plant', x: 60, y: 2, r: 0.5 },
  { id: 'lantern-0', kind: 'lantern', x: 62, y: 70, r: 0.6 },
  { id: 'lantern-1', kind: 'lantern', x: 50, y: 120, r: 0.6 },
  { id: 'cave', kind: 'cave', x: 61, y: 60, r: 4 },
  { id: 'firefly-0', kind: 'firefly', x: 61, y: 68, r: 1 },
];

describe('glow-reactive things', () => {
  test('picks the nearest unlit plant or lantern, whichever zone it is in', () => {
    const none = () => false;
    expect(nearestUnlit({ x: 12, y: 3 }, targets, none)?.id).toBe('plant-0');
    expect(nearestUnlit({ x: 61, y: 66 }, targets, none)?.id).toBe('lantern-0'); // in Twilight: a lantern
    expect(nearestUnlit({ x: 61, y: 8 }, targets, none)?.id).toBe('plant-1');
  });

  test('ignores lit things, the cave and friends', () => {
    const lit = new Set(['lantern-0']);
    expect(nearestUnlit({ x: 61, y: 66 }, targets, (id) => lit.has(id))?.id).toBe('lantern-1'); // next nearest, 55 away (plant-1 is 64)
    expect(nearestUnlit({ x: 61, y: 61 }, [targets[4], targets[5]], () => false)).toBeNull();
  });

  test('null when everything is lit', () => {
    expect(nearestUnlit({ x: 0, y: 0 }, targets, () => true)).toBeNull();
  });
});
