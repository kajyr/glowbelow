import type { Circle, HeightLine } from '../game/collision';

/**
 * Every environment piece the levels can place, with its model and its
 * collider in the model's own units (x right, y up, play plane at z = 0).
 * The numbers follow the shapes built by the matching tools/make_*.py script;
 * when a script changes, check its collider again with the debug overlay
 * (?debug=1, then C).
 */
export type PieceName =
  | 'rock-1'
  | 'rock-2'
  | 'rock-3'
  | 'rock-4'
  | 'seabed-1'
  | 'seabed-2'
  | 'seabed-3'
  | 'arch'
  | 'cave'
  | 'glow-plant'
  | 'ledge-1'
  | 'ledge-2'
  | 'ledge-3'
  | 'jellyfish-lantern';

export interface PieceDef {
  circles: Circle[];
  /** Seabed segments: the surface height on the play plane. */
  floor?: HeightLine;
}

const SEABED_XS = Array.from({ length: 13 }, (_, i) => i - 6);

/** Circles along the middle of an elliptical band of rock (arch and cave). */
function band(inner: [number, number], outer: [number, number], from: number, to: number, step = 0.8): Circle[] {
  const mid: [number, number] = [(inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2];
  const r = Math.min(outer[0] - inner[0], outer[1] - inner[1]) / 2 + 0.05;
  const circles: Circle[] = [];
  // Walk the ellipse in roughly even steps.
  let a = from;
  while (a <= to + 1e-6) {
    circles.push({ x: mid[0] * Math.cos(a), y: mid[1] * Math.sin(a), r });
    const speed = Math.hypot(mid[0] * Math.sin(a), mid[1] * Math.cos(a));
    a += step / speed;
  }
  circles.push({ x: mid[0] * Math.cos(to), y: mid[1] * Math.sin(to), r });
  return circles;
}

/**
 * Circles along the middle of a wall ledge (tools/make_ledges.py): from the
 * wall to the tip, as thick as the ledge, following its droop.
 */
function ledge(length: number, thick: number, tip: number, droop: number): Circle[] {
  const circles: Circle[] = [];
  const n = Math.max(3, Math.ceil(length / 0.6));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const h = thick + (tip - thick) * t;
    circles.push({ x: length * t, y: -droop * t * t, r: h / 2 + 0.05 });
  }
  return circles;
}

export const PIECES: Record<PieceName, PieceDef> = {
  // tools/make_rocks.py
  'rock-1': { circles: [{ x: 0, y: 0.55, r: 0.95 }] },
  'rock-2': {
    circles: [
      { x: -0.75, y: 0.3, r: 0.7 },
      { x: 0.75, y: 0.3, r: 0.7 },
      { x: 0, y: 0.45, r: 0.7 },
    ],
  },
  'rock-3': {
    circles: [
      { x: 0, y: 0.5, r: 0.72 },
      { x: 0.2, y: 1.3, r: 0.55 },
      { x: 0.38, y: 1.95, r: 0.38 },
    ],
  },
  'rock-4': {
    circles: [
      { x: -0.55, y: 0.65, r: 0.9 },
      { x: 0.55, y: 0.65, r: 0.9 },
      { x: 0, y: 1.3, r: 0.75 },
    ],
  },
  // tools/make_seabed.py prints these heights.
  'seabed-1': { circles: [], floor: { xs: SEABED_XS, ys: [0, 0.01, 0.1, 0.27, 0.31, 0.13, 0, 0.13, 0.31, 0.28, 0.1, 0.01, 0] } },
  'seabed-2': { circles: [], floor: { xs: SEABED_XS, ys: [0, 0, 0.05, 0.2, 0.45, 0.7, 0.8, 0.7, 0.45, 0.2, 0.05, 0, 0] } },
  'seabed-3': { circles: [], floor: { xs: SEABED_XS, ys: [0, 0.03, 0.07, 0, 0.12, 0.41, 0.29, 0.01, 0.12, 0.22, 0.07, 0, 0] } },
  // tools/make_arch.py: opening 2.2 x 3.0, outside 3.4 x 4.2.
  arch: { circles: band([2.2, 3.0], [3.4, 4.2], 0, Math.PI) },
  // tools/make_cave.py: inside 3.4 x 3.0, outside 4.6 x 4.3, wall from 50° to 180°.
  cave: { circles: band([3.4, 3.0], [4.6, 4.3], (50 * Math.PI) / 180, Math.PI) },
  'glow-plant': { circles: [] },
  // tools/make_ledges.py: built for the left wall, sticking out to +x.
  'ledge-1': { circles: ledge(3.0, 1.3, 0.6, 0.2) },
  'ledge-2': { circles: ledge(4.2, 1.6, 0.7, 0.4) },
  'ledge-3': { circles: ledge(5.4, 1.2, 0.5, -0.2) },
  // tools/make_jellyfish_lantern.py: the bell is a soft bump; tentacles are not solid.
  'jellyfish-lantern': { circles: [{ x: 0, y: 0.25, r: 0.6 }] },
};

export interface Placement {
  piece: PieceName;
  x: number;
  y: number;
  /** Depth: 0 is the play plane, negative is further from the camera. */
  z?: number;
  scale?: number;
  /** Turn around the camera axis, radians. */
  rot?: number;
  /** Flip left-right. */
  mirror?: boolean;
  /** Decoration only: no collider. Defaults to true when |z| > 1.5. */
  decor?: boolean;
}

/** World-space colliders of one placement. */
export function placedCircles(p: Placement): Circle[] {
  if (p.decor ?? Math.abs(p.z ?? 0) > 1.5) return [];
  const s = p.scale ?? 1;
  const c = Math.cos(p.rot ?? 0);
  const sn = Math.sin(p.rot ?? 0);
  return PIECES[p.piece].circles.map((k) => {
    const x = (p.mirror ? -k.x : k.x) * s;
    const y = k.y * s;
    return { x: p.x + x * c - y * sn, y: p.y + x * sn + y * c, r: k.r * s };
  });
}

/** World-space floor line of one seabed placement (no rotation). */
export function placedFloor(p: Placement): HeightLine | null {
  const f = PIECES[p.piece].floor;
  // Turned seabed segments are used as ceilings and are not a floor.
  if (!f || (p.rot ?? 0) !== 0) return null;
  const s = p.scale ?? 1;
  const pts = f.xs.map((x, i) => ({ x: p.x + (p.mirror ? -x : x) * s, y: p.y + f.ys[i] * s }));
  pts.sort((a, b) => a.x - b.x);
  return { xs: pts.map((q) => q.x), ys: pts.map((q) => q.y) };
}
