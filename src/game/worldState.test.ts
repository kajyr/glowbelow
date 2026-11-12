import { describe, expect, test } from 'vitest';
import { WorldState } from './worldState';

describe('world state', () => {
  test('lighting, finding and joining happen once each', () => {
    const w = new WorldState(42);
    expect(w.light('plant-3')).toBe(true);
    expect(w.light('plant-3')).toBe(false);
    expect(w.isLit('plant-3')).toBe(true);
    expect(w.find('dumbo')).toBe(true);
    expect(w.find('dumbo')).toBe(false);
    expect(w.join('group-1')).toBe(true);
    expect(w.join('group-1')).toBe(false);
    expect(w.swarmSize).toBe(1);
    expect(w.litCount(['plant-1', 'plant-3', 'lantern-2'])).toBe(1);
  });

  test('dash starts locked and unlocks once', () => {
    const w = new WorldState(1);
    expect(w.dashUnlocked).toBe(false);
    expect(w.unlockDash()).toBe(true);
    expect(w.unlockDash()).toBe(false);
    expect(w.dashUnlocked).toBe(true);
  });

  test('survives leaving and coming back: a round trip through its saved form keeps everything', () => {
    const w = new WorldState(7);
    w.light('plant-1');
    w.light('lantern-12');
    w.find('nautilus');
    w.join('group-4');
    w.unlockDash();
    const data = JSON.parse(JSON.stringify(w.toJSON()));
    const back = WorldState.fromJSON(data);
    expect(back.toJSON()).toEqual(w.toJSON());
    expect(back.seed).toBe(7);
    expect(back.isLit('lantern-12')).toBe(true);
    expect(back.hasFound('nautilus')).toBe(true);
    expect(back.hasJoined('group-4')).toBe(true);
    expect(back.dashUnlocked).toBe(true);
  });

  test('creatures get stamps like friends: met once, new until seen in the album', () => {
    const w = new WorldState(5);
    expect(w.find('phantom-jelly')).toBe(true);
    expect(w.find('phantom-jelly')).toBe(false);
    w.find('starfish');
    expect(w.unviewed.sort()).toEqual(['phantom-jelly', 'starfish']);
    w.view('starfish');
    expect(w.unviewed).toEqual(['phantom-jelly']);
    expect(WorldState.fromJSON(w.toJSON()).unviewed).toEqual(['phantom-jelly']);
  });
});

describe('world state changes', () => {
  test('onChange fires once per real change, never for repeats', () => {
    const w = new WorldState(3);
    let n = 0;
    w.onChange = () => n++;
    w.light('plant-1');
    w.light('plant-1');
    w.find('dumbo');
    w.find('dumbo');
    w.join('firefly-0');
    w.unlockDash();
    w.findStarfish('starfish-home-0');
    w.findStarfish('starfish-home-0');
    expect(n).toBe(5);
  });
});
