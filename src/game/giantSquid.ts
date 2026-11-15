import { Carrier } from './carrier';
import type { PulseKind } from './pulse';
import { TUNING } from './tuning';
import type { Vec2 } from './vec';

export type GiantState = 'asleep' | 'waking' | 'awake' | 'carrying' | 'returning';

export type GiantEvent =
  /** A small pulse reached it: it stirs in its sleep. */
  | { kind: 'stir' }
  /** A big pulse woke it. */
  | { kind: 'wake' }
  /** The squid touched the arm and sits on it. */
  | { kind: 'board' }
  /** The player steered away during the ride. */
  | { kind: 'hop' }
  /** The ride reached the top of the world. */
  | { kind: 'drop' }
  /** Back at its spot in Whale fall. */
  | { kind: 'home' };

export interface GiantSpots {
  sleep: Vec2;
  hover: Vec2;
  /** Tip of the offered arm while it hovers. */
  arm: Vec2;
}

const ease = (t: number) => t * t * (3 - 2 * t);

/**
 * The giant squid: asleep behind the whale skull until a big pulse wakes it;
 * small pulses only make it stir. Awake, it hovers above the skull offering
 * an arm. Touching the arm's tip boards it, and it carries the squid along
 * the ride path to the top of the world (a carrier: steering hops off), then
 * sinks back to its spot. It has no collider: it never blocks the squid.
 * The ride path is asked for only when first needed (it searches the world).
 */
export class GiantSquid {
  state: GiantState = 'asleep';
  /** Its body (where the head meets the arms). */
  readonly pos: Vec2;
  /** 1 facing right, -1 facing left. */
  facing: number;
  /** 1 right after a small pulse, fading back to 0. */
  stir = 0;
  /** 0 asleep → 1 awake (eye open, risen). */
  awake = 0;
  private timer = 0;
  private carrier: Carrier | null = null;
  /** The squid has swum away from the arm since the last ride, so touching it boards again. */
  private armed = true;
  private readonly restFacing: number;

  constructor(
    private readonly spots: GiantSpots,
    private readonly ridePath: () => Vec2[],
  ) {
    this.pos = { ...spots.sleep };
    this.facing = this.restFacing = Math.sign(spots.arm.x - spots.hover.x) || -1;
  }

  /** A continued game where it was already woken: it hovers, arm offered. */
  restore(): void {
    this.state = 'awake';
    this.awake = 1;
    Object.assign(this.pos, this.spots.hover);
  }

  get riding(): boolean {
    return this.state === 'carrying';
  }

  /** Where the arm's tip is: the seat while carrying. */
  get armTip(): Vec2 {
    if (this.carrier && this.state === 'carrying') return this.carrier.seat;
    return { x: this.pos.x + (this.spots.arm.x - this.spots.hover.x), y: this.pos.y + (this.spots.arm.y - this.spots.hover.y) };
  }

  /** A pulse reached it. */
  pulse(kind: PulseKind): GiantEvent | null {
    if (this.state !== 'asleep') return null;
    if (kind === 'small') {
      this.stir = 1;
      return { kind: 'stir' };
    }
    this.state = 'waking';
    this.timer = 0;
    return { kind: 'wake' };
  }

  private path(): Carrier {
    const G = TUNING.giant;
    this.carrier ??= new Carrier(this.ridePath(), { speed: G.rideSpeed, ease: G.rideEase });
    return this.carrier;
  }

  /** The body sits behind and above the seat, the arm reaching forward and down to it. */
  private follow(seat: Vec2, dt: number, rate: number): void {
    const off = { x: this.spots.hover.x - this.spots.arm.x, y: this.spots.hover.y - this.spots.arm.y };
    const want = { x: seat.x + off.x * this.facing * this.restFacing, y: seat.y + off.y };
    const k = 1 - Math.exp(-rate * dt);
    this.pos.x += (want.x - this.pos.x) * k;
    this.pos.y += (want.y - this.pos.y) * k;
  }

  /** `steering`: whether the player steers this step (it hops off a ride). */
  update(dt: number, squid: Vec2, steering: boolean): GiantEvent | null {
    const G = TUNING.giant;
    this.stir = Math.max(0, this.stir - dt / G.stirTime);
    this.timer += dt;
    switch (this.state) {
      case 'asleep':
        return null;
      case 'waking': {
        const t = Math.min(1, this.timer / G.riseTime);
        this.awake = t;
        const e = ease(t);
        this.pos.x = this.spots.sleep.x + (this.spots.hover.x - this.spots.sleep.x) * e;
        this.pos.y = this.spots.sleep.y + (this.spots.hover.y - this.spots.sleep.y) * e;
        if (t >= 1) this.state = 'awake';
        return null;
      }
      case 'awake': {
        const tip = this.armTip;
        const d = Math.hypot(squid.x - tip.x, squid.y - tip.y);
        if (d > G.rearm) this.armed = true;
        if (this.armed && d <= G.boardRadius) {
          this.state = 'carrying';
          this.armed = false;
          this.path().board();
          return { kind: 'board' };
        }
        return null;
      }
      case 'carrying': {
        const c = this.path();
        const before = c.seat;
        const ev = c.update(dt, steering);
        const dx = c.seat.x - before.x;
        if (Math.abs(dx) > 1e-3) this.facing = Math.sign(dx);
        this.follow(c.seat, dt, 6);
        if (ev === 'hop') return this.goHome('hop');
        if (ev === 'arrive') return this.goHome('drop');
        return null;
      }
      case 'returning': {
        const c = this.path();
        if (this.timer < G.returnDelay) return null;
        const before = c.pointAt(c.s);
        c.s = Math.max(0, c.s - G.returnSpeed * dt);
        const at = c.pointAt(c.s);
        if (Math.abs(at.x - before.x) > 1e-3) this.facing = Math.sign(at.x - before.x);
        this.follow(at, dt, 4);
        if (c.s <= 0) {
          this.state = 'awake';
          this.facing = this.restFacing;
          Object.assign(this.pos, this.spots.hover);
          return { kind: 'home' };
        }
        return null;
      }
    }
  }

  private goHome(kind: 'hop' | 'drop'): GiantEvent {
    this.state = 'returning';
    this.timer = 0;
    return { kind };
  }
}
