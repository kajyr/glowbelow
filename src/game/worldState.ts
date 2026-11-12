/** Friends that can be found. */
export type FriendName = 'dumbo' | 'nautilus' | 'firefly';

/** The serialisable form, saved as it is in iteration 3. */
export interface WorldStateData {
  version: 1;
  seed: number;
  /** Ids of lit glow-reactive things (plants, lanterns). */
  lit: string[];
  found: FriendName[];
  /** Ids of firefly groups that joined the swarm. */
  swarm: string[];
  /** Dash is unlocked (the first time the squid reaches Twilight). */
  dash: boolean;
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
  private readonly found = new Set<FriendName>();
  private readonly swarm = new Set<string>();
  private dash = false;

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
    return true;
  }

  /** How many of these ids are lit. */
  litCount(ids: string[]): number {
    return ids.filter((id) => this.lit.has(id)).length;
  }

  hasFound(friend: FriendName): boolean {
    return this.found.has(friend);
  }

  /** Marks a friend as found. Returns true the first time only. */
  find(friend: FriendName): boolean {
    if (this.found.has(friend)) return false;
    this.found.add(friend);
    return true;
  }

  /** A firefly group joins the swarm. Returns true the first time only. */
  join(group: string): boolean {
    if (this.swarm.has(group)) return false;
    this.swarm.add(group);
    return true;
  }

  get swarmSize(): number {
    return this.swarm.size;
  }

  hasJoined(group: string): boolean {
    return this.swarm.has(group);
  }

  get dashUnlocked(): boolean {
    return this.dash;
  }

  /** Unlocks dash. Returns true the first time only. */
  unlockDash(): boolean {
    if (this.dash) return false;
    this.dash = true;
    return true;
  }

  toJSON(): WorldStateData {
    return { version: 1, seed: this.seed, lit: [...this.lit].sort(), found: [...this.found].sort(), swarm: [...this.swarm].sort(), dash: this.dash };
  }

  static fromJSON(data: WorldStateData): WorldState {
    const w = new WorldState(data.seed);
    data.lit.forEach((id) => w.lit.add(id));
    data.found.forEach((f) => w.found.add(f));
    data.swarm.forEach((g) => w.swarm.add(g));
    w.dash = data.dash;
    return w;
  }
}
