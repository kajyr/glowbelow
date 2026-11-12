import { STAMP_NAMES, WorldState, type StampName, type WorldStateData } from './worldState';

/** Where progress lives in the browser. Settings (mute, volumes) have their own keys. */
export const SAVE_KEY = 'glowbelow.save';
/** The save format. */
export const SAVE_VERSION = 1;
/**
 * The world layout this game generates. Bump it whenever a change alters
 * what the generator makes for a seed: older saves then keep friends,
 * starfish and dash, but drop lit things, whose ids may now mean something else.
 */
export const LAYOUT = 2;

/** The part of the browser's storage the save uses (localStorage, or a stub in tests). */
export interface SaveStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface SaveData {
  version: number;
  layout: number;
  /** The zone the squid was last in: a continued game starts at its entry. */
  zone: string;
  state: WorldStateData;
}

export interface Loaded {
  state: WorldState;
  zone: string;
  /** The save came from an older layout: lit things were dropped. */
  relayout: boolean;
}

const strings = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Upgrades from each older save format, by the version it upgrades from. */
const UPGRADES: Record<number, (d: Record<string, unknown>) => Record<string, unknown>> = {};

/** Checks the shape of a save's state; anything odd means the save is unreadable. */
function validState(s: unknown): s is WorldStateData {
  if (!s || typeof s !== 'object') return false;
  const d = s as Record<string, unknown>;
  return (
    d.version === 1 &&
    typeof d.seed === 'number' &&
    Number.isFinite(d.seed) &&
    strings(d.lit) &&
    strings(d.found) &&
    (d.found as string[]).every((f) => STAMP_NAMES.includes(f as StampName)) &&
    strings(d.swarm) &&
    typeof d.dash === 'boolean' &&
    strings(d.starfish) &&
    (d.viewed === undefined || strings(d.viewed))
  );
}

/**
 * Reads the save. Returns null when there is none, it cannot be read, or
 * storage itself fails: the game then simply starts fresh.
 */
export function loadSave(storage: SaveStorage | null): Loaded | null {
  let raw: string | null;
  try {
    raw = storage?.getItem(SAVE_KEY) ?? null;
  } catch {
    return null;
  }
  if (raw === null) return null;
  let d: Record<string, unknown>;
  try {
    d = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!d || typeof d !== 'object' || typeof d.version !== 'number') return null;
  while ((d.version as number) < SAVE_VERSION) {
    const up = UPGRADES[d.version as number];
    if (!up) return null;
    d = up(d);
  }
  if (d.version !== SAVE_VERSION || typeof d.layout !== 'number' || typeof d.zone !== 'string' || !validState(d.state)) return null;
  const relayout = d.layout !== LAYOUT;
  // A different layout keeps what does not depend on where things are.
  const state: WorldStateData = relayout ? { ...d.state, lit: [] } : d.state;
  return { state: WorldState.fromJSON(state), zone: d.zone, relayout };
}

/** Writes the save now. Returns false when storage refused (blocked or full). */
export function writeSave(storage: SaveStorage | null, state: WorldState, zone: string): boolean {
  if (!storage) return false;
  const data: SaveData = { version: SAVE_VERSION, layout: LAYOUT, zone, state: state.toJSON() };
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

/** Erases the saved progress (settings stay). */
export function clearSave(storage: SaveStorage | null): void {
  try {
    storage?.removeItem(SAVE_KEY);
  } catch {
    // Nothing to do: there is no save to keep.
  }
}

/** Whether storage really works here: a test write and read (it can be blocked in a frame). */
export function storageWorks(storage: SaveStorage | null): boolean {
  if (!storage) return false;
  const key = 'glowbelow.test';
  try {
    storage.setItem(key, '1');
    const ok = storage.getItem(key) === '1';
    storage.removeItem(key);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Whether to tell the grown-ups that progress can't be saved here: only
 * inside another site's frame (itch.io) whose storage the browser blocks.
 * Blocked storage on the game's own page (private browsing) just plays on.
 */
export function saveUnavailableHere(framed: boolean, storage: SaveStorage | null): boolean {
  return framed && !storageWorks(storage);
}

/** The browser's localStorage, or null where even touching it throws. */
export function browserStorage(): SaveStorage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Saves at most about once a second: `request` after any change, `tick`
 * every step, `flush` when the page is hidden. Never throws; when storage
 * refuses, the game keeps playing without saving.
 */
export class Saver {
  private pending = false;
  private wait = 0;
  /** False once storage has refused a write. */
  working = true;
  private disabled = false;

  constructor(
    private readonly storage: SaveStorage | null,
    private readonly state: WorldState,
    private zone: () => string,
    private readonly delay = 1,
  ) {}

  request(): void {
    if (!this.pending) this.wait = this.delay;
    this.pending = true;
  }

  tick(dt: number): void {
    if (!this.pending) return;
    this.wait -= dt;
    if (this.wait <= 0) this.flush();
  }

  /** Stops all saving (start over: the erased save must not be written back on the way out). */
  disable(): void {
    this.disabled = true;
    this.pending = false;
  }

  flush(): void {
    if (!this.pending || this.disabled) return;
    this.pending = false;
    this.working = writeSave(this.storage, this.state, this.zone());
  }
}
