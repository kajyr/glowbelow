import { makeRng } from '../game/rng';
import type { Vec2 } from '../game/vec';
import { CELL, type Fields } from './clearance';
import { PLANT_REACH } from './rules';

/** How far a starfish sits in from the squid-sized free cell, so it rests on the surface. */
const SINK = 0.4;

/** A starfish tucked on a rock or the seabed; `rot` turns it to sit on that surface. */
export interface StarfishSpot {
  zone: string;
  x: number;
  y: number;
  rot: number;
}

export interface StarfishOptions {
  count: number;
  /** Keep this far from these points (start, cave, lanterns, rings). */
  avoid: Vec2[];
  avoidRadius: number;
  /** Small things to just not overlap (plants on the seabed), and how far. */
  notOn?: Vec2[];
  notOnRadius?: number;
  /** Starfish keep at least this far apart, so they are spread round the zone. */
  apart: number;
  /**
   * Keep this far from the zone's bounds. The clearance grid treats bounds as
   * solid, but where no rock is drawn there (home's edges) a starfish would
   * seem stuck to the edge of the screen.
   */
  awayFromBounds?: number;
}

/**
 * Places starfish on surfaces: cells where the squid fits that touch rock or
 * the seabed, close enough to comfortable water that a glow reaches them
 * (the same reach rule as plants). Each is turned to sit on its surface. Uses
 * its own random stream from the seed. Returns null when they do not fit.
 */
export function placeStarfish(f: Fields, seed: number, zone: string, o: StarfishOptions): StarfishSpot[] | null {
  const rng = makeRng((seed ^ 0x57a2f15e) >>> 0);
  const free = (ix: number, iy: number) => ix >= 0 && iy >= 0 && ix < f.cols && iy < f.rows && f.narrow[f.idx(ix, iy)] === 1;
  const candidates: StarfishSpot[] = [];
  for (let iy = 2; iy < f.rows - 2; iy += 2) {
    for (let ix = 2; ix < f.cols - 2; ix += 2) {
      if (!free(ix, iy)) continue;
      // Points away from the solid around it: that is the way the surface faces.
      let nx = 0;
      let ny = 0;
      let solid = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if ((dx === 0 && dy === 0) || free(ix + dx, iy + dy)) continue;
          const l = Math.hypot(dx, dy);
          nx -= dx / l;
          ny -= dy / l;
          solid++;
        }
      }
      if (solid < 3) continue;
      const n = Math.hypot(nx, ny) || 1;
      // Not under ceilings or overhangs: starfish sit on rock tops, sides and the seabed.
      if (ny / n < -0.5) continue;
      // The cell is where the squid fits; the starfish sits on the surface itself,
      // and a glow from comfortable water must reach it there.
      const x = f.cx(ix) - (nx / n) * SINK;
      const y = f.cy(iy) - (ny / n) * SINK;
      const m = o.awayFromBounds ?? 0;
      if (m > 0 && (x < f.minX + m || x > f.minX + f.cols * CELL - m || y < f.minY + m || y > f.minY + f.rows * CELL - m)) continue;
      if (f.distanceToWideReach(x, y, PLANT_REACH) === Infinity) continue;
      candidates.push({ zone, x, y, rot: Math.atan2(-nx / n, ny / n) });
    }
  }
  // Shuffle, then keep spots far enough from each other and from what to avoid.
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  const chosen: StarfishSpot[] = [];
  for (const c of candidates) {
    if (o.avoid.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < o.avoidRadius)) continue;
    if ((o.notOn ?? []).some((p) => Math.hypot(p.x - c.x, p.y - c.y) < (o.notOnRadius ?? 0))) continue;
    if (chosen.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < o.apart)) continue;
    chosen.push(c);
    if (chosen.length === o.count) return chosen;
  }
  return null;
}
