import { makeRng } from '../game/rng';
import type { Vec2 } from '../game/vec';
import type { Fields } from './clearance';
import type { Layout } from './generate';

/** Room the jelly needs around its centre: bell above and to the sides, arms below. */
export const JELLY_BOX = { halfWidth: 0.9, up: 1.2, down: 3.2 };
const KEEP_FROM_START = 10;
const KEEP_FROM_CAVE = 8;
const SAMPLE = 0.5;

/**
 * Whether the jelly can be centred here: its whole box is comfortably wide,
 * reachable water, and it is away from the start, the cave and the shaft.
 */
export function jellyFits(layout: Layout, f: Fields, x: number, y: number): boolean {
  const { level, cave, recipe } = layout;
  if (Math.hypot(x - level.start.x, y - level.start.y) < KEEP_FROM_START) return false;
  if (Math.hypot(x - cave.outside.x, y - cave.outside.y) < KEEP_FROM_CAVE) return false;
  if (Math.hypot(x - cave.interior.x, y - cave.interior.y) < KEEP_FROM_CAVE) return false;
  const inShaftColumn = x > level.shaft.x0 - JELLY_BOX.halfWidth - 1 && x < level.shaft.x1 + JELLY_BOX.halfWidth + 1;
  if (inShaftColumn && y + JELLY_BOX.up > recipe.ceilingY - 8) return false;
  // Sample the box every SAMPLE units, always including its edges.
  const nx = Math.ceil((2 * JELLY_BOX.halfWidth) / SAMPLE);
  const ny = Math.ceil((JELLY_BOX.up + JELLY_BOX.down) / SAMPLE);
  for (let i = 0; i <= nx; i++) {
    const dx = -JELLY_BOX.halfWidth + (2 * JELLY_BOX.halfWidth * i) / nx;
    for (let j = 0; j <= ny; j++) {
      const dy = -JELLY_BOX.down + ((JELLY_BOX.up + JELLY_BOX.down) * j) / ny;
      if (!f.wideReach[f.idx(f.ix(x + dx), f.iy(y + dy))]) return false;
    }
  }
  return true;
}

/** Size of the free-area grid cells, in world units. */
const AREA_CELL = 1;
/** The jelly starts at least a screen from the squid. */
const START_DISTANCE = 16;
/** Home needs at least this much open water for the jelly, in square units. */
export const MIN_JELLY_AREA = 150;

/**
 * Where the phantom jelly may be: a coarse grid of the cells where it fits
 * (see `jellyFits`). The jelly roams inside it, so it never touches rock and
 * never enters the start area, the cave entrance or the shaft.
 */
export class JellyFreeArea {
  private readonly cols: number;
  private readonly rows: number;
  private readonly minX: number;
  private readonly minY: number;
  private readonly mask: Uint8Array;
  /** Centres of all free cells. */
  readonly cells: Vec2[] = [];

  constructor(layout: Layout, f: Fields) {
    const b = layout.level.bounds;
    this.minX = b.minX;
    this.minY = b.minY;
    this.cols = Math.ceil((b.maxX - b.minX) / AREA_CELL);
    this.rows = Math.ceil((b.maxY - b.minY) / AREA_CELL);
    this.mask = new Uint8Array(this.cols * this.rows);
    for (let iy = 0; iy < this.rows; iy++) {
      for (let ix = 0; ix < this.cols; ix++) {
        const x = this.minX + (ix + 0.5) * AREA_CELL;
        const y = this.minY + (iy + 0.5) * AREA_CELL;
        if (jellyFits(layout, f, x, y)) this.mask[iy * this.cols + ix] = 1;
      }
    }
    this.keepLargestPart();
    for (let i = 0; i < this.mask.length; i++) {
      if (this.mask[i]) this.cells.push({ x: this.minX + ((i % this.cols) + 0.5) * AREA_CELL, y: this.minY + (Math.floor(i / this.cols) + 0.5) * AREA_CELL });
    }
  }

  /**
   * Keeps only the largest connected stretch of free water. Small separate
   * pockets are dropped, so the jelly can never start in (or wander into)
   * a corner with no way out.
   */
  private keepLargestPart() {
    const { cols, rows, mask } = this;
    const label = new Int32Array(mask.length).fill(-1);
    const sizes: number[] = [];
    const queue = new Int32Array(mask.length);
    for (let i = 0; i < mask.length; i++) {
      if (!mask[i] || label[i] >= 0) continue;
      const id = sizes.length;
      let head = 0;
      let tail = 0;
      queue[tail++] = i;
      label[i] = id;
      while (head < tail) {
        const c = queue[head++];
        const x = c % cols;
        const y = (c - x) / cols;
        for (const n of [x > 0 ? c - 1 : -1, x < cols - 1 ? c + 1 : -1, y > 0 ? c - cols : -1, y < rows - 1 ? c + cols : -1]) {
          if (n >= 0 && mask[n] && label[n] < 0) {
            label[n] = id;
            queue[tail++] = n;
          }
        }
      }
      sizes.push(tail);
    }
    if (sizes.length === 0) return;
    const best = sizes.indexOf(Math.max(...sizes));
    for (let i = 0; i < mask.length; i++) if (label[i] !== best) mask[i] = 0;
  }

  /** Square units of open water the jelly can use. */
  get area(): number {
    return this.cells.length * AREA_CELL * AREA_CELL;
  }

  free(x: number, y: number): boolean {
    const ix = Math.floor((x - this.minX) / AREA_CELL);
    const iy = Math.floor((y - this.minY) / AREA_CELL);
    if (ix < 0 || iy < 0 || ix >= this.cols || iy >= this.rows) return false;
    return this.mask[iy * this.cols + ix] === 1;
  }

  private cellIndex(x: number, y: number): number {
    const ix = Math.floor((x - this.minX) / AREA_CELL);
    const iy = Math.floor((y - this.minY) / AREA_CELL);
    if (ix < 0 || iy < 0 || ix >= this.cols || iy >= this.rows) return -1;
    return iy * this.cols + ix;
  }

  /**
   * Whether every cell a straight line passes through is free. Walks the
   * grid cell by cell (not by samples), so a line cannot clip the corner of
   * a blocked cell unnoticed.
   */
  private clearLine(a: Vec2, b: Vec2): boolean {
    let ix = Math.floor((a.x - this.minX) / AREA_CELL);
    let iy = Math.floor((a.y - this.minY) / AREA_CELL);
    const ex = Math.floor((b.x - this.minX) / AREA_CELL);
    const ey = Math.floor((b.y - this.minY) / AREA_CELL);
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const stepX = Math.sign(dx);
    const stepY = Math.sign(dy);
    const cellX = (i: number) => this.minX + i * AREA_CELL;
    const cellY = (i: number) => this.minY + i * AREA_CELL;
    let tMaxX = dx !== 0 ? (cellX(ix + (stepX > 0 ? 1 : 0)) - a.x) / dx : Infinity;
    let tMaxY = dy !== 0 ? (cellY(iy + (stepY > 0 ? 1 : 0)) - a.y) / dy : Infinity;
    const tDeltaX = dx !== 0 ? AREA_CELL / Math.abs(dx) : Infinity;
    const tDeltaY = dy !== 0 ? AREA_CELL / Math.abs(dy) : Infinity;
    const ok = (x: number, y: number) => x >= 0 && y >= 0 && x < this.cols && y < this.rows && this.mask[y * this.cols + x] === 1;
    if (!ok(ix, iy)) return false;
    for (let guard = 0; (ix !== ex || iy !== ey) && guard < 10000; guard++) {
      if (Math.abs(tMaxX - tMaxY) < 1e-9) {
        // Exactly through a corner: both neighbours must be free too.
        if (!ok(ix + stepX, iy) || !ok(ix, iy + stepY)) return false;
        ix += stepX;
        iy += stepY;
        tMaxX += tDeltaX;
        tMaxY += tDeltaY;
      } else if (tMaxX < tMaxY) {
        ix += stepX;
        tMaxX += tDeltaX;
      } else {
        iy += stepY;
        tMaxY += tDeltaY;
      }
      if (!ok(ix, iy)) return false;
    }
    return true;
  }

  /**
   * A path through free water: a breadth-first search over free cells,
   * straightened wherever a clear line allows. Every point on it is free.
   */
  path(from: Vec2, to: Vec2): Vec2[] | null {
    const a = this.cellIndex(from.x, from.y);
    const b = this.cellIndex(to.x, to.y);
    if (a < 0 || b < 0 || !this.mask[a] || !this.mask[b]) return null;
    const prev = new Int32Array(this.mask.length).fill(-1);
    prev[a] = a;
    const queue = [a];
    for (let head = 0; head < queue.length && prev[b] < 0; head++) {
      const c = queue[head];
      const x = c % this.cols;
      const y = (c - x) / this.cols;
      for (const n of [x > 0 ? c - 1 : -1, x < this.cols - 1 ? c + 1 : -1, y > 0 ? c - this.cols : -1, y < this.rows - 1 ? c + this.cols : -1]) {
        if (n >= 0 && this.mask[n] && prev[n] < 0) {
          prev[n] = c;
          queue.push(n);
        }
      }
    }
    if (prev[b] < 0) return null;
    const centre = (i: number): Vec2 => ({ x: this.minX + ((i % this.cols) + 0.5) * AREA_CELL, y: this.minY + (Math.floor(i / this.cols) + 0.5) * AREA_CELL });
    const cells: Vec2[] = [];
    for (let c = b; c !== a; c = prev[c]) cells.push(centre(c));
    cells.push({ ...from });
    cells.reverse();
    // Straighten: from each point, jump to the farthest one in a clear line.
    const out: Vec2[] = [];
    let i = 0;
    while (i < cells.length - 1) {
      let j = cells.length - 1;
      while (j > i + 1 && !this.clearLine(cells[i], cells[j])) j--;
      out.push(cells[j]);
      i = j;
    }
    return out;
  }

  /** A random free cell centre, or null if there is none. */
  randomFree(rng: () => number): Vec2 | null {
    return this.cells.length > 0 ? { ...this.cells[Math.floor(rng() * this.cells.length)] } : null;
  }
}

/**
 * Where the jelly starts: a free spot at least a screen from the squid's
 * start. Uses its own random stream from the seed, so adding the jelly does
 * not change the rest of the layout. Null if there is no such spot.
 */
export function pickJellyStart(layout: Layout, area: JellyFreeArea, seed: number): Vec2 | null {
  const rng = makeRng((seed ^ 0x6a3e11b5) >>> 0);
  const s = layout.level.start;
  const far = area.cells.filter((c) => Math.hypot(c.x - s.x, c.y - s.y) >= START_DISTANCE);
  return far.length > 0 ? { ...far[Math.floor(rng() * far.length)] } : null;
}
