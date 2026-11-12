import type { Block } from '../game/collision';
import type { Rect } from '../game/sparkleField';
import type { Vec2 } from '../game/vec';
import type { Level } from './level';
import type { Placement } from './pieces';

/** A zone placed in the shared world space. */
export interface ZonePlacement {
  name: string;
  /** The zone's swimmable area in world coordinates. */
  rect: Rect;
  /** Where the zone's own (local) origin sits in the world. */
  offset: Vec2;
}

/** An opening shared by two zones. */
export interface Passage {
  from: string;
  to: string;
  rect: Rect;
}

/**
 * The world: zones placed in one coordinate space, the passages between
 * them, and the solid rock that fills everything else, so that collision,
 * pulses, sparkles and friends work the same everywhere and crossing a
 * border needs no hand-over.
 */
export interface WorldMap {
  bounds: Rect;
  zones: ZonePlacement[];
  passages: Passage[];
  blocks: Block[];
}

const inside = (r: Rect, p: Vec2) => p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY;

/** The zone a point is in: a passage counts as the zone it leads from; null outside every zone. */
export function zoneAt(map: WorldMap, p: Vec2): string | null {
  for (const z of map.zones) if (inside(z.rect, p)) return z.name;
  for (const pass of map.passages) if (inside(pass.rect, p)) return pass.from;
  return null;
}

const move = (p: Vec2, d: Vec2): Vec2 => ({ x: p.x + d.x, y: p.y + d.y });
const moveRect = (r: Rect, d: Vec2): Rect => ({ minX: r.minX + d.x, maxX: r.maxX + d.x, minY: r.minY + d.y, maxY: r.maxY + d.y });

/** A level moved by an offset into world coordinates. */
export function translateLevel(level: Level, d: Vec2): Level {
  return {
    ...level,
    bounds: moveRect(level.bounds, d),
    cameraBounds: moveRect(level.cameraBounds, d),
    ceilings: level.ceilings.map((c) => ({ x0: c.x0 + d.x, x1: c.x1 + d.x, y: c.y + d.y })),
    shaft: { x0: level.shaft.x0 + d.x, x1: level.shaft.x1 + d.x, softFrom: level.shaft.softFrom + d.y },
    start: move(level.start, d),
    pieces: level.pieces.map((p): Placement => ({ ...p, x: p.x + d.x, y: p.y + d.y })),
    plants: level.plants.map((p) => ({ ...p, x: p.x + d.x, y: p.y === undefined ? undefined : p.y + d.y })),
    trails: level.trails.map((t) => t.map((p) => move(p, d))),
    cave: level.cave ? { ...level.cave, x: level.cave.x + d.x, y: level.cave.y + d.y, eyes: move(level.cave.eyes, d) } : level.cave,
    bubbleVents: level.bubbleVents.map((x) => x + d.x),
    jelly: level.jelly ? { start: move(level.jelly.start, d) } : null,
    lanterns: level.lanterns?.map((p) => move(p, d)),
    fireflyGroups: level.fireflyGroups?.map((p) => move(p, d)),
    nautilus: level.nautilus ? { x: level.nautilus.x + d.x, y0: level.nautilus.y0 + d.y, y1: level.nautilus.y1 + d.y } : level.nautilus,
  };
}
