import { makeRng } from '../game/rng';
import type { Vec2 } from '../game/vec';
import { CELL, type Fields } from './clearance';

/** A chain of bubble rings: ring centres in swimming order, and the way they face. */
export interface RingChain {
  rings: Vec2[];
  /** Unit direction from one ring to the next. */
  dir: Vec2;
}

export interface RingOptions {
  /** Rings in a chain (the spec asks for 4 to 6). */
  count: number;
  /** Distance between ring centres. */
  spacing: number;
  /** Directions to try, in radians (0 is left to right). */
  angles: number[];
  /** Keep this far from these points (start, cave, passages). */
  avoid: Vec2[];
  avoidRadius: number;
  /** Optional box the chain must stay in (Twilight's open middle). */
  within?: { minX: number; maxX: number; minY: number; maxY: number };
}

/** Free and reachable with room to spare (the "wide" field), at a world point. */
const open = (f: Fields, p: Vec2) => f.wideReach[f.idx(f.ix(p.x), f.iy(p.y))] === 1 && p.x > f.minX && p.y > f.minY;

/**
 * Places one chain of bubble rings in open water the squid can reach: every
 * ring, and the straight swim between them, is in comfortable reachable
 * water. Uses its own random stream from the seed, so the rest of the zone
 * is unchanged. Returns null when no chain fits (the seed is then rejected
 * like any other broken rule).
 */
export function placeRingChain(f: Fields, seed: number, o: RingOptions): RingChain | null {
  const rng = makeRng((seed ^ 0x2b1e5eed) >>> 0);
  const cells: number[] = [];
  for (let i = 0; i < f.wideReach.length; i++) if (f.wideReach[i]) cells.push(i);
  if (cells.length === 0) return null;
  const length = o.spacing * (o.count - 1);
  for (let tries = 0; tries < 400; tries++) {
    const c = cells[Math.floor(rng() * cells.length)];
    const start = { x: f.cx(c % f.cols), y: f.cy(Math.floor(c / f.cols)) };
    const a = o.angles[Math.floor(rng() * o.angles.length)];
    const dir = { x: Math.cos(a), y: Math.sin(a) };
    const at = (d: number) => ({ x: start.x + dir.x * d, y: start.y + dir.y * d });
    let ok = true;
    // The whole swim line, every tenth of a cell (so no closed corner slips between samples), in open reachable water.
    for (let d = 0; d <= length + 1e-6 && ok; d += CELL / 10) {
      const p = at(d);
      if (!open(f, p)) ok = false;
      else if (o.within && (p.x < o.within.minX || p.x > o.within.maxX || p.y < o.within.minY || p.y > o.within.maxY)) ok = false;
      else if (o.avoid.some((q) => Math.hypot(q.x - p.x, q.y - p.y) < o.avoidRadius)) ok = false;
    }
    if (!ok) continue;
    return { rings: Array.from({ length: o.count }, (_v, i) => at(i * o.spacing)), dir };
  }
  return null;
}
