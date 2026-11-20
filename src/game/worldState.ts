import { CORAL_COLOURS, isCoralColour, isGlowColour, nextColour, type CoralColour, type GlowColour } from './colours';

/** Friends that can be found. */
export type FriendName = 'dumbo' | 'nautilus' | 'firefly' | 'cuttlefish' | 'giant-squid';

/** Sea creatures that get an album stamp too, but are not friends. */
export type CreatureName = 'starfish' | 'phantom-jelly' | 'lantern-jelly';

/** Everything with a stamp in the album. */
export type StampName = FriendName | CreatureName;

export const STAMP_NAMES: StampName[] = ['dumbo', 'nautilus', 'firefly', 'cuttlefish', 'giant-squid', 'starfish', 'phantom-jelly', 'lantern-jelly'];

/** Unlockable looks for the squid. Future slots (hat, fins) become more keys under `equipped`. */
export interface Cosmetics {
  unlocked: GlowColour[];
  equipped: { glow: GlowColour };
}

/** A new game's looks: the teal glow, unlocked and worn. */
export const DEFAULT_COSMETICS: Cosmetics = { unlocked: ['teal'], equipped: { glow: 'teal' } };

/** The serialisable form (version 2 from iteration 6: coral colours and cosmetics). */
export interface WorldStateData {
  version: 2;
  seed: number;
  /** Ids of lit glow-reactive things (plants, lanterns). */
  lit: string[];
  /** Friends found, and creatures met (each has an album stamp). */
  found: StampName[];
  /** Ids of firefly groups that joined the swarm. */
  swarm: string[];
  /** Dash is unlocked (the first time the squid reaches Twilight). */
  dash: boolean;
  /** Ids of starfish found. */
  starfish: string[];
  /** Stamps that have been seen in the album (for the new-sticker badge). */
  viewed: StampName[];
  /** The colour of each coral touched in the Sunlit reef, by id; the rest keep their first colour. */
  corals: Record<string, CoralColour>;
  cosmetics: Cosmetics;
  /** The journey was completed (the sunbeam at the top): the album shows the completed stamp. */
  completed?: boolean;
}

/** Checks the shape of saved cosmetics. */
export function validCosmetics(c: unknown): c is Cosmetics {
  if (!c || typeof c !== 'object') return false;
  const d = c as Record<string, unknown>;
  const eq = d.equipped as Record<string, unknown> | undefined;
  return Array.isArray(d.unlocked) && d.unlocked.every(isGlowColour) && !!eq && typeof eq === 'object' && isGlowColour(eq.glow);
}

/** Checks the shape of saved coral colours. */
export function validCorals(c: unknown): c is Record<string, CoralColour> {
  return !!c && typeof c === 'object' && !Array.isArray(c) && Object.values(c).every(isCoralColour);
}

/**
 * Everything about the world that changes as the player plays: what is lit,
 * which friends were found, which firefly groups joined. Views and friends
 * read from it; it is the one thing a save needs, together with the seed
 * that regenerates the same world.
 */
export class WorldState {
  readonly seed: number;
  private readonly lit = new Set<string>();
  private readonly found = new Set<StampName>();
  private readonly swarm = new Set<string>();
  private dash = false;
  private readonly starfish = new Set<string>();
  private readonly viewed = new Set<StampName>();
  private readonly corals = new Map<string, CoralColour>();
  private readonly unlocked = new Set<GlowColour>(DEFAULT_COSMETICS.unlocked);
  private glow: GlowColour = DEFAULT_COSMETICS.equipped.glow;
  private done = false;
  /** Called after anything changes (the save listens). */
  onChange: () => void = () => {};

  constructor(seed: number) {
    this.seed = seed;
  }

  isLit(id: string): boolean {
    return this.lit.has(id);
  }

  /** Lights a thing. Returns true if it was not lit before. */
  light(id: string): boolean {
    if (this.lit.has(id)) return false;
    this.lit.add(id);
    this.onChange();
    return true;
  }

  /** How many of these ids are lit. */
  litCount(ids: string[]): number {
    return ids.filter((id) => this.lit.has(id)).length;
  }

  hasFound(friend: StampName): boolean {
    return this.found.has(friend);
  }

  /** Marks a friend as found (or a creature as met). Returns true the first time only. */
  find(friend: StampName): boolean {
    if (this.found.has(friend)) return false;
    this.found.add(friend);
    this.onChange();
    return true;
  }

  /** A firefly group joins the swarm. Returns true the first time only. */
  join(group: string): boolean {
    if (this.swarm.has(group)) return false;
    this.swarm.add(group);
    this.onChange();
    return true;
  }

  get swarmSize(): number {
    return this.swarm.size;
  }

  hasJoined(group: string): boolean {
    return this.swarm.has(group);
  }

  hasFoundStarfish(id: string): boolean {
    return this.starfish.has(id);
  }

  /** A starfish is found. Returns true the first time only. */
  findStarfish(id: string): boolean {
    if (this.starfish.has(id)) return false;
    this.starfish.add(id);
    this.onChange();
    return true;
  }

  /** How many of these starfish ids are found. */
  starfishCount(ids: string[]): number {
    return ids.filter((id) => this.starfish.has(id)).length;
  }

  /** Marks a stamp as seen in the album. Returns true the first time only. */
  view(friend: StampName): boolean {
    if (this.viewed.has(friend)) return false;
    this.viewed.add(friend);
    this.onChange();
    return true;
  }

  /** Found stamps not seen in the album yet. */
  get unviewed(): StampName[] {
    return [...this.found].filter((f) => !this.viewed.has(f));
  }

  get dashUnlocked(): boolean {
    return this.dash;
  }

  /** Unlocks dash. Returns true the first time only. */
  unlockDash(): boolean {
    if (this.dash) return false;
    this.dash = true;
    this.onChange();
    return true;
  }

  /** A coral's colour: as last touched, or `first` (its colour in a new world). */
  coralColour(id: string, first: CoralColour): CoralColour {
    return this.corals.get(id) ?? first;
  }

  /** Steps a coral to the next colour in the cycle and returns it. */
  stepCoral(id: string, first: CoralColour): CoralColour {
    const c = nextColour(this.coralColour(id, first));
    this.corals.set(id, c);
    this.onChange();
    return c;
  }

  get completed(): boolean {
    return this.done;
  }

  /** The journey is completed (the album gets its stamp). Returns true the first time only. */
  complete(): boolean {
    if (this.done) return false;
    this.done = true;
    this.onChange();
    return true;
  }

  get glowColour(): GlowColour {
    return this.glow;
  }

  get unlockedColours(): GlowColour[] {
    return [...this.unlocked];
  }

  isUnlocked(c: GlowColour): boolean {
    return this.unlocked.has(c);
  }

  /** Unlocks a glow colour (forever). Returns true the first time only. */
  unlockColour(c: GlowColour): boolean {
    if (this.unlocked.has(c)) return false;
    this.unlocked.add(c);
    this.onChange();
    return true;
  }

  /** Wears an unlocked glow colour. Returns false for a locked one. */
  chooseGlow(c: GlowColour): boolean {
    if (!this.unlocked.has(c)) return false;
    if (c !== this.glow) {
      this.glow = c;
      this.onChange();
    }
    return true;
  }

  toJSON(): WorldStateData {
    const corals = Object.fromEntries([...this.corals].sort(([a], [b]) => a.localeCompare(b)));
    // Unlocked colours in the cycle's order, so a save reads the same however they were found.
    const unlocked = (['teal', ...CORAL_COLOURS] as GlowColour[]).filter((c) => this.unlocked.has(c));
    return {
      version: 2,
      seed: this.seed,
      lit: [...this.lit].sort(),
      found: [...this.found].sort(),
      swarm: [...this.swarm].sort(),
      dash: this.dash,
      starfish: [...this.starfish].sort(),
      viewed: [...this.viewed].sort(),
      corals,
      cosmetics: { unlocked, equipped: { glow: this.glow } },
      ...(this.done ? { completed: true } : {}),
    };
  }

  static fromJSON(data: WorldStateData): WorldState {
    const w = new WorldState(data.seed);
    data.lit.forEach((id) => w.lit.add(id));
    data.found.forEach((f) => w.found.add(f));
    data.swarm.forEach((g) => w.swarm.add(g));
    w.dash = data.dash;
    data.starfish.forEach((s) => w.starfish.add(s));
    (data.viewed ?? []).forEach((f) => w.viewed.add(f));
    Object.entries(data.corals ?? {}).forEach(([id, c]) => w.corals.set(id, c));
    const cos = data.cosmetics ?? DEFAULT_COSMETICS;
    cos.unlocked.forEach((c) => w.unlocked.add(c));
    w.glow = w.unlocked.has(cos.equipped.glow) ? cos.equipped.glow : 'teal';
    w.done = data.completed === true;
    return w;
  }
}
