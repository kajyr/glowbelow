import { describe, expect, test } from 'vitest';
import { clearSave, LAYOUT, loadSave, Saver, SAVE_KEY, SAVE_VERSION, saveUnavailableHere, storageWorks, writeSave, type SaveStorage } from './save';
import { WorldState } from './worldState';

/** An in-memory storage; `fail` makes it behave like blocked storage. */
function memory(fail = false): SaveStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => {
      if (fail) throw new Error('blocked');
      return data.get(k) ?? null;
    },
    setItem: (k, v) => {
      if (fail) throw new Error('blocked');
      data.set(k, v);
    },
    removeItem: (k) => {
      if (fail) throw new Error('blocked');
      data.delete(k);
    },
  };
}

function played(): WorldState {
  const w = new WorldState(1234);
  w.light('plant-3');
  w.light('lantern-12');
  w.find('dumbo');
  w.find('nautilus');
  w.join('firefly-2');
  w.unlockDash();
  w.findStarfish('starfish-home-1');
  return w;
}

describe('save', () => {
  test('round trip keeps everything, and the zone', () => {
    const s = memory();
    const w = played();
    expect(writeSave(s, w, 'twilight')).toBe(true);
    const back = loadSave(s)!;
    expect(back.state.toJSON()).toEqual(w.toJSON());
    expect(back.zone).toBe('twilight');
    expect(back.relayout).toBe(false);
  });

  test('no save, or an unreadable one, starts fresh without throwing', () => {
    expect(loadSave(memory())).toBeNull();
    for (const bad of ['{', 'null', '42', '{"version":1}', JSON.stringify({ version: 1, layout: LAYOUT, zone: 'home', state: { version: 1, seed: 'x' } })]) {
      const s = memory();
      s.data.set(SAVE_KEY, bad);
      expect(loadSave(s)).toBeNull();
    }
  });

  test('creature stamps are kept; an unknown stamp name makes the save unreadable', () => {
    const s = memory();
    const w = played();
    w.find('lantern-jelly');
    writeSave(s, w, 'home');
    expect(loadSave(s)!.state.hasFound('lantern-jelly')).toBe(true);
    const d = JSON.parse(s.data.get(SAVE_KEY)!);
    s.data.set(SAVE_KEY, JSON.stringify({ ...d, state: { ...d.state, found: ['dumbo', 'sea-dragon'] } }));
    expect(loadSave(s)).toBeNull();
  });

  test('a save from an unknown future format is ignored', () => {
    const s = memory();
    writeSave(s, played(), 'home');
    const d = JSON.parse(s.data.get(SAVE_KEY)!);
    s.data.set(SAVE_KEY, JSON.stringify({ ...d, version: SAVE_VERSION + 1 }));
    expect(loadSave(s)).toBeNull();
  });

  test('blocked storage: nothing saves, nothing throws, loading starts fresh', () => {
    const s = memory(true);
    expect(storageWorks(s)).toBe(false);
    expect(writeSave(s, played(), 'home')).toBe(false);
    expect(loadSave(s)).toBeNull();
    expect(() => clearSave(s)).not.toThrow();
    const saver = new Saver(s, played(), () => 'home');
    saver.request();
    expect(() => saver.flush()).not.toThrow();
    expect(saver.working).toBe(false);
  });

  test('a save from an older layout keeps friends, swarm, starfish and dash, and drops lit things', () => {
    const s = memory();
    writeSave(s, played(), 'home');
    const d = JSON.parse(s.data.get(SAVE_KEY)!);
    s.data.set(SAVE_KEY, JSON.stringify({ ...d, layout: LAYOUT - 1 }));
    const back = loadSave(s)!;
    expect(back.relayout).toBe(true);
    expect(back.state.hasFound('dumbo')).toBe(true);
    expect(back.state.hasFound('nautilus')).toBe(true);
    expect(back.state.hasJoined('firefly-2')).toBe(true);
    expect(back.state.hasFoundStarfish('starfish-home-1')).toBe(true);
    expect(back.state.dashUnlocked).toBe(true);
    expect(back.state.isLit('plant-3')).toBe(false);
    expect(back.state.isLit('lantern-12')).toBe(false);
    expect(back.state.seed).toBe(1234);
  });

  test('clearing erases progress only', () => {
    const s = memory();
    s.data.set('glowbelow.muted', '1');
    writeSave(s, played(), 'home');
    clearSave(s);
    expect(loadSave(s)).toBeNull();
    expect(s.data.get('glowbelow.muted')).toBe('1');
  });

  test('saver writes about a second after a change, once, and at once on flush', () => {
    const s = memory();
    const w = new WorldState(5);
    const saver = new Saver(s, w, () => 'home', 1);
    w.light('plant-1');
    saver.request();
    saver.tick(0.5);
    w.light('plant-2');
    saver.request();
    expect(s.data.has(SAVE_KEY)).toBe(false);
    saver.tick(0.6);
    expect(loadSave(s)!.state.isLit('plant-2')).toBe(true);
    w.light('plant-9');
    saver.request();
    saver.flush();
    expect(loadSave(s)!.state.isLit('plant-9')).toBe(true);
  });

  test('the cannot-save-here note is only for a frame that blocks storage', () => {
    expect(saveUnavailableHere(true, memory(true))).toBe(true);
    expect(saveUnavailableHere(true, null)).toBe(true);
    expect(saveUnavailableHere(true, memory())).toBe(false);
    // On the game's own page, blocked storage (private browsing) just plays on, no note.
    expect(saveUnavailableHere(false, memory(true))).toBe(false);
  });

  test('a disabled saver writes nothing, even on flush (start over)', () => {
    const s = memory();
    const saver = new Saver(s, played(), () => 'home');
    saver.request();
    saver.disable();
    saver.flush();
    expect(s.data.has(SAVE_KEY)).toBe(false);
  });

  test('storage that works passes the check', () => {
    expect(storageWorks(memory())).toBe(true);
    expect(storageWorks(null)).toBe(false);
  });
});
