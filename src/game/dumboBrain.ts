import { Follower } from './follower';
import { TUNING } from './tuning';
import type { Vec2 } from './vec';

export interface PlantInfo {
  id: string;
  x: number;
  y: number;
  lit: boolean;
}

export interface SquidInfo {
  pos: Vec2;
  vel: Vec2;
  /** 1 facing right, -1 facing left. */
  facing: number;
}

/** A drifting sparkle dumbo may gather. */
export interface SparkleInfo {
  index: number;
  x: number;
  y: number;
}

export type DumboEvent =
  | { kind: 'point'; plant: PlantInfo }
  | { kind: 'spin' }
  /** Dumbo reached this sparkle and gathers it for the squid. */
  | { kind: 'gather'; index: number }
  | null;

/** While found: following the squid, or gathering sparkles while it rests. */
export type DumboActivity = 'follow' | 'gather';

export type DumboState = 'hidden' | 'popping' | 'following';

/** How long the pop-out and happy spin take after discovery. */
export const POP_TIME = 1.4;

/**
 * Dumbo's behaviour: hidden in the cave until found, then follows the squid
 * at a short distance (catching up fast when left behind), and when the
 * squid stops for a moment points at the nearest unlit plant — or spins
 * happily when every plant is lit. If the squid keeps resting, dumbo then
 * gathers drifting sparkles near the squid for it, until the squid moves.
 * Its swimming is the shared follower behaviour: it ignores walls so it can
 * never get stuck, and only keeps above the seabed.
 */
export class DumboBrain {
  state: DumboState = 'hidden';
  private readonly body: Follower;
  /** Time since the pop-out started. */
  popTime = 0;
  /** Plant being pointed at, if any. */
  pointing: PlantInfo | null = null;
  activity: DumboActivity = 'follow';
  /** Sparkle dumbo is swimming to, if any. */
  target: SparkleInfo | null = null;
  private stillTime = 0;
  private reacted = false;
  private pause = 0;
  private sinceGather = Infinity;

  constructor(home: Vec2, floor: (x: number) => number = () => -Infinity) {
    this.body = new Follower(home, floor);
  }

  get pos(): Vec2 {
    return this.body.pos;
  }

  get vel(): Vec2 {
    return this.body.vel;
  }

  /** 1 facing right, -1 facing left. */
  get facing(): number {
    return this.body.facing;
  }

  /** Called when a pulse reaches the cave. Returns true the first time only. */
  discover(): boolean {
    if (this.state !== 'hidden') return false;
    this.state = 'popping';
    this.popTime = 0;
    return true;
  }

  /** `sparkles` are the drifting sparkles dumbo may gather (never trail ones). */
  update(dt: number, squid: SquidInfo, plants: PlantInfo[], sparkles: SparkleInfo[] = []): DumboEvent {
    if (this.state === 'hidden') return null;
    if (this.state === 'popping') {
      this.popTime += dt;
      this.pos.y += 0.8 * dt; // float up out of the cave
      if (this.popTime >= POP_TIME) this.state = 'following';
      return null;
    }

    const event = this.watchStillness(dt, squid, plants);
    if (this.activity === 'gather') return this.gather(dt, squid, sparkles) ?? event;
    this.follow(dt, squid);
    return event;
  }

  /** The spot dumbo swims to: just behind and a little above the squid. */
  followPoint(squid: SquidInfo): Vec2 {
    const D = TUNING.dumbo;
    return { x: squid.pos.x - squid.facing * D.followDistance, y: squid.pos.y + 0.5 };
  }

  private follow(dt: number, squid: SquidInfo) {
    this.body.follow(dt, this.followPoint(squid), squid.pos, TUNING.dumbo);
  }

  private swimTo(target: Vec2, top: number, rate: number, dt: number) {
    this.body.swimTo(target, top, rate, dt);
  }

  /**
   * Gathering: swim to the drifting sparkle nearest to dumbo among those
   * in the visible box around the squid, pick it up, pause for a bounce, repeat.
   * Hovers at the follow point when nothing is in range.
   */
  private gather(dt: number, squid: SquidInfo, sparkles: SparkleInfo[]): DumboEvent {
    const D = TUNING.dumbo;
    this.sinceGather += dt;
    this.pause = Math.max(0, this.pause - dt);
    let best: SparkleInfo | null = null;
    let bestD = Infinity;
    for (const s of sparkles) {
      if (Math.abs(s.x - squid.pos.x) > D.gatherRangeX || Math.abs(s.y - squid.pos.y) > D.gatherRangeY) continue;
      const d = Math.hypot(s.x - this.pos.x, s.y - this.pos.y);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    this.target = best;
    if (!best || this.pause > 0) {
      this.swimTo(best && this.pause > 0 ? this.pos : this.followPoint(squid), D.speed, 3, dt);
      return null;
    }
    this.swimTo(best, D.gatherSpeed, 3, dt);
    if (Math.hypot(best.x - this.pos.x, best.y - this.pos.y) <= D.gatherReach && this.sinceGather >= D.gatherInterval) {
      this.sinceGather = 0;
      this.pause = D.gatherPause;
      this.target = null;
      return { kind: 'gather', index: best.index };
    }
    return null;
  }

  private watchStillness(dt: number, squid: SquidInfo, plants: PlantInfo[]): DumboEvent {
    const D = TUNING.dumbo;
    if (Math.hypot(squid.vel.x, squid.vel.y) > D.stillSpeed) {
      this.stillTime = 0;
      this.reacted = false;
      this.pointing = null;
      this.activity = 'follow';
      this.target = null;
      return null;
    }
    this.stillTime += dt;
    if (this.reacted && this.activity === 'follow' && this.stillTime >= D.pointAfter + D.gatherAfterPoint) {
      this.activity = 'gather';
      this.pointing = null;
    }
    if (this.reacted || this.stillTime < D.pointAfter) return null;
    this.reacted = true;
    const plant = nearestUnlit(squid.pos, plants);
    if (!plant) return { kind: 'spin' };
    this.pointing = plant;
    this.body.facing = Math.sign(plant.x - this.pos.x) || this.body.facing;
    return { kind: 'point', plant };
  }
}

export function nearestUnlit(from: Vec2, plants: PlantInfo[]): PlantInfo | null {
  let best: PlantInfo | null = null;
  let bestD = Infinity;
  for (const p of plants) {
    if (p.lit) continue;
    const d = Math.hypot(p.x - from.x, p.y - from.y);
    if (d < bestD) {
      bestD = d;
      best = p;
    }
  }
  return best;
}
