import type { Vec2 } from '../game/vec';
import type { Level } from './level';
import type { Placement } from './pieces';

/**
 * Midnight home: the squid's home and the demo's only zone. About three
 * screens wide and two tall (a screen is about 11 units tall). Seabed along
 * the bottom, a rock ceiling with the shaft up through it, an arch, the cave
 * where dumbo hides (entrance on its left), rocks on the seabed and a few
 * floating rocks in the open water. Units are world units, x right, y up.
 */

/** Evenly spaced points along a polyline, for sparkle trails. */
function trail(points: Vec2[], spacing = 2.2): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const n = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / spacing));
    for (let k = 0; k < n; k++) out.push({ x: a.x + ((b.x - a.x) * k) / n, y: a.y + ((b.y - a.y) * k) / n });
  }
  out.push(points[points.length - 1]);
  return out;
}

const seabed: Placement[] = [
  { piece: 'seabed-1', x: -6, y: 0 },
  { piece: 'seabed-2', x: 6, y: 0 },
  { piece: 'seabed-3', x: 18, y: 0 },
  { piece: 'seabed-1', x: 30, y: 0, mirror: true },
  { piece: 'seabed-2', x: 42, y: 0, mirror: true },
  { piece: 'seabed-3', x: 54, y: 0 },
  { piece: 'seabed-1', x: 66, y: 0 },
];

// The rock ceiling: seabed segments turned upside down, with the gap of the
// shaft between x = 24 and 30.
const ceiling: Placement[] = [
  { piece: 'seabed-3', x: -6, y: 18.6, rot: Math.PI },
  { piece: 'seabed-2', x: 6, y: 18.6, rot: Math.PI },
  { piece: 'seabed-1', x: 18, y: 18.6, rot: Math.PI },
  { piece: 'seabed-3', x: 36, y: 18.6, rot: Math.PI },
  { piece: 'seabed-2', x: 48, y: 18.6, rot: Math.PI },
  { piece: 'seabed-1', x: 60, y: 18.6, rot: Math.PI },
  // Rocks hanging from the ceiling (colliders) and the shaft walls.
  { piece: 'rock-4', x: 4, y: 18.4, rot: Math.PI, scale: 1.3 },
  { piece: 'rock-2', x: 13, y: 18.2, rot: Math.PI, scale: 1.4 },
  { piece: 'rock-3', x: 23.6, y: 21.6, rot: Math.PI, scale: 1.6 },
  { piece: 'rock-3', x: 30.4, y: 21.6, rot: Math.PI, scale: 1.6, mirror: true },
  { piece: 'rock-1', x: 38, y: 18.3, rot: Math.PI, scale: 1.4 },
  { piece: 'rock-4', x: 50, y: 18.4, rot: Math.PI, scale: 1.2, mirror: true },
];

const rocks: Placement[] = [
  { piece: 'rock-2', x: 4.5, y: 0, scale: 0.8 },
  { piece: 'rock-1', x: 10, y: 0 },
  { piece: 'arch', x: 16, y: 0 },
  { piece: 'rock-3', x: 24.5, y: 0, scale: 1.2 },
  { piece: 'rock-2', x: 28, y: 0, scale: 1.1 },
  { piece: 'cave', x: 40, y: 0, mirror: true },
  { piece: 'rock-4', x: 48, y: 0 },
  { piece: 'rock-3', x: 52, y: 0, mirror: true },
  // Floating rocks in the open water, each with a plant on top.
  { piece: 'rock-2', x: 8, y: 10, scale: 1.3, rot: 0.08 },
  { piece: 'rock-4', x: 31, y: 10.5, scale: 1.1, rot: -0.1 },
  { piece: 'rock-1', x: 46, y: 9, scale: 1.2 },
];

// Background rocks for depth; no colliders.
const decor: Placement[] = [
  { piece: 'rock-4', x: 2, y: 0.3, z: -5, scale: 2.4 },
  { piece: 'rock-3', x: 20, y: 0.3, z: -6, scale: 2.6, mirror: true },
  { piece: 'rock-1', x: 34, y: 0.2, z: -4.5, scale: 2.2 },
  { piece: 'rock-4', x: 44, y: 0.3, z: -6.5, scale: 3, mirror: true },
  { piece: 'rock-2', x: 12, y: 0.4, z: -4, scale: 1.8 },
  { piece: 'rock-3', x: 57, y: 0.2, z: -5, scale: 2.5 },
  { piece: 'rock-1', x: -2, y: 0.2, z: -3.5, scale: 2 },
  { piece: 'rock-2', x: 26, y: 13, z: -7, scale: 2.4, rot: 0.2 },
];

export const MIDNIGHT_HOME: Level = {
  name: 'midnight-home',
  bounds: { minX: 0, maxX: 54, minY: -1, maxY: 21.5 },
  cameraBounds: { minX: 0, maxX: 54, minY: -1.2, maxY: 21.5 },
  ceilings: [
    { x0: -10, x1: 23.4, y: 17.2 },
    { x0: 30.6, x1: 64, y: 17.2 },
  ],
  shaft: { x0: 23.4, x1: 30.6, softFrom: 19 },
  start: { x: 5, y: 5 },
  pieces: [...seabed, ...ceiling, ...rocks, ...decor],
  plants: [
    // On the seabed.
    { x: 2.6 },
    { x: 7.6 },
    { x: 12.6 },
    { x: 13.9 },
    { x: 19.3 },
    { x: 21.8 },
    { x: 26.2 },
    { x: 31.2 },
    { x: 34.2 },
    { x: 45.6 },
    { x: 50.4 },
    { x: 53.2 },
    // On rocks, the arch and the cave roof.
    { x: 10.1, y: 1.4 },
    { x: 16, y: 4.15 },
    { x: 28.1, y: 1.05 },
    { x: 40.2, y: 4.3 },
    { x: 48, y: 1.75 },
    // On the floating rocks.
    { x: 8, y: 11.25 },
    { x: 31, y: 12.4 },
    { x: 46, y: 10.75 },
  ],
  trails: [
    // From the start, through the arch, toward the cave.
    trail([
      { x: 6.4, y: 5 },
      { x: 10, y: 3.9 },
      { x: 13.5, y: 2.2 },
      { x: 16, y: 1.8 },
      { x: 20, y: 2.6 },
      { x: 26.5, y: 3.6 },
      { x: 32, y: 2.6 },
      { x: 35.8, y: 1.5 },
    ]),
    // Up to the floating rocks.
    trail([
      { x: 6, y: 6.5 },
      { x: 7.5, y: 9 },
      { x: 8, y: 12.4 },
    ]),
    trail([
      { x: 22, y: 5.5 },
      { x: 26, y: 9 },
      { x: 30.5, y: 13.5 },
    ]),
    trail([
      { x: 44, y: 4.5 },
      { x: 45.5, y: 7 },
      { x: 46, y: 11.8 },
    ]),
  ],
  cave: { x: 40, y: 1.4, r: 2.6, eyes: { x: 41, y: 1.3 } },
  bubbleVents: [3.5, 17, 27, 43, 51],
};
