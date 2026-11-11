import { floorAt, type Ceiling, type CollisionWorld, type HeightLine } from '../game/collision';
import type { Rect } from '../game/sparkleField';
import type { Vec2 } from '../game/vec';
import { placedCircles, placedFloor, type Placement } from './pieces';

export interface PlantSpot {
  x: number;
  /** Height of the plant's base; on the seabed when left out. */
  y?: number;
  /** Turn, radians, for plants on sloping rock. */
  rot?: number;
  scale?: number;
}

/** A zone as data. Later zones are more files of this shape. */
export interface Level {
  name: string;
  /** Where the squid can swim. */
  bounds: Rect;
  /** What the camera may show. */
  cameraBounds: Rect;
  /** Lower ceilings than bounds.maxY, except where the way up is. */
  ceilings: Ceiling[];
  /** The way up: a gentle push down starts at `softFrom`. */
  shaft: { x0: number; x1: number; softFrom: number };
  start: Vec2;
  pieces: Placement[];
  plants: PlantSpot[];
  trails: Vec2[][];
  cave: { x: number; y: number; r: number; eyes: Vec2 };
  /** Spots on the seabed where bubbles rise. */
  bubbleVents: number[];
}

export interface BuiltLevel {
  level: Level;
  world: CollisionWorld;
  floor: (x: number) => number;
  plants: { id: string; x: number; y: number; rot: number; scale: number }[];
}

/** Builds the collision world and resolves plant heights. */
export function buildLevel(level: Level): BuiltLevel {
  const circles = level.pieces.flatMap(placedCircles);
  const lines = level.pieces.map(placedFloor).filter((l): l is HeightLine => l !== null);
  const floor = mergeLines(lines);
  const world: CollisionWorld = { circles, floor, bounds: level.bounds, ceilings: level.ceilings };
  const floorFn = (x: number) => floorAt(floor, x);
  const plants = level.plants.map((p, i) => ({
    id: `plant-${i}`,
    x: p.x,
    y: p.y ?? floorFn(p.x) - 0.05,
    rot: p.rot ?? 0,
    scale: p.scale ?? 1,
  }));
  return { level, world, floor: floorFn, plants };
}

/** Joins seabed segment lines into one line, highest point wins on overlaps. */
function mergeLines(lines: HeightLine[]): HeightLine {
  const xs = [...new Set(lines.flatMap((l) => l.xs))].sort((a, b) => a - b);
  const ys = xs.map((x) => {
    let best = -Infinity;
    for (const l of lines) if (x >= l.xs[0] && x <= l.xs[l.xs.length - 1]) best = Math.max(best, floorAt(l, x));
    return best;
  });
  return { xs, ys };
}
