import type { Circle } from '../game/collision';
import type { Vec2 } from '../game/vec';

/**
 * The whale skeleton of Whale fall, in its own units (world units, seabed at
 * y = 0, the head toward +x). tools/make_whale_skeleton.py builds the model
 * from the same numbers; change both together and check the colliders with
 * the debug overlay (?debug, then C).
 *
 * The whale lies belly down: the spine runs high along the top, the ribs
 * hang from it with room to swim under their tips, between them and over
 * the spine. The skull rests on the seabed at the head end; the tail slopes
 * down to the seabed at the other end, behind the play plane.
 */
export const RIB_COUNT = 7;
/** Tail-most rib, then one every RIB_SPACING toward the head. */
export const RIB_X0 = -13.5;
export const RIB_SPACING = 4.5;
export const SPINE_Y = 8.4;
export const RIB_TIP_Y = 5.2;
export const RIB_R = 0.36;
/** The tip sits this far toward the head; the middle bows back toward the tail. */
export const RIB_LEAN = 0.4;
export const RIB_BOW = 0.3;
/** Where the skeleton ends, for placing it in a zone (the flat tail fluke is the far left). */
export const EXTENT = { minX: -27.5, maxX: 27.8, maxY: SPINE_Y + 0.6 };

/** A point along rib `i` (0 is the tail-most), from the spine (t = 0) to the tip (t = 1). */
export function ribPoint(i: number, t: number): Vec2 {
  const x = RIB_X0 + i * RIB_SPACING;
  return { x: x - RIB_BOW * Math.sin(Math.PI * t) + RIB_LEAN * t, y: SPINE_Y - (SPINE_Y - RIB_TIP_Y) * t };
}

/** Colliders of the whole skeleton: spine, ribs, the start of the tail, the skull. */
export function skeletonCircles(): Circle[] {
  const out: Circle[] = [];
  for (let x = -15; x <= 15; x += 1) out.push({ x, y: SPINE_Y, r: 0.55 });
  // The spine dips down into the back of the skull.
  for (let k = 1; k <= 5; k++) out.push({ x: 15 + 0.92 * k, y: SPINE_Y - 0.44 * k, r: 0.5 });
  // A big vertebra where the dip starts, so no narrow corner is left under it.
  out.push({ x: 14.9, y: SPINE_Y - 0.8, r: 0.8 });
  // The tail slopes down; only its high part is solid (lower down it is behind the play plane).
  out.push({ x: -16, y: SPINE_Y - 0.8, r: 0.5 }, { x: -17, y: SPINE_Y - 1.6, r: 0.45 });
  for (let i = 0; i < RIB_COUNT; i++) for (const t of [0.2, 0.4, 0.6, 0.8, 1]) out.push({ ...ribPoint(i, t), r: RIB_R });
  // Round the corners where each rib meets the spine (a squid-sized nook there is hard to leave).
  for (let i = 0; i < RIB_COUNT; i++) {
    const top = ribPoint(i, 0);
    out.push({ x: top.x - 0.75, y: SPINE_Y - 0.6, r: 0.45 }, { x: top.x + 0.75, y: SPINE_Y - 0.6, r: 0.45 });
  }
  out.push({ x: 21, y: 2.5, r: 2.6 }, { x: 24, y: 2.0, r: 2.1 }, { x: 19.8, y: 4.6, r: 1.5 }, { x: 26.6, y: 1.2, r: 1.2 });
  return out;
}

/** Where a pulse reaches a rib: its middle, with a size covering the whole rib. */
export function ribTarget(i: number): Circle {
  return { ...ribPoint(i, 0.5), r: (SPINE_Y - RIB_TIP_Y) / 2 + RIB_R };
}

/**
 * The giant squid's spots: asleep behind the skull, hovering above it once
 * awake (facing the tail), and the tip of the arm it offers, where the squid
 * touches it to ride.
 */
export const GIANT = { sleep: { x: 22.5, y: 3.2 }, hover: { x: 22, y: 13.5 }, arm: { x: 17, y: 11 } };
/** Kept free of rocks: above the skull, where the giant squid rises and offers its arm. */
export const GIANT_ROOM = { minX: 12, maxX: 30, minY: SPINE_Y - 1, maxY: 19 };
