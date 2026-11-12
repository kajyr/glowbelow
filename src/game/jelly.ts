import type { Circle } from './collision';
import type { Body } from './steering';
import { TUNING } from './tuning';
import { makeRng } from './rng';
import type { Vec2 } from './vec';

/** Where the jelly may go. Built from the level's clearance fields. */
export interface RoamArea {
  free(x: number, y: number): boolean;
  randomFree(rng: () => number): Vec2 | null;
  /** A straightened path through free water from one point to another, or null. */
  path(from: Vec2, to: Vec2): Vec2[] | null;
}

/** It sets off for spots at least this far away, so it roams the whole zone. */
const MIN_TRIP = 20;

/**
 * The giant phantom jelly: roams the zone very slowly. It picks a far-off
 * spot in its open water, drifts there along a path that curves around rocks,
 * and then picks the next one. Its open water is one connected area and every
 * point of every path is in it, so it never touches rock and never gets stuck.
 *
 * Touching the bell or the arms is a "touch" (once per grace period): the
 * squid bounces away from the jelly. While they overlap, the bell gently pushes the squid away like a soft moving wall, but never
 * further into a wall it is already against, and the arms never push, so the
 * squid can always swim away.
 */
export class Jelly {
  pos: Vec2;
  /** Direction it drifts in, eased for drawing. */
  heading = 0;
  /** Time left before another touch can spill. */
  grace = 0;
  private readonly rng: () => number;
  private path: Vec2[] = [];
  private next = 0;

  constructor(
    private readonly area: RoamArea,
    start: Vec2,
    seed: number,
  ) {
    this.rng = makeRng((seed ^ 0x2f71a9c3) >>> 0);
    this.pos = { ...start };
  }

  /** The next far-off spot to drift to. */
  private setOff(): void {
    for (let t = 0; t < 30; t++) {
      const to = this.area.randomFree(this.rng);
      if (!to) return;
      if (t < 25 && Math.hypot(to.x - this.pos.x, to.y - this.pos.y) < MIN_TRIP) continue;
      const path = this.area.path(this.pos, to);
      if (path && path.length > 0) {
        this.path = path;
        this.next = 0;
        return;
      }
    }
  }

  /** Drifts one step along its path. */
  update(dt: number): void {
    this.grace = Math.max(0, this.grace - dt);
    if (this.next >= this.path.length) this.setOff();
    let left = TUNING.jelly.speed * dt;
    const before = { ...this.pos };
    while (left > 1e-9 && this.next < this.path.length) {
      const wp = this.path[this.next];
      const d = Math.hypot(wp.x - this.pos.x, wp.y - this.pos.y);
      if (d <= left) {
        this.pos = { ...wp };
        left -= d;
        this.next++;
      } else {
        this.pos = { x: this.pos.x + ((wp.x - this.pos.x) * left) / d, y: this.pos.y + ((wp.y - this.pos.y) * left) / d };
        left = 0;
      }
    }
    // A gently turning heading, for drawing.
    const mx = this.pos.x - before.x;
    const my = this.pos.y - before.y;
    if (Math.hypot(mx, my) > 1e-6) {
      const want = Math.atan2(my, mx);
      const diff = Math.atan2(Math.sin(want - this.heading), Math.cos(want - this.heading));
      this.heading += diff * Math.min(1, 1.5 * dt);
    }
  }

  /** The bell as a circle. */
  bell(): Circle {
    const J = TUNING.jelly;
    return { x: this.pos.x, y: this.pos.y + J.bellLift, r: J.bellRadius };
  }

  /** The arms as chains of small circles hanging below the bell. */
  arms(): Circle[] {
    const J = TUNING.jelly;
    const out: Circle[] = [];
    for (const ax of J.arms) {
      for (let t = 0.1; t <= 1.0001; t += 0.1) {
        out.push({ x: this.pos.x + ax * (1 + 0.4 * t), y: this.pos.y - 0.1 - J.armLength * t, r: J.armRadius });
      }
    }
    return out;
  }

  /**
   * Checks the squid against the jelly. The bell pushes it gently out unless
   * the squid is already against a wall (`againstWall`). Returns the touch
   * point when this is a touch that should spill, otherwise null.
   */
  touch(body: Body, radius: number, againstWall: boolean, dt: number): Vec2 | null {
    const J = TUNING.jelly;
    const b = this.bell();
    const dx = body.pos.x - b.x;
    const dy = body.pos.y - b.y;
    const d = Math.hypot(dx, dy);
    const onBell = d < b.r + radius;
    if (onBell && !againstWall) {
      const nx = d > 1e-6 ? dx / d : 0;
      const ny = d > 1e-6 ? dy / d : 1;
      const depth = b.r + radius - d;
      const push = Math.min(1, J.pushRate * dt);
      body.pos.x += nx * depth * push;
      body.pos.y += ny * depth * push;
      const into = -(body.vel.x * nx + body.vel.y * ny);
      if (into > 0) {
        body.vel.x += nx * into * 0.8;
        body.vel.y += ny * into * 0.8;
      }
    }
    const arm = onBell ? undefined : this.arms().find((c) => Math.hypot(body.pos.x - c.x, body.pos.y - c.y) < c.r + radius);
    if (!(onBell || arm) || this.grace > 0) return null;
    this.grace = J.grace;
    // Boing: the squid bounces away from the bell, or from the arm it touched.
    const from = onBell ? b : arm!;
    const bx = body.pos.x - from.x;
    const by = body.pos.y - from.y;
    const bl = Math.hypot(bx, by);
    const ux = bl > 1e-6 ? bx / bl : body.pos.x >= this.pos.x ? 1 : -1;
    const uy = bl > 1e-6 ? by / bl : 0;
    body.vel.x = ux * J.bounce;
    body.vel.y = uy * J.bounce;
    // Where they met: between the squid and the bell, or at the squid on an arm.
    return onBell ? { x: (body.pos.x + b.x) / 2, y: (body.pos.y + b.y) / 2 } : { ...body.pos };
  }
}
