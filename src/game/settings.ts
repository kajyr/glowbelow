import type { SaveStorage } from './save';

/** Volume settings: remembered on the device apart from progress, so a reset keeps them. */
export const VOLUME_KEY = 'glowbelow.volume';

export interface Volumes {
  music: number;
  effects: number;
}

const clamp = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : null);

export function loadVolumes(storage: SaveStorage | null): Volumes {
  try {
    const d = JSON.parse(storage?.getItem(VOLUME_KEY) ?? 'null');
    return { music: clamp(d?.music) ?? 1, effects: clamp(d?.effects) ?? 1 };
  } catch {
    return { music: 1, effects: 1 };
  }
}

export function saveVolumes(storage: SaveStorage | null, v: Volumes): void {
  try {
    storage?.setItem(VOLUME_KEY, JSON.stringify(v));
  } catch {
    // Storage refused: the volume just won't be remembered.
  }
}
