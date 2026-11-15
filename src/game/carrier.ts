import type { Vec2 } from './vec';

export type CarrierEvent = 'arrive' | 'hop' | null;

export interface CarrierOptions {
  /** Top speed along the path. */
  speed: number;
  /** Seconds to get up to speed; it slows down over the same distance before the end. */
  ease: number;
}

/**
 * Something the squid can ride: a path, a seat moving along it, and hopping
 * off. The squid sits on the seat until the end of the path. Steering hops
 * off, but only once the player has let go after boarding, so the touch
 * that boarded does not hop straight off again. Shared by every ride (the
 * giant squid's arm first).
 */
export class Carrier {
  riding = false;
  /** Distance travelled along the path. */
  s = 0;
  private v = 0;
  private released = false;
  private readonly cum: number[];

  constructor(
    readonly path: Vec2[],
    private readonly opts: CarrierOptions,
  ) {
    this.cum = [0];
    for (let i = 1; i < path.length; i++) this.cum.push(this.cum[i - 1] + Math.hypot(path[i].x - path[i - 1].x, path[i].y - path[i - 1].y));
  }

  get length(): number {
    return this.cum[this.cum.length - 1];
  }

  board(): void {
    this.riding = true;
    this.s = 0;
    this.v = 0;
    this.released = false;
  }

  /** Where the squid sits now. */
  get seat(): Vec2 {
    return this.pointAt(this.s);
  }

  /** The point `s` along the path (clamped to its ends). */
  pointAt(s: number): Vec2 {
    const { path, cum } = this;
    if (s <= 0 || path.length === 1) return { ...path[0] };
    if (s >= this.length) return { ...path[path.length - 1] };
    let i = 1;
    while (cum[i] < s) i++;
    const t = (s - cum[i - 1]) / (cum[i] - cum[i - 1] || 1);
    return { x: path[i - 1].x + (path[i].x - path[i - 1].x) * t, y: path[i - 1].y + (path[i].y - path[i - 1].y) * t };
  }

  /** Moves the seat on. `steering` is whether the player is steering this step. */
  update(dt: number, steering: boolean): CarrierEvent {
    if (!this.riding) return null;
    if (!steering) this.released = true;
    else if (this.released) {
      this.riding = false;
      return 'hop';
    }
    const { speed, ease } = this.opts;
    // Speeds up gently, and slows down before the end (never quite to a stop).
    const left = this.length - this.s;
    const brake = Math.max(0.15, Math.min(1, left / (speed * ease * 0.5)));
    this.v = Math.min(this.v + (speed / ease) * dt, speed * brake);
    this.s = Math.min(this.length, this.s + this.v * dt);
    if (this.s >= this.length) {
      this.riding = false;
      return 'arrive';
    }
    return null;
  }
}
