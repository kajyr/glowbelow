import { describe, expect, test } from 'vitest';
import { generateWorld } from './assembleWorld';
import { worldIds } from './ids';

describe('saved ids', () => {
  test('are unique within a world', () => {
    for (const seed of [1, 7, 42, 2024, 99991]) {
      const ids = worldIds(generateWorld(seed));
      expect(ids.length).toBeGreaterThan(30);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  test('are the same, on the same things, every time a seed is generated', () => {
    for (const seed of [3, 7, 1234]) {
      const a = generateWorld(seed);
      const b = generateWorld(seed);
      expect(worldIds(b)).toEqual(worldIds(a));
      // Same id, same place: what a save points at is still there.
      expect(b.level.plants).toEqual(a.level.plants);
      expect(b.level.lanterns).toEqual(a.level.lanterns);
      expect(b.level.fireflyGroups).toEqual(a.level.fireflyGroups);
      expect(b.level.starfish).toEqual(a.level.starfish);
    }
  });
});
