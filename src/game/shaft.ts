import type { Body } from './steering';
import { TUNING } from './tuning';

export interface Shaft {
  x0: number;
  x1: number;
  softFrom: number;
  /** One-way: the height of the lid at the top (see `Level.shaft`). */
  lid?: number;
}

/** Which way the squid came into a one-way shaft: from the zone above, it may pass the lid. */
export interface Gate {
  fromAbove: boolean;
}

/**
 * A closed or one-way way up. Above `softFrom` inside the shaft, a gentle
 * push grows with height and eases the squid back down. No message, no
 * penalty. With a lid, the push stops at the lid, and the lid holds the
 * squid from below: going up it cannot pass, not even with a dash. A squid
 * that came down from the zone above passes freely (`gate` remembers that,
 * until it is well below the lid).
 */
export function shaftPush(body: Body, shaft: Shaft, dt: number, gate: Gate = { fromAbove: false }, radius = TUNING.squid.radius): void {
  const lid = shaft.lid ?? Infinity;
  if (body.pos.y > lid) gate.fromAbove = true;
  else if (body.pos.y < lid - radius - 2) gate.fromAbove = false;
  if (body.pos.x < shaft.x0 || body.pos.x > shaft.x1 || body.pos.y > lid) return;
  const over = body.pos.y - shaft.softFrom;
  if (over > 0) {
    body.vel.y -= over * 9 * dt;
    if (body.vel.y > 0) body.vel.y *= 1 - Math.min(1, over * 1.5 * dt);
  }
  if (!gate.fromAbove && body.pos.y + radius > lid) {
    body.pos.y = lid - radius;
    if (body.vel.y > 0) body.vel.y = 0;
  }
}

/** How far below the water's surface its gentle push begins. */
export const SURFACE_SOFT = 2.5;

/**
 * The reef's surface: the squid cannot leave the water. Within
 * `SURFACE_SOFT` of it (inside `x0 … x1`), a push grows toward the top and
 * eases the squid back down, like the closed shaft. No penalty.
 */
export function surfacePush(body: Body, surface: { x0: number; x1: number; y: number }, dt: number): void {
  if (body.pos.x < surface.x0 || body.pos.x > surface.x1) return;
  const over = body.pos.y - (surface.y - SURFACE_SOFT);
  if (over <= 0) return;
  body.vel.y -= over * 9 * dt;
  if (body.vel.y > 0) body.vel.y *= 1 - Math.min(1, over * 1.5 * dt);
}
