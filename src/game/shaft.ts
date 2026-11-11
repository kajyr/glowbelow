import type { Body } from './steering';

/**
 * The way up is closed in the demo: above `softFrom` inside the shaft, a
 * gentle push grows with height and eases the squid back down. No message,
 * no penalty.
 */
export function shaftPush(body: Body, shaft: { x0: number; x1: number; softFrom: number }, dt: number): void {
  if (body.pos.x < shaft.x0 || body.pos.x > shaft.x1) return;
  const over = body.pos.y - shaft.softFrom;
  if (over <= 0) return;
  body.vel.y -= over * 9 * dt;
  if (body.vel.y > 0) body.vel.y *= 1 - Math.min(1, over * 1.5 * dt);
}
