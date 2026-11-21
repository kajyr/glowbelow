import type { Body } from './steering';

export interface Shaft {
  x0: number;
  x1: number;
  softFrom: number;
}

/**
 * A closed way up. Above `softFrom` inside the shaft, a gentle push grows
 * with height and eases the squid back down. No message, no penalty. (Every
 * way up in the world is open today; a zone's own level can still close one.)
 */
export function shaftPush(body: Body, shaft: Shaft, dt: number): void {
  if (body.pos.x < shaft.x0 || body.pos.x > shaft.x1) return;
  const over = body.pos.y - shaft.softFrom;
  if (over <= 0) return;
  body.vel.y -= over * 9 * dt;
  if (body.vel.y > 0) body.vel.y *= 1 - Math.min(1, over * 1.5 * dt);
}

/** How far below the water's surface its gentle push begins. */
export const SURFACE_SOFT = 2.5;

/**
 * The reef's surface: the squid cannot leave the water. Within
 * `SURFACE_SOFT` of it (inside `x0 … x1`), a push grows toward the top and
 * eases the squid back down, like a closed shaft. No penalty.
 */
export function surfacePush(body: Body, surface: { x0: number; x1: number; y: number }, dt: number): void {
  if (body.pos.x < surface.x0 || body.pos.x > surface.x1) return;
  const over = body.pos.y - (surface.y - SURFACE_SOFT);
  if (over <= 0) return;
  body.vel.y -= over * 9 * dt;
  if (body.vel.y > 0) body.vel.y *= 1 - Math.min(1, over * 1.5 * dt);
}
