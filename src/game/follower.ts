import { ease, type Vec2 } from './vec';

/** How a follower moves. */
export interface FollowerTuning {
  /** Top speed when close to the leader. */
  speed: number;
  /** Top speed when left behind. */
  catchUpSpeed: number;
  /** Further than this from the leader counts as left behind. */
  catchUpDistance: number;
}

/**
 * Something that swims after a leader: it eases toward a spot near the
 * leader, catching up fast when left behind. It ignores walls so it can never
 * get stuck, and only keeps above the seabed. Shared by dumbo and the centre
 * of the firefly swarm.
 */
export class Follower {
  readonly pos: Vec2;
  readonly vel: Vec2 = { x: 0, y: 0 };
  /** 1 facing right, -1 facing left. */
  facing = 1;

  constructor(
    start: Vec2,
    private readonly floor: (x: number) => number = () => -Infinity,
    /** How far above the seabed it keeps. */
    private readonly floorGap = 0.5,
  ) {
    this.pos = { ...start };
  }

  /** Swims toward `spot`, near `leader`; faster when far from the leader. */
  follow(dt: number, spot: Vec2, leader: Vec2, t: FollowerTuning): void {
    const far = Math.hypot(leader.x - this.pos.x, leader.y - this.pos.y) > t.catchUpDistance;
    this.swimTo(spot, far ? t.catchUpSpeed : t.speed, far ? 5 : 3, dt);
  }

  /** Eases toward a point at up to `top` speed; `rate` is how quickly it turns. */
  swimTo(target: Vec2, top: number, rate: number, dt: number): void {
    const dx = target.x - this.pos.x;
    const dy = target.y - this.pos.y;
    const d = Math.hypot(dx, dy);
    const speed = Math.min(top, d * 2.2);
    const want = d > 1e-6 ? { x: (dx / d) * speed, y: (dy / d) * speed } : { x: 0, y: 0 };
    const k = ease(rate, dt);
    this.vel.x += (want.x - this.vel.x) * k;
    this.vel.y += (want.y - this.vel.y) * k;
    this.pos.x += this.vel.x * dt;
    this.pos.y += this.vel.y * dt;
    const low = this.floor(this.pos.x) + this.floorGap;
    if (this.pos.y < low) this.pos.y = low;
    if (Math.abs(this.vel.x) > 0.3) this.facing = Math.sign(this.vel.x);
  }
}
