import { TUNING } from './tuning';
import type { Vec2 } from './vec';

/** Its column in Twilight: a fixed x, cruising between y0 (bottom) and y1 (top). */
export interface NautilusPath {
  x: number;
  y0: number;
  y1: number;
}

export type NautilusState = 'cruise' | 'pause' | 'meet' | 'called';

export type NautilusEvent =
  /** Shed a trail sparkle here, drifting this way. */
  | { kind: 'shed'; at: Vec2; drift: Vec2 }
  /** The squid touched it for the first time. */
  | { kind: 'met' };

/**
 * The nautilus: cruises slowly up and down its column in Twilight, pausing
 * at the top and bottom and turning to face where it goes. While moving it
 * sheds sparkles behind its shell, never more than a few at once. The first
 * touch is the discovery: it stops and looks at the squid. Once found, a glow
 * in Twilight calls it toward the squid's height, sparkles and all. It has
 * no collider: the squid always passes in front of it.
 */
export class Nautilus {
  readonly pos: Vec2;
  state: NautilusState = 'cruise';
  /** 1 heading up, -1 heading down. */
  heading = 1;
  /** 1 facing right, -1 facing left (it turns to look at the squid when met). */
  facing = 1;
  found = false;
  private timer = 0;
  private shedTimer = 0;
  private target = 0;
  /** Ages of the trail sparkles shed recently, for the cap. */
  private trail: number[] = [];

  constructor(readonly path: NautilusPath) {
    this.pos = { x: path.x, y: path.y0 };
  }

  /** Trail sparkles counting toward the cap right now. */
  get trailCount(): number {
    return this.trail.length;
  }

  /** A glow in Twilight: once found, it heads for the squid's height. Returns true if it answers. */
  call(y: number): boolean {
    if (!this.found || this.state === 'meet') return false;
    this.target = Math.min(this.path.y1, Math.max(this.path.y0, y));
    this.heading = this.target >= this.pos.y ? 1 : -1;
    this.state = 'called';
    this.timer = 0;
    return true;
  }

  update(dt: number, squid: Vec2, squidRadius: number): NautilusEvent[] {
    const N = TUNING.nautilus;
    const out: NautilusEvent[] = [];
    this.trail = this.trail.map((a) => a + dt).filter((a) => a < N.trailLife);

    if (!this.found && Math.hypot(squid.x - this.pos.x, squid.y - this.pos.y) < N.touchRadius + squidRadius) {
      this.found = true;
      this.state = 'meet';
      this.timer = N.meetTime;
      this.facing = Math.sign(squid.x - this.pos.x) || this.facing;
      out.push({ kind: 'met' });
      return out;
    }

    let moving = false;
    if (this.state === 'meet' || this.state === 'pause') {
      this.timer -= dt;
      if (this.timer <= 0) this.state = 'cruise';
    } else {
      const goal = this.state === 'called' ? this.target : this.heading > 0 ? this.path.y1 : this.path.y0;
      const left = goal - this.pos.y;
      // Eases into the stop, so it never jerks to a halt.
      const ease = Math.min(1, Math.abs(left) / (N.speed * N.turnTime * 0.5) + 0.15);
      const step = Math.sign(left) * Math.min(Math.abs(left), N.speed * ease * dt);
      this.pos.y += step;
      moving = Math.abs(step) > 1e-6;
      if (Math.abs(goal - this.pos.y) < 1e-3) {
        const wasCalled = this.state === 'called';
        this.pos.y = goal;
        this.state = 'pause';
        // It waits a while with the squid when called, a little at the ends.
        this.timer = wasCalled ? N.callPause : N.pauseTime;
        // After a pause at an end it turns round; after a call it carries on the way it was going.
        if (goal === this.path.y1) this.heading = -1;
        else if (goal === this.path.y0) this.heading = 1;
      }
    }

    if (moving) {
      this.shedTimer += dt;
      if (this.shedTimer >= N.shedEvery) {
        this.shedTimer = 0;
        if (this.trail.length < N.trailCap) {
          this.trail.push(0);
          // Behind the shell, drifting away from where it is going.
          const behind = 0.9 * N.scale;
          out.push({
            kind: 'shed',
            at: { x: this.pos.x - this.facing * 0.3, y: this.pos.y - this.heading * behind },
            drift: { x: (Math.sin(this.pos.y) * N.trailDrift) / 2, y: -this.heading * N.trailDrift },
          });
        }
      }
    }
    return out;
  }
}
