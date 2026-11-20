import type { CoralColour, GlowColour } from './colours';
import { TUNING } from './tuning';
import type { Vec2 } from './vec';

/**
 * Picks the colour the cuttlefish shows: one on a coral near it, so a right
 * coral is always close by. Colours not unlocked yet come first, and never
 * the same colour twice in a row when there is another.
 */
export function pickColour(nearby: CoralColour[], unlocked: (c: GlowColour) => boolean, previous: CoralColour | null, rng: () => number): CoralColour | null {
  const present = [...new Set(nearby)];
  if (present.length === 0) return null;
  const fresh = present.filter((c) => c !== previous);
  const pool = fresh.length > 0 ? fresh : present;
  const locked = pool.filter((c) => !unlocked(c));
  const from = locked.length > 0 ? locked : pool;
  return from[Math.floor(rng() * from.length)];
}

export type GameState = 'idle' | 'showing' | 'cheering' | 'done';

export type GameEvent =
  /** A coral of the shown colour: the cuttlefish cheers. */
  | { kind: 'right'; round: number }
  /** Any other coral: it wiggles and keeps showing the colour. */
  | { kind: 'wrong' }
  /** A new colour to find. */
  | { kind: 'show'; colour: CoralColour; round: number }
  /** The third right coral: the last colour shown is the prize. */
  | { kind: 'finish'; colour: CoralColour };

/**
 * The cuttlefish's colour game, three rounds that cannot be failed: it
 * shows a colour, and touching a coral of that colour (judged by the
 * colour it had before the touch) is right. A wrong coral only makes the
 * cuttlefish wiggle; there is no timer and no score.
 */
export class ColourGame {
  state: GameState = 'idle';
  round = 0;
  colour: CoralColour | null = null;
  private timer = 0;

  constructor(private readonly choose: (previous: CoralColour | null) => CoralColour | null) {}

  get playing(): boolean {
    return this.state === 'showing' || this.state === 'cheering';
  }

  /** Starts a game. Returns the first colour, or null when there is no coral nearby to show. */
  start(): GameEvent | null {
    const colour = this.choose(null);
    if (!colour) return null;
    this.state = 'showing';
    this.round = 0;
    this.colour = colour;
    return { kind: 'show', colour, round: 0 };
  }

  /** A coral was touched; `before` is its colour before the touch. */
  touch(before: CoralColour): GameEvent | null {
    if (this.state !== 'showing') return null;
    if (before !== this.colour) return { kind: 'wrong' };
    this.state = 'cheering';
    this.timer = TUNING.cuttlefish.cheerTime;
    return { kind: 'right', round: this.round };
  }

  update(dt: number): GameEvent | null {
    if (this.state !== 'cheering') return null;
    this.timer -= dt;
    if (this.timer > 0) return null;
    if (this.round + 1 >= TUNING.cuttlefish.rounds) {
      this.state = 'done';
      return { kind: 'finish', colour: this.colour! };
    }
    const colour = this.choose(this.colour) ?? this.colour!;
    this.round++;
    this.colour = colour;
    this.state = 'showing';
    return { kind: 'show', colour, round: this.round };
  }
}

export type CuttlefishState = 'disguised' | 'revealing' | 'idle' | 'playing';

export type CuttlefishEvent =
  /** A glow found it: it swims out of the garden. */
  | { kind: 'reveal' }
  /** The squid touched it: a colour game starts. */
  | { kind: 'start' };

/**
 * The cuttlefish: disguised as a coral in the garden until a glow reaches
 * it, then swimming a lazy loop above its spot, cycling its colours. Touching
 * it starts the colour game (once the squid has swum away from it since the
 * last one). Its colour game lives in `game`; the colours of corals, and what
 * is unlocked, live in the world state.
 */
export class Cuttlefish {
  state: CuttlefishState = 'disguised';
  readonly pos: Vec2;
  /** 1 facing right, -1 facing left. */
  facing = 1;
  /** Seconds into its colour cycling (the view turns its hue with it). */
  cycle = 0;
  /** 0 → 1 through the reveal. */
  reveal = 0;
  /** Counts down to the next wrong-colour flicker of the disguise. */
  private flickerIn: number;
  /** Counts down through a flicker; the disguise shows the wrong colour while it does. */
  flicker = 0;
  private angle = 0;
  private armed = true;
  readonly home: Vec2;

  constructor(
    readonly hide: Vec2,
    readonly game: ColourGame,
    private readonly rng: () => number,
  ) {
    const C = TUNING.cuttlefish;
    this.home = { x: hide.x, y: hide.y + C.hoverAbove };
    this.pos = { ...hide };
    this.flickerIn = this.nextFlicker();
  }

  private nextFlicker(): number {
    const [a, b] = TUNING.cuttlefish.flickerEvery;
    return a + (b - a) * this.rng();
  }

  /** A continued game where it was already found: it swims at its spot. */
  restore(): void {
    this.state = 'idle';
    this.reveal = 1;
    Object.assign(this.pos, this.home);
  }

  /** Whether the disguise is showing its wrong colour right now (two quick flashes per flicker). */
  get flickering(): boolean {
    if (this.state !== 'disguised' || this.flicker <= 0) return false;
    const t = 1 - this.flicker / TUNING.cuttlefish.flickerTime;
    return t < 0.3 || (t > 0.55 && t < 0.85);
  }

  /** A pulse reached it. */
  pulse(): CuttlefishEvent | null {
    if (this.state !== 'disguised') return null;
    this.state = 'revealing';
    this.reveal = 0;
    return { kind: 'reveal' };
  }

  update(dt: number, squid: Vec2): CuttlefishEvent | null {
    const C = TUNING.cuttlefish;
    switch (this.state) {
      case 'disguised':
        this.flicker = Math.max(0, this.flicker - dt);
        this.flickerIn -= dt;
        if (this.flickerIn <= 0) {
          this.flicker = C.flickerTime;
          this.flickerIn = this.nextFlicker();
        }
        return null;
      case 'revealing': {
        this.reveal = Math.min(1, this.reveal + dt / C.revealTime);
        // Up out of the garden in a little arc.
        const e = this.reveal * this.reveal * (3 - 2 * this.reveal);
        this.pos.x = this.hide.x + Math.sin(e * Math.PI) * 1.2;
        this.pos.y = this.hide.y + (this.home.y - this.hide.y) * e;
        this.facing = e < 0.5 ? 1 : -1;
        if (this.reveal >= 1) {
          this.state = 'idle';
          this.angle = 0;
        }
        return null;
      }
      case 'idle': {
        this.cycle += dt;
        this.swim(dt, C.swimRadius, C.swimSpeed);
        const d = Math.hypot(squid.x - this.pos.x, squid.y - this.pos.y);
        if (d > C.rearm) this.armed = true;
        if (this.armed && d < C.touchRadius) {
          this.armed = false;
          this.state = 'playing';
          return { kind: 'start' };
        }
        return null;
      }
      case 'playing':
        // It stays close to its spot while it shows colours, bobbing.
        this.swim(dt, 0.6, 0.8);
        if (this.game.state === 'done' || this.game.state === 'idle') this.state = 'idle';
        return null;
    }
  }

  /** A lazy loop around its spot (a figure of eight, wider than tall). */
  private swim(dt: number, radius: number, speed: number): void {
    this.angle += speed * dt;
    const want = { x: this.home.x + Math.sin(this.angle) * radius, y: this.home.y + Math.sin(this.angle * 2) * radius * 0.2 };
    const k = 1 - Math.exp(-2 * dt);
    const dx = (want.x - this.pos.x) * k;
    this.pos.x += dx;
    this.pos.y += (want.y - this.pos.y) * k;
    if (Math.abs(dx) > 1e-4) this.facing = Math.sign(dx);
  }
}
