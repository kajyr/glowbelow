import { describe, expect, test } from 'vitest';
import { ALBUM_STAMPS, gridSize } from './album';
import { STAMP_NAMES } from '../game/worldState';

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
    expect(names).toEqual(['dumbo', 'starfish', 'phantom-jelly', 'firefly', 'lantern-jelly', 'nautilus', 'cuttlefish', 'giant-squid']);
    expect([...names].sort()).toEqual([...STAMP_NAMES].sort());
    expect(gridSize(ALBUM_STAMPS.length)).toEqual({ cols: 4, rows: 2 });
  });
});
