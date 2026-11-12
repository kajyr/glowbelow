import { floorAt, type Circle, type HeightLine } from '../game/collision';
import { makeRng } from '../game/rng';
import type { Rect } from '../game/sparkleField';
import type { Vec2 } from '../game/vec';
import { mergeLines, type Level, type PlantSpot } from './level';
import { placedCircles, placedFloor, type PieceName, type Placement } from './pieces';
import { expectedPlants, ROCK_PIECES, SEABED_PIECES, type ZoneRecipe } from './zoneRecipe';

/** Space kept between the colliders of two rocks, comfortably over two squid widths (2.6). */
export const ROCK_GAP = 3.4;

/** Placements land on a 0.05 grid, so tiny maths differences between devices cannot change a layout. */
const q = (v: number): number => Math.round(v * 20) / 20;

export interface Bound {
  x: number;
  y: number;
  r: number;
}

/** A circle that contains all the given circles. */
export function boundOf(circles: Circle[]): Bound {
  const x = circles.reduce((s, c) => s + c.x, 0) / circles.length;
  const y = circles.reduce((s, c) => s + c.y, 0) / circles.length;
  return { x, y, r: Math.max(...circles.map((c) => Math.hypot(c.x - x, c.y - y) + c.r)) };
}

/** Distance from a point to a rectangle (0 inside). */
export function rectDistance(px: number, py: number, r: Rect): number {
  return Math.hypot(Math.max(r.minX - px, 0, px - r.maxX), Math.max(r.minY - py, 0, py - r.maxY));
}

/** An area that must stay free of colliders. */
export interface KeepOut {
  name: string;
  rect: Rect;
}

export interface CaveInfo {
  placement: Placement;
  /** Centre of the cave's inside, a spot the squid can swim to. */
  interior: Vec2;
  /** Just outside the entrance, where the first trail ends. */
  outside: Vec2;
  bound: Bound;
}

export interface Layout {
  seed: number;
  recipe: ZoneRecipe;
  /** The level, with no trails yet. */
  level: Level;
  cave: CaveInfo;
  keepOuts: KeepOut[];
  /** Which side the squid starts on: -1 left, 1 right. */
  startSide: -1 | 1;
}

const NOT_NULL = <T>(v: T | null): v is T => v !== null;

/**
 * Lays out a zone from a seed and a recipe: terrain, ceiling with the shaft,
 * start, cave, arch, rocks, plants. Returns null when a step cannot find room
 * (the caller tries another seed). Does not lay trails; see trails.ts.
 */
export function generateLayout(recipe: ZoneRecipe, seed: number, why: { step?: string } = {}): Layout | null {
  const rng = makeRng(seed);
  const rand = (a: number, b: number) => a + (b - a) * rng();
  const pick = <T>(list: T[]): T => list[Math.floor(rng() * list.length)];
  const W = recipe.width;
  const S = recipe.screen;
  const ceilY = recipe.ceilingY;

  // ---- 1. seabed: 12-unit segments, never the same one twice in a row
  const seabed: Placement[] = [];
  let prev: PieceName | null = null;
  for (let cx = 6; cx < W + 6; cx += 12) {
    let piece: PieceName;
    do piece = pick(SEABED_PIECES);
    while (piece === prev);
    prev = piece;
    seabed.push({ piece, x: cx, y: 0, mirror: rng() < 0.5 });
  }
  const floorLine: HeightLine = mergeLines(seabed.map(placedFloor).filter(NOT_NULL));
  const floor = (x: number) => floorAt(floorLine, x);
  const floorMax = (x0: number, x1: number) => {
    let m = -Infinity;
    for (let x = x0; x <= x1; x += 0.5) m = Math.max(m, floor(x));
    return m;
  };

  // ---- 2. ceiling with the shaft in the middle 60% of the width
  const sw = recipe.shaftWidth;
  const shaftX0 = q(rand(W * 0.2 - sw / 2, W * 0.8 - sw / 2));
  const shaftX1 = q(shaftX0 + sw);
  const ceiling: Placement[] = [];
  const ceilSegment = (cx: number) =>
    ceiling.push({ piece: pick(SEABED_PIECES), x: q(cx), y: ceilY + 1.4, rot: Math.PI, mirror: rng() < 0.5 });
  for (let cx = shaftX0 - 6; cx > -6; cx -= 12) ceilSegment(cx);
  for (let cx = shaftX1 + 6; cx < W + 6; cx += 12) ceilSegment(cx);

  const keepOuts: KeepOut[] = [
    { name: 'shaft', rect: { minX: shaftX0 - 2, maxX: shaftX1 + 2, minY: ceilY - 8, maxY: recipe.topY } },
  ];

  // ---- 3. start spot, on the left or right side
  const startSide: -1 | 1 = rng() < 0.5 ? -1 : 1;
  const start: Vec2 = { x: q(startSide < 0 ? rand(8, W / 4) : rand((W * 3) / 4, W - 8)), y: recipe.startY };

  // Everything with a collider is a bounding circle; rocks keep ROCK_GAP from each other.
  const solids: Bound[] = [];
  const occupied: Bound[] = [{ x: start.x, y: start.y, r: 3 }];
  const addSolid = (b: Bound) => {
    solids.push(b);
    occupied.push(b);
  };
  const fits = (b: Bound, margin = 1): boolean => {
    // Either well clear of the side walls or not at all: a squeeze between a rock and a wall is a pocket.
    if (b.x - b.r < ROCK_GAP || b.x + b.r > W - ROCK_GAP) return false;
    for (const k of keepOuts) if (rectDistance(b.x, b.y, k.rect) < b.r + margin) return false;
    for (const o of occupied) if (Math.hypot(b.x - o.x, b.y - o.y) < b.r + o.r + ROCK_GAP) return false;
    return true;
  };
  const spread = (b: Bound) => Math.min(...occupied.map((o) => Math.hypot(b.x - o.x, b.y - o.y) - b.r - o.r));
  /** Best of several random candidates: the one with the most room around it. */
  const bestOf = (tries: number, make: () => Placement): { placement: Placement; bound: Bound } | null => {
    let best: { placement: Placement; bound: Bound } | null = null;
    let bestScore = -Infinity;
    for (let t = 0; t < tries; t++) {
      const placement = make();
      const bound = boundOf(placedCircles(placement));
      if (!fits(bound)) continue;
      const score = spread(bound);
      if (score > bestScore) {
        bestScore = score;
        best = { placement, bound };
      }
    }
    return best;
  };

  // ---- 4. the cave: 2–4 screens from the start, entrance facing it
  const caveScale = recipe.cave.scale;
  const mirror = startSide < 0; // the cave lies toward the middle; its mouth faces the start
  const m = mirror ? -1 : 1;
  let cave: CaveInfo | null = null;
  for (let t = 0; t < 30 && !cave; t++) {
    const dx = rand(recipe.cave.minScreens * S.w + 2, recipe.cave.maxScreens * S.w - 2);
    const x = q(start.x - startSide * dx);
    const baseY = q(floorMax(x - 6.5, x + 6.5) - 0.1);
    const placement: Placement = { piece: 'cave', x, y: baseY, scale: caveScale, mirror };
    const bound = boundOf(placedCircles(placement));
    if (!fits(bound)) continue;
    cave = {
      placement,
      interior: { x, y: q(baseY + 2) },
      outside: { x: q(x + m * (2.9 * caveScale + 3)), y: q(baseY + 1.8) },
      bound,
    };
  }
  if (!cave) return (why.step = 'cave'), null;
  addSolid(cave.bound);
  const caveX = cave.placement.x;
  const caveBase = cave.placement.y;
  keepOuts.push(
    { name: 'cave-inside', rect: { minX: caveX - 3, maxX: caveX + 3, minY: caveBase + 0.6, maxY: caveBase + 3 } },
    {
      name: 'cave-mouth',
      rect: {
        minX: Math.min(caveX + m * 2.9 * caveScale, caveX + m * (2.9 * caveScale + 7)),
        maxX: Math.max(caveX + m * 2.9 * caveScale, caveX + m * (2.9 * caveScale + 7)),
        minY: caveBase + 0.6,
        maxY: caveBase + 2.8,
      },
    },
  );

  // ---- 5. the arch, away from the cave and the start
  let arch: { placement: Placement; bound: Bound } | null = null;
  for (let t = 0; t < 40 && !arch; t++) {
    const x = q(rand(8, W - 8));
    const placement: Placement = { piece: 'arch', x, y: q(floorMax(x - 3.5, x + 3.5) - 0.1), mirror: rng() < 0.5 };
    const bound = boundOf(placedCircles(placement));
    if (fits(bound) && Math.abs(x - start.x) >= 8) arch = { placement, bound };
  }
  if (!arch) return (why.step = 'arch'), null;
  addSolid(arch.bound);
  keepOuts.push({
    name: 'arch-opening',
    rect: { minX: arch.placement.x - 1.2, maxX: arch.placement.x + 1.2, minY: arch.placement.y + 0.4, maxY: arch.placement.y + 2 },
  });

  // ---- 6. rocks: hanging from the ceiling, on the seabed, floating in open water
  const hanging: Placement[] = [];
  for (let i = 0; i < recipe.hangingRocks; i++) {
    const r = bestOf(20, () => ({
      piece: pick(ROCK_PIECES),
      x: q(rand(5, W - 5)),
      y: q(ceilY + 1.3),
      rot: Math.PI,
      scale: q(rand(0.9, 1.5)),
      mirror: rng() < 0.5,
    }));
    if (!r) return (why.step = 'hanging'), null;
    addSolid(r.bound);
    hanging.push(r.placement);
  }

  const seabedRocks: { placement: Placement; bound: Bound }[] = [];
  for (let i = 0; i < recipe.seabedRocks; i++) {
    const r = bestOf(80, () => {
      const x = q(rand(5, W - 5));
      return { piece: pick(ROCK_PIECES), x, y: q(floor(x)), scale: q(rand(0.85, 1.35)), mirror: rng() < 0.5 };
    });
    if (!r) return (why.step = 'seabed-rock'), null;
    addSolid(r.bound);
    seabedRocks.push(r);
  }

  const floating: { placement: Placement; bound: Bound }[] = [];
  for (let i = 0; i < recipe.floatingRocks; i++) {
    const bands = recipe.floatingBands.length;
    const [lo, hi] = recipe.floatingBands[i % bands];
    // One column per pair of rocks (one per band), so they spread evenly across
    // the width. The top band stays centred in its column (it is what keeps
    // the upper water within a screen of a plant); lower bands zig-zag left
    // and right, so the rocks do not line up in a grid.
    const columns = Math.ceil(recipe.floatingRocks / bands);
    const colW = (W - 6) / columns;
    const col = Math.floor(i / bands);
    const top = i % bands === bands - 1;
    const centre = 3 + (col + 0.5 + (top ? 0 : col % 2 === 0 ? 0.3 : -0.3)) * colW;
    const r = bestOf(30, () => ({
      piece: pick(ROCK_PIECES),
      x: q(rand(centre - 0.15 * colW, centre + 0.15 * colW)),
      y: q(rand(lo, hi)),
      scale: q(rand(0.9, 1.4)),
      rot: q(rand(-0.15, 0.15)),
      mirror: rng() < 0.5,
    }));
    if (!r) return (why.step = 'floating'), null;
    addSolid(r.bound);
    floating.push(r);
  }

  // ---- 7. plants
  const plants: PlantSpot[] = [];
  /** A plant on the highest point of a set of colliders. */
  const onTop = (circles: Circle[], jitter = 0.3): PlantSpot => {
    const top = circles.reduce((a, c) => (c.y + c.r > a.y + a.r ? c : a));
    const dx = rand(-jitter, jitter) * top.r;
    return { x: q(top.x + dx), y: q(top.y + Math.sqrt(top.r * top.r - dx * dx) - 0.12) };
  };
  for (const r of seabedRocks) plants.push(onTop(placedCircles(r.placement)));
  for (const r of floating) plants.push(onTop(placedCircles(r.placement)));
  for (let i = 0; i < recipe.plants.archTop; i++) plants.push(onTop(placedCircles(arch.placement), 0));

  // Cave roof: the highest circle, then the highest one at least 3 units to the side.
  const caveCircles = placedCircles(cave.placement).sort((a, b) => b.y + b.r - (a.y + a.r));
  const roof: Circle[] = [];
  for (const c of caveCircles) if (roof.length < recipe.plants.caveRoof && roof.every((o) => Math.abs(o.x - c.x) >= 3)) roof.push(c);
  for (const c of roof) plants.push(onTop([c], 0));

  // Seabed plants, spread out and away from every solid.
  const seabedPlants: Vec2[] = [];
  for (let i = 0; i < recipe.plants.seabed; i++) {
    let best: Vec2 | null = null;
    let bestScore = -Infinity;
    for (let t = 0; t < 40; t++) {
      const x = q(rand(3, W - 3));
      const y = q(floor(x) - 0.05);
      if (solids.some((s) => Math.hypot(x - s.x, y - s.y) < s.r + 0.8)) continue;
      const score = Math.min(...seabedPlants.map((p) => Math.abs(p.x - x)), 40);
      if (score > bestScore) {
        bestScore = score;
        best = { x, y };
      }
    }
    if (!best) return (why.step = 'seabed-plant'), null;
    seabedPlants.push(best);
    plants.push(best);
  }
  if (plants.length !== expectedPlants(recipe)) return (why.step = 'plant-count'), null;

  // ---- 8. decoration behind the play plane, bubble vents
  const decor: Placement[] = [];
  for (let i = 0; i < recipe.decorRocks; i++) {
    const low = i < recipe.decorRocks * 0.6;
    decor.push({
      piece: pick(ROCK_PIECES),
      x: q(rand(-2, W + 2)),
      y: low ? 0.3 : q(rand(8, ceilY - 6)),
      z: -q(rand(4, 7.5)),
      scale: q(rand(2, 3.4)),
      rot: low ? 0 : q(rand(-0.3, 0.3)),
      mirror: rng() < 0.5,
      decor: true,
    });
  }
  // Rocks standing beside the shaft above the ceiling, so the way up reads from afar.
  decor.push(
    { piece: 'rock-4', x: q(shaftX0 - 0.8), y: q(ceilY + 2.2), z: -2, scale: 1.6, mirror: false, decor: true },
    { piece: 'rock-4', x: q(shaftX1 + 0.8), y: q(ceilY + 2.2), z: -2, scale: 1.6, mirror: true, decor: true },
  );
  const vents: number[] = [];
  for (let i = 0; i < recipe.ventCount; i++) vents.push(q(((i + 0.2 + rng() * 0.6) * W) / recipe.ventCount));

  const level: Level = {
    name: recipe.name,
    bounds: { minX: 0, maxX: W, minY: recipe.bottomY, maxY: recipe.topY },
    cameraBounds: { minX: 0, maxX: W, minY: recipe.bottomY - 0.2, maxY: recipe.topY },
    ceilings: [
      { x0: -10, x1: shaftX0, y: ceilY },
      { x0: shaftX1, x1: W + 10, y: ceilY },
    ],
    shaft: { x0: shaftX0, x1: shaftX1, softFrom: ceilY + 1.8 },
    start,
    pieces: [
      ...seabed,
      ...ceiling,
      ...hanging,
      ...seabedRocks.map((r) => r.placement),
      arch.placement,
      cave.placement,
      ...floating.map((r) => r.placement),
      ...decor,
    ],
    plants,
    trails: [],
    cave: {
      x: caveX,
      y: q(caveBase + 1.4 * caveScale),
      r: q(2.6 * caveScale),
      eyes: { x: q(caveX - m * 1.0 * caveScale), y: q(caveBase + 1.3 * caveScale) },
    },
    bubbleVents: vents,
    jelly: null, // placed after the clearance fields, see jellyArea.ts
  };
  return { seed, recipe, level, cave, keepOuts, startSide };
}
