import { blockOverlap, ceilingAt, floorAt, type CollisionWorld } from '../game/collision';
import type { Vec2 } from '../game/vec';

/** Grid cell size in world units. */
export const CELL = 0.5;
/** A free "wide" cell is at least this far from everything: a gap of two squid widths (2.6). */
export const WIDE = 1.3;
/** A free "narrow" cell is somewhere the squid itself fits. */
export const NARROW = 0.55;

/**
 * The zone on a grid, with two views of where the squid can be: `wide`
 * (comfortable, two squid widths of room) and `narrow` (just fits), and what
 * each can reach from the start by swimming through free cells.
 */
export class Fields {
  readonly cols: number;
  readonly rows: number;
  readonly minX: number;
  readonly minY: number;
  /** 1 where the cell is free. */
  readonly wide: Uint8Array;
  readonly narrow: Uint8Array;
  /** 1 where the cell is free and connected to the start. */
  readonly wideReach: Uint8Array;
  readonly narrowReach: Uint8Array;

  constructor(world: CollisionWorld, start: Vec2) {
    const b = world.bounds;
    this.minX = b.minX;
    this.minY = b.minY;
    this.cols = Math.ceil((b.maxX - b.minX) / CELL);
    this.rows = Math.ceil((b.maxY - b.minY) / CELL);
    this.wide = this.freeField(world, WIDE);
    this.narrow = this.freeField(world, NARROW);
    this.wideReach = this.flood(this.wide, start);
    this.narrowReach = this.flood(this.narrow, start);
  }

  ix(x: number): number {
    return Math.min(this.cols - 1, Math.max(0, Math.floor((x - this.minX) / CELL)));
  }
  iy(y: number): number {
    return Math.min(this.rows - 1, Math.max(0, Math.floor((y - this.minY) / CELL)));
  }
  cx(ix: number): number {
    return this.minX + (ix + 0.5) * CELL;
  }
  cy(iy: number): number {
    return this.minY + (iy + 0.5) * CELL;
  }
  idx(ix: number, iy: number): number {
    return iy * this.cols + ix;
  }

  /** Free cells: not within `radius` of any wall, floor, ceiling or collider. */
  private freeField(world: CollisionWorld, radius: number): Uint8Array {
    const { cols, rows } = this;
    const free = new Uint8Array(cols * rows).fill(1);
    const b = world.bounds;
    for (let ix = 0; ix < cols; ix++) {
      const x = this.cx(ix);
      const floor = floorAt(world.floor, x);
      const top = ceilingAt(world, x);
      for (let iy = 0; iy < rows; iy++) {
        const y = this.cy(iy);
        if (x - radius < b.minX || x + radius > b.maxX || y - radius < b.minY || y - floor < radius || y + radius > top) {
          free[this.idx(ix, iy)] = 0;
        }
      }
    }
    for (const c of world.circles) {
      const reach = c.r + radius;
      const x0 = this.ix(c.x - reach);
      const x1 = this.ix(c.x + reach);
      const y0 = this.iy(c.y - reach);
      const y1 = this.iy(c.y + reach);
      for (let ix = x0; ix <= x1; ix++) {
        for (let iy = y0; iy <= y1; iy++) {
          if (Math.hypot(this.cx(ix) - c.x, this.cy(iy) - c.y) < reach) free[this.idx(ix, iy)] = 0;
        }
      }
    }
    for (const b of world.blocks ?? []) {
      for (let ix = this.ix(b.minX - radius); ix <= this.ix(b.maxX + radius); ix++) {
        for (let iy = this.iy(b.minY - radius); iy <= this.iy(b.maxY + radius); iy++) {
          if (blockOverlap(this.cx(ix), this.cy(iy), radius, b)) free[this.idx(ix, iy)] = 0;
        }
      }
    }
    return free;
  }

  /** Free cells connected (up, down, left, right) to the free cell nearest the start. */
  private flood(free: Uint8Array, start: Vec2): Uint8Array {
    const { cols, rows } = this;
    const reach = new Uint8Array(cols * rows);
    const sx = this.ix(start.x);
    const sy = this.iy(start.y);
    let first = -1;
    for (let r = 0; r <= 4 && first < 0; r++) {
      for (let dx = -r; dx <= r && first < 0; dx++) {
        for (let dy = -r; dy <= r; dy++) {
          const x = sx + dx;
          const y = sy + dy;
          if (x >= 0 && y >= 0 && x < cols && y < rows && free[this.idx(x, y)]) {
            first = this.idx(x, y);
            break;
          }
        }
      }
    }
    if (first < 0) return reach;
    const queue = new Int32Array(cols * rows);
    let head = 0;
    let tail = 0;
    queue[tail++] = first;
    reach[first] = 1;
    while (head < tail) {
      const i = queue[head++];
      const x = i % cols;
      const y = (i - x) / cols;
      const next = [x > 0 ? i - 1 : -1, x < cols - 1 ? i + 1 : -1, y > 0 ? i - cols : -1, y < rows - 1 ? i + cols : -1];
      for (const n of next) {
        if (n >= 0 && free[n] && !reach[n]) {
          reach[n] = 1;
          queue[tail++] = n;
        }
      }
    }
    return reach;
  }

  /** Distance from a point to the nearest wide-reachable cell centre, or Infinity beyond `maxDist`. */
  distanceToWideReach(x: number, y: number, maxDist: number): number {
    const r = Math.ceil(maxDist / CELL);
    const cx = this.ix(x);
    const cy = this.iy(y);
    let best = Infinity;
    for (let ix = Math.max(0, cx - r); ix <= Math.min(this.cols - 1, cx + r); ix++) {
      for (let iy = Math.max(0, cy - r); iy <= Math.min(this.rows - 1, cy + r); iy++) {
        if (!this.wideReach[this.idx(ix, iy)]) continue;
        const d = Math.hypot(this.cx(ix) - x, this.cy(iy) - y);
        if (d < best) best = d;
      }
    }
    return best <= maxDist ? best : Infinity;
  }
}
