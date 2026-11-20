import { describe, expect, test } from 'vitest';
import { ALBUM_STAMPS, colourDots, dotAfter, gridSize } from './album';
import { STAMP_NAMES, WorldState } from '../game/worldState';

describe('album grid', () => {
  test('3 by 2 at least; 4 wide past 6, then a row more for every 4 more', () => {
    expect(gridSize(1)).toEqual({ cols: 3, rows: 2 });
    expect(gridSize(6)).toEqual({ cols: 3, rows: 2 });
    expect(gridSize(7)).toEqual({ cols: 4, rows: 2 });
    expect(gridSize(8)).toEqual({ cols: 4, rows: 2 });
    expect(gridSize(9)).toEqual({ cols: 4, rows: 3 });
  });

  test('has every stamp once, zone by zone, in a 4 by 2 grid today', () => {
    const names = ALBUM_STAMPS.map((f) => f.name);
    expect(names).toEqual(['dumbo', 'starfish', 'phantom-jelly', 'firefly', 'lantern-jelly', 'nautilus', 'giant-squid', 'cuttlefish']);
    expect([...names].sort()).toEqual([...STAMP_NAMES].sort());
    expect(gridSize(ALBUM_STAMPS.length)).toEqual({ cols: 4, rows: 2 });
  });
});

describe('glow colours in the album', () => {
  test('a new game: teal, chosen, then five dark dots', () => {
    const dots = colourDots(new WorldState(1));
    expect(dots.map((d) => d.colour)).toEqual(['teal', 'pink', 'amber', 'lavender', 'coral', 'sky']);
    expect(dots.filter((d) => d.unlocked).map((d) => d.colour)).toEqual(['teal']);
    expect(dots.filter((d) => d.chosen).map((d) => d.colour)).toEqual(['teal']);
  });

  test('an unlocked, chosen colour shows; teal can be chosen again', () => {
    const w = new WorldState(1);
    w.unlockColour('pink');
    w.chooseGlow('pink');
    expect(colourDots(w).find((d) => d.chosen)!.colour).toBe('pink');
    w.chooseGlow('teal');
    expect(colourDots(w).find((d) => d.chosen)!.colour).toBe('teal');
  });

  test('arrows move between the dots in rows of three, never off the edge', () => {
    expect(dotAfter(0, 'ArrowRight')).toBe(1);
    expect(dotAfter(2, 'ArrowRight')).toBe(2);
    expect(dotAfter(3, 'ArrowLeft')).toBe(3);
    expect(dotAfter(1, 'ArrowDown')).toBe(4);
    expect(dotAfter(4, 'ArrowUp')).toBe(1);
    expect(dotAfter(1, 'ArrowUp')).toBe(1);
    expect(dotAfter(5, 'ArrowDown')).toBe(5);
  });
});
