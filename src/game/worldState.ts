/** Friends that can be found. */
export type FriendName = 'dumbo' | 'nautilus' | 'firefly' | 'cuttlefish' | 'giant-squid';

/** Sea creatures that get an album stamp too, but are not friends. */
export type CreatureName = 'starfish' | 'phantom-jelly' | 'lantern-jelly';

/** Everything with a stamp in the album. */
export type StampName = FriendName | CreatureName;

export const STAMP_NAMES: StampName[] = ['dumbo', 'nautilus', 'firefly', 'cuttlefish', 'giant-squid', 'starfish', 'phantom-jelly', 'lantern-jelly'];

/** The serialisable form, saved as it is in iteration 3. */
export interface WorldStateData {
  version: 1;
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

  toJSON(): WorldStateData {
    return { version: 1, seed: this.seed, lit: [...this.lit].sort(), found: [...this.found].sort(), swarm: [...this.swarm].sort(), dash: this.dash, starfish: [...this.starfish].sort(), viewed: [...this.viewed].sort() };
  }

  static fromJSON(data: WorldStateData): WorldState {
    const w = new WorldState(data.seed);
    data.lit.forEach((id) => w.lit.add(id));
    data.found.forEach((f) => w.found.add(f));
    data.swarm.forEach((g) => w.swarm.add(g));
    w.dash = data.dash;
    data.starfish.forEach((s) => w.starfish.add(s));
    (data.viewed ?? []).forEach((f) => w.viewed.add(f));
    return w;
  }
}
