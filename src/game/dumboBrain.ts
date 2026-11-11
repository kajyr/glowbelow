import { TUNING } from './tuning';
import { ease, type Vec2 } from './vec';

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

export type DumboEvent = { kind: 'point'; plant: PlantInfo } | { kind: 'spin' } | null;

export type DumboState = 'hidden' | 'popping' | 'following';

/** How long the pop-out and happy spin take after discovery. */
export const POP_TIME = 1.4;

/**
 * Dumbo's behaviour: hidden in the cave until found, then follows the squid
 * at a short distance (catching up fast when left behind), and when the
 * squid stops for a moment points at the nearest unlit plant — or spins
 * happily when every plant is lit. Dumbo ignores walls so it can never get
 * stuck; it only keeps above the seabed.
 */
export class DumboBrain {
  state: DumboState = 'hidden';
  pos: Vec2;
  vel: Vec2 = { x: 0, y: 0 };
  facing = 1;
  /** Time since the pop-out started. */
  popTime = 0;
  /** Plant being pointed at, if any. */
  pointing: PlantInfo | null = null;
  private stillTime = 0;
  private reacted = false;

  constructor(
    home: Vec2,
    private readonly floor: (x: number) => number = () => -Infinity,
  ) {
    this.pos = { ...home };
  }

  /** Called when a pulse reaches the cave. Returns true the first time only. */
  discover(): boolean {
    if (this.state !== 'hidden') return false;
    this.state = 'popping';
    this.popTime = 0;
    return true;
  }

  update(dt: number, squid: SquidInfo, plants: PlantInfo[]): DumboEvent {
    if (this.state === 'hidden') return null;
    if (this.state === 'popping') {
      this.popTime += dt;
      this.pos.y += 0.8 * dt; // float up out of the cave
      if (this.popTime >= POP_TIME) this.state = 'following';
      return null;
    }

    this.follow(dt, squid);
    return this.watchStillness(dt, squid, plants);
  }

  /** The spot dumbo swims to: just behind and a little above the squid. */
  followPoint(squid: SquidInfo): Vec2 {
    const D = TUNING.dumbo;
    return { x: squid.pos.x - squid.facing * D.followDistance, y: squid.pos.y + 0.5 };
  }

  private follow(dt: number, squid: SquidInfo) {
    const D = TUNING.dumbo;
    const target = this.followPoint(squid);
    const dx = target.x - this.pos.x;
    const dy = target.y - this.pos.y;
    const d = Math.hypot(dx, dy);
    const far = Math.hypot(squid.pos.x - this.pos.x, squid.pos.y - this.pos.y) > D.catchUpDistance;
    const top = far ? D.catchUpSpeed : D.speed;
    const speed = Math.min(top, d * 2.2);
    const want = d > 1e-6 ? { x: (dx / d) * speed, y: (dy / d) * speed } : { x: 0, y: 0 };
    const k = ease(far ? 5 : 3, dt);
    this.vel.x += (want.x - this.vel.x) * k;
    this.vel.y += (want.y - this.vel.y) * k;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    const low = this.floor(this.pos.x) + 0.5;
    if (this.pos.y < low) this.pos.y = low;
    if (Math.abs(this.vel.x) > 0.3) this.facing = Math.sign(this.vel.x);
  }

  private watchStillness(dt: number, squid: SquidInfo, plants: PlantInfo[]): DumboEvent {
    const D = TUNING.dumbo;
    if (Math.hypot(squid.vel.x, squid.vel.y) > D.stillSpeed) {
      this.stillTime = 0;
      this.reacted = false;
      this.pointing = null;
      return null;
    }
    this.stillTime += dt;
    if (this.reacted || this.stillTime < D.pointAfter) return null;
    this.reacted = true;
    const plant = nearestUnlit(squid.pos, plants);
    if (!plant) return { kind: 'spin' };
    this.pointing = plant;
    this.facing = Math.sign(plant.x - this.pos.x) || this.facing;
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
