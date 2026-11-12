import type { Vec2 } from '../game/vec';
import { CELL, Fields } from './clearance';
import type { Layout } from './generate';

/** Distance between sparkles along a trail. */
export const TRAIL_SPACING = 2.6;
/** A target closer than this to an existing trail needs no new trail. */
const COVERED = 14;

const SQRT2 = Math.SQRT2;

/** Nearest wide-reachable cell centre to a point, within `maxDist`. */
export function snapToReach(f: Fields, p: Vec2, maxDist = 6): Vec2 | null {
  const r = Math.ceil(maxDist / CELL);
  const cx = f.ix(p.x);
  const cy = f.iy(p.y);
  let best: Vec2 | null = null;
  let bestD = maxDist;
  for (let ix = Math.max(0, cx - r); ix <= Math.min(f.cols - 1, cx + r); ix++) {
    for (let iy = Math.max(0, cy - r); iy <= Math.min(f.rows - 1, cy + r); iy++) {
      if (!f.wideReach[f.idx(ix, iy)]) continue;
      const d = Math.hypot(f.cx(ix) - p.x, f.cy(iy) - p.y);
      if (d < bestD) {
        bestD = d;
        best = { x: f.cx(ix), y: f.cy(iy) };
      }
    }
  }
  return best;
}

/** A* over wide-reachable cells (8 directions, no corner cutting). Returns cell centres, or null. */
export function findPath(f: Fields, from: Vec2, to: Vec2): Vec2[] | null {
  const a = snapToReach(f, from);
  const b = snapToReach(f, to);
  if (!a || !b) return null;
  const { cols } = f;
  const start = f.idx(f.ix(a.x), f.iy(a.y));
  const goal = f.idx(f.ix(b.x), f.iy(b.y));
  const g = new Float32Array(f.cols * f.rows).fill(Infinity);
  const from_ = new Int32Array(f.cols * f.rows).fill(-1);
  const closed = new Uint8Array(f.cols * f.rows);
  const gx = goal % cols;
  const gy = (goal - gx) / cols;
  const h = (i: number) => {
    const dx = Math.abs((i % cols) - gx);
    const dy = Math.abs(Math.floor(i / cols) - gy);
    return Math.max(dx, dy) + (SQRT2 - 1) * Math.min(dx, dy);
  };
  // Binary min-heap of [priority, cell].
  const heap: [number, number][] = [];
  const push = (item: [number, number]) => {
    heap.push(item);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = (): [number, number] => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };
  g[start] = 0;
  push([h(start), start]);
  while (heap.length > 0) {
    const [, i] = pop();
    if (closed[i]) continue;
    closed[i] = 1;
    if (i === goal) break;
    const x = i % cols;
    const y = (i - x) / cols;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= f.cols || ny >= f.rows) continue;
        const n = f.idx(nx, ny);
        if (!f.wideReach[n] || closed[n]) continue;
        if (dx !== 0 && dy !== 0 && (!f.wideReach[f.idx(x + dx, y)] || !f.wideReach[f.idx(x, y + dy)])) continue;
        const cost = g[i] + (dx !== 0 && dy !== 0 ? SQRT2 : 1);
        if (cost < g[n]) {
          g[n] = cost;
          from_[n] = i;
          push([cost + h(n), n]);
        }
      }
    }
  }
  if (from_[goal] < 0 && goal !== start) return null;
  const path: Vec2[] = [];
  for (let i = goal; i >= 0; i = from_[i]) {
    path.push({ x: f.cx(i % cols), y: f.cy(Math.floor(i / cols)) });
    if (i === start) break;
  }
  return path.reverse();
}

/** Straightens a path: from each point, jump to the farthest point that can be reached in a clear line. */
export function simplify(f: Fields, pts: Vec2[]): Vec2[] {
  const clear = (a: Vec2, b: Vec2) => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / (CELL / 2));
    for (let k = 0; k <= n; k++) {
      const t = k / n;
      if (!f.wideReach[f.idx(f.ix(a.x + (b.x - a.x) * t), f.iy(a.y + (b.y - a.y) * t))]) return false;
    }
    return true;
  };
  const out = [pts[0]];
  let i = 0;
  while (i < pts.length - 1) {
    let j = pts.length - 1;
    while (j > i + 1 && !clear(pts[i], pts[j])) j--;
    out.push(pts[j]);
    i = j;
  }
  return out;
}

/** Points every `spacing` units along a polyline, including both ends. */
export function resample(pts: Vec2[], spacing: number): Vec2[] {
  const out: Vec2[] = [{ ...pts[0] }];
  let carry = 0;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    let d = spacing - carry;
    while (d <= len) {
      out.push({ x: a.x + ((b.x - a.x) * d) / len, y: a.y + ((b.y - a.y) * d) / len });
      d += spacing;
    }
    carry = len - (d - spacing);
  }
  const last = pts[pts.length - 1];
  const tail = out[out.length - 1];
  if (Math.hypot(last.x - tail.x, last.y - tail.y) > spacing * 0.4) out.push({ ...last });
  return out;
}

/**
 * Gives a straight trail a gentle wave so it looks like drifting snow rather
 * than a ruler line. A sparkle only moves where the water stays comfortably
 * wide; the ends stay put.
 */
export function wave(f: Fields, pts: Vec2[], amplitude = 0.7, wavelength = 9): Vec2[] {
  if (pts.length < 3) return pts;
  let along = 0;
  return pts.map((p, i) => {
    if (i === 0 || i === pts.length - 1) return p;
    along += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y);
    const a = pts[i - 1];
    const b = pts[i + 1];
    const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
    const nx = -(b.y - a.y) / len;
    const ny = (b.x - a.x) / len;
    const k = amplitude * Math.sin((along / wavelength) * Math.PI * 2);
    const moved = { x: p.x + nx * k, y: p.y + ny * k };
    return f.wideReach[f.idx(f.ix(moved.x), f.iy(moved.y))] ? moved : p;
  });
}

export interface TrailResult {
  /** Sparkle positions for each trail. */
  trails: Vec2[][];
  /** The smoothed routes, for the debug overlay. */
  paths: Vec2[][];
}

/**
 * Trails that lead somewhere: first from beside the start to the cave
 * entrance, then, from the nearest point of an existing trail, to each group
 * of plants (one per screen column) and to the foot of the shaft, unless an
 * earlier trail already comes close.
 */
export function layTrails(layout: Layout, f: Fields, spacing = TRAIL_SPACING): TrailResult {
  const { level, recipe } = layout;
  const trails: Vec2[][] = [];
  const paths: Vec2[][] = [];
  const all: Vec2[] = [];
  const add = (from: Vec2, to: Vec2): boolean => {
    const raw = findPath(f, from, to);
    if (!raw || raw.length < 2) return false;
    const path = simplify(f, raw);
    const sparkles = wave(f, resample(path, spacing));
    trails.push(sparkles);
    paths.push(path);
    all.push(...sparkles);
    return true;
  };
  const nearest = (p: Vec2): { pt: Vec2; d: number } => {
    let best = all[0];
    let bestD = Infinity;
    for (const a of all) {
      const d = Math.hypot(a.x - p.x, a.y - p.y);
      if (d < bestD) {
        bestD = d;
        best = a;
      }
    }
    return { pt: best, d: bestD };
  };

  const towardCave = Math.sign(layout.cave.interior.x - level.start.x);
  add({ x: level.start.x + towardCave * 2.2, y: level.start.y }, layout.cave.outside);

  // Targets: the centre of each group of plants.
  const groups = new Map<number, { x: number; y: number; n: number }>();
  for (const p of level.plants) {
    // One group per screen column and per height band (low and high), so trails reach the upper water too.
    const key = Math.floor(p.x / recipe.screen.w) * 2 + ((p.y ?? 0) > recipe.ceilingY / 2 - 6 ? 1 : 0);
    const g = groups.get(key) ?? { x: 0, y: 0, n: 0 };
    g.x += p.x;
    g.y += (p.y ?? 0) + 1.5;
    g.n++;
    groups.set(key, g);
  }
  const targets: Vec2[] = [...groups.values()].map((g) => ({ x: g.x / g.n, y: g.y / g.n }));
  targets.push({ x: (level.shaft.x0 + level.shaft.x1) / 2, y: recipe.ceilingY - 5 });

  // Always take the target closest to the trails so far, so trails branch outward.
  const todo = targets.map((t) => snapToReach(f, t)).filter((t): t is Vec2 => t !== null);
  while (todo.length > 0) {
    let k = 0;
    let kd = Infinity;
    todo.forEach((t, i) => {
      const d = nearest(t).d;
      if (d < kd) {
        kd = d;
        k = i;
      }
    });
    const [target] = todo.splice(k, 1);
    if (kd > COVERED) add(nearest(target).pt, target);
  }
  return { trails, paths };
}
