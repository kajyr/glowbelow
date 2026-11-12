import { TUNING } from './tuning';
import type { Body } from './steering';
import { type Vec2 } from './vec';

export interface Circle {
  x: number;
  y: number;
  r: number;
}

/** A height line, sorted by x; the seabed. */
export interface HeightLine {
  xs: number[];
  ys: number[];
}

/** A stretch of the zone with a lower ceiling than the zone top. */
export interface Ceiling {
  x0: number;
  x1: number;
  y: number;
}

/** An axis-aligned solid block, for rock between and around zones. */
export interface Block {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface CollisionWorld {
  circles: Circle[];
  floor: HeightLine;
  bounds: { minX: number; maxX: number; minY: number; maxY: number };
  ceilings: Ceiling[];
  /** Solid rock blocks (the world around and between zones). */
  blocks?: Block[];
}

/**
 * How a circle overlaps a block: the push direction out of it and how deep
 * it is, or null when they do not touch.
 */
export function blockOverlap(x: number, y: number, radius: number, b: Block): { nx: number; ny: number; depth: number } | null {
  const cx = Math.min(b.maxX, Math.max(b.minX, x));
  const cy = Math.min(b.maxY, Math.max(b.minY, y));
  const dx = x - cx;
  const dy = y - cy;
  const d = Math.hypot(dx, dy);
  if (d > 1e-9) return d < radius ? { nx: dx / d, ny: dy / d, depth: radius - d } : null;
  // Centre inside the block: out through the nearest side.
  const sides = [
    { nx: -1, ny: 0, depth: x - b.minX + radius },
    { nx: 1, ny: 0, depth: b.maxX - x + radius },
    { nx: 0, ny: -1, depth: y - b.minY + radius },
    { nx: 0, ny: 1, depth: b.maxY - y + radius },
  ];
  return sides.reduce((a, c) => (c.depth < a.depth ? c : a));
}

export interface Contact {
  /** Unit normal pointing away from the wall. */
  normal: Vec2;
  /** Speed into the wall just before the push (positive). */
  impactSpeed: number;
}

export function floorAt(line: HeightLine, x: number): number {
  const { xs, ys } = line;
  if (xs.length === 0) return -Infinity;
  if (x <= xs[0]) return ys[0];
  if (x >= xs[xs.length - 1]) return ys[ys.length - 1];
  let lo = 0;
  let hi = xs.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (xs[mid] <= x) lo = mid;
    else hi = mid;
  }
  const t = (x - xs[lo]) / (xs[hi] - xs[lo]);
  return ys[lo] + (ys[hi] - ys[lo]) * t;
}

export function ceilingAt(world: CollisionWorld, x: number): number {
  let top = world.bounds.maxY;
  for (const c of world.ceilings) if (x >= c.x0 && x <= c.x1) top = Math.min(top, c.y);
  return top;
}

/**
 * Soft walls: every overlap is pushed out a share of its depth per second,
 * and the velocity into the wall is mostly removed, so the body slides along
 * walls and can never be held in place by them. Returns the hardest contact
 * (if any) so the caller can decide on a bump.
 */
export function collide(body: Body, radius: number, world: CollisionWorld, dt: number): Contact | null {
  const push = Math.min(1, TUNING.walls.pushRate * dt);
  let hardest: Contact | null = null;

  const hit = (nx: number, ny: number, depth: number) => {
    const into = -(body.vel.x * nx + body.vel.y * ny);
    if (into > 0) {
      body.vel.x += nx * into * TUNING.walls.slide;
      body.vel.y += ny * into * TUNING.walls.slide;
    }
    body.pos.x += nx * depth * push;
    body.pos.y += ny * depth * push;
    if (!hardest || into > hardest.impactSpeed) hardest = { normal: { x: nx, y: ny }, impactSpeed: Math.max(0, into) };
  };

  for (const c of world.circles) {
    const dx = body.pos.x - c.x;
    const dy = body.pos.y - c.y;
    const d = Math.hypot(dx, dy);
    const depth = c.r + radius - d;
    if (depth <= 0) continue;
    // Dead centre: push straight up so there is always a way out.
    if (d < 1e-6) hit(0, 1, depth);
    else hit(dx / d, dy / d, depth);
  }

  for (const b of world.blocks ?? []) {
    const o = blockOverlap(body.pos.x, body.pos.y, radius, b);
    if (o) hit(o.nx, o.ny, o.depth);
  }

  const floor = floorAt(world.floor, body.pos.x);
  const floorDepth = floor + radius - body.pos.y;
  if (floorDepth > 0) hit(0, 1, floorDepth);

  const { minX, maxX, minY } = world.bounds;
  const top = ceilingAt(world, body.pos.x);
  if (body.pos.x - radius < minX) hit(1, 0, minX - (body.pos.x - radius));
  if (body.pos.x + radius > maxX) hit(-1, 0, body.pos.x + radius - maxX);
  if (body.pos.y - radius < minY) hit(0, 1, minY - (body.pos.y - radius));
  if (body.pos.y + radius > top) hit(0, -1, body.pos.y + radius - top);
  return hardest;
}
