import { describe, expect, test } from 'vitest';
import { loadVolumes, saveVolumes, VOLUME_KEY } from './settings';
import type { SaveStorage } from './save';

const memory = (): SaveStorage & { data: Map<string, string> } => {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v), removeItem: (k) => void data.delete(k) };
};

describe('volume settings', () => {
  test('default to full and round-trip', () => {
    const s = memory();
    expect(loadVolumes(s)).toEqual({ music: 1, effects: 1 });
    saveVolumes(s, { music: 0.3, effects: 0.8 });
    expect(loadVolumes(s)).toEqual({ music: 0.3, effects: 0.8 });
  });

  test('bad or blocked storage falls back to full volume', () => {
    const s = memory();
    s.data.set(VOLUME_KEY, '{oops');
    expect(loadVolumes(s)).toEqual({ music: 1, effects: 1 });
    s.data.set(VOLUME_KEY, JSON.stringify({ music: 7, effects: 'x' }));
    expect(loadVolumes(s)).toEqual({ music: 1, effects: 1 });
    expect(loadVolumes(null)).toEqual({ music: 1, effects: 1 });
    const blocked: SaveStorage = { getItem: () => { throw new Error('no'); }, setItem: () => { throw new Error('no'); }, removeItem: () => {} };
    expect(() => saveVolumes(blocked, { music: 0.5, effects: 0.5 })).not.toThrow();
  });
});
