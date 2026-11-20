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

  test('a save from before Whale fall keeps everything; its ribs start unlit and the giant squid asleep', () => {
    const s = memory();
    // Exactly what iteration 4 wrote: no rib ids, no giant squid.
    const { corals: _c, cosmetics: _k, ...v1 } = { ...played().toJSON(), version: 1 };
    const old = { version: 1, layout: LAYOUT, zone: 'home', state: v1 };
    s.setItem(SAVE_KEY, JSON.stringify(old));
    const back = loadSave(s)!;
    expect(back.state.toJSON()).toEqual(played().toJSON());
    expect(back.state.isLit('rib-0')).toBe(false);
    expect(back.state.hasFound('giant-squid')).toBe(false);
  });

  test('lit ribs and the woken giant squid are saved, and so is being in Whale fall', () => {
    const s = memory();
    const w = played();
    w.light('rib-0');
    w.light('rib-6');
    w.find('giant-squid');
    w.findStarfish('starfish-whale-fall-2');
    writeSave(s, w, 'whale-fall');
    const back = loadSave(s)!;
    expect(back.zone).toBe('whale-fall');
    expect(back.state.isLit('rib-6')).toBe(true);
    expect(back.state.hasFound('giant-squid')).toBe(true);
    expect(back.state.hasFoundStarfish('starfish-whale-fall-2')).toBe(true);
  });

  test('a version 1 save (from before the reef) keeps everything; corals start in their first colours, only teal is unlocked and worn', () => {
    const s = memory();
    const { corals: _c, cosmetics: _k, ...v1 } = { ...played().toJSON(), version: 1 };
    s.setItem(SAVE_KEY, JSON.stringify({ version: 1, layout: LAYOUT, zone: 'twilight', state: v1 }));
    const back = loadSave(s)!;
    expect(back.zone).toBe('twilight');
    expect(back.state.hasFound('dumbo')).toBe(true);
    expect(back.state.isLit('plant-3')).toBe(true);
    expect(back.state.coralColour('coral-0', 'amber')).toBe('amber');
    expect(back.state.unlockedColours).toEqual(['teal']);
    expect(back.state.glowColour).toBe('teal');
  });

  test('coral colours, unlocked glow colours and the chosen one are saved', () => {
    const s = memory();
    const w = played();
    expect(w.stepCoral('coral-3', 'pink')).toBe('amber');
    w.stepCoral('coral-3', 'pink');
    expect(w.unlockColour('pink')).toBe(true);
    expect(w.unlockColour('pink')).toBe(false);
    expect(w.chooseGlow('pink')).toBe(true);
    expect(w.chooseGlow('sky')).toBe(false);
    writeSave(s, w, 'sunlit-reef');
    const back = loadSave(s)!;
    expect(back.zone).toBe('sunlit-reef');
    expect(back.state.coralColour('coral-3', 'pink')).toBe('lavender');
    expect(back.state.unlockedColours).toEqual(['teal', 'pink']);
    expect(back.state.glowColour).toBe('pink');
  });

  test('a save from an older layout keeps glow colours but drops coral colours', () => {
    const s = memory();
    const w = played();
    w.stepCoral('coral-1', 'sky');
    w.unlockColour('amber');
    w.chooseGlow('amber');
    writeSave(s, w, 'home');
    const d = JSON.parse(s.data.get(SAVE_KEY)!);
    s.data.set(SAVE_KEY, JSON.stringify({ ...d, layout: LAYOUT - 1 }));
    const back = loadSave(s)!;
    expect(back.state.coralColour('coral-1', 'sky')).toBe('sky');
    expect(back.state.glowColour).toBe('amber');
  });

  test('odd cosmetics or coral colours make the save unreadable', () => {
    for (const bad of [{ cosmetics: { unlocked: ['gold'], equipped: { glow: 'gold' } } }, { corals: { 'coral-1': 'teal' } }, { cosmetics: null }]) {
      const s = memory();
      writeSave(s, played(), 'home');
      const d = JSON.parse(s.data.get(SAVE_KEY)!);
      s.data.set(SAVE_KEY, JSON.stringify({ ...d, state: { ...d.state, ...bad } }));
      expect(loadSave(s)).toBeNull();
    }
  });
});
