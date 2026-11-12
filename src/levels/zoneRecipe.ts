import type { PieceName } from './pieces';

/**
 * What a generated zone always contains and roughly how much of it. The
 * generator places these things differently for every seed; the recipe never
 * changes with the seed. Later zones are more recipes.
 */
export interface ZoneRecipe {
  name: string;
  /** The zone spans x from 0 to `width`. */
  width: number;
  /** Height of the flat rock ceiling (the collider); the shaft goes up through it. */
  ceilingY: number;
  /** Top and bottom of the area the squid can swim in. */
  topY: number;
  bottomY: number;
  shaftWidth: number;
  /** One screen in world units, for distances measured in screens. */
  screen: { w: number; h: number };
  /** Height the squid starts at. */
  startY: number;
  cave: { scale: number; minScreens: number; maxScreens: number };
  seabedRocks: number;
  /** Floating rocks, spread over these height bands (centre heights). */
  floatingRocks: number;
  floatingBands: [number, number][];
  hangingRocks: number;
  decorRocks: number;
  /** Plants on the seabed, on top of the arch and on the cave roof. Every seabed rock and every floating rock also gets one. */
  plants: { seabed: number; archTop: number; caveRoof: number };
  ventCount: number;
}

/** Number of plants a recipe asks for. */
export function expectedPlants(r: ZoneRecipe): number {
  return r.plants.seabed + r.plants.archTop + r.plants.caveRoof + r.seabedRocks + r.floatingRocks;
}

/** Midnight home: about 8 screens wide and 4 tall, about 45 plants. */
export const MIDNIGHT_HOME: ZoneRecipe = {
  name: 'midnight-home',
  width: 128,
  ceilingY: 40,
  topY: 44.5,
  bottomY: -1,
  shaftWidth: 7.2,
  screen: { w: 16, h: 11 },
  startY: 6,
  cave: { scale: 1.5, minScreens: 2, maxScreens: 4 },
  seabedRocks: 6,
  floatingRocks: 16,
  floatingBands: [
    [10, 18],
    [24, 32],
  ],
  hangingRocks: 8,
  decorRocks: 26,
  plants: { seabed: 20, archTop: 1, caveRoof: 2 },
  ventCount: 10,
};

/** Models the generator may use. */
export const SEABED_PIECES: PieceName[] = ['seabed-1', 'seabed-2', 'seabed-3'];
export const ROCK_PIECES: PieceName[] = ['rock-1', 'rock-2', 'rock-3', 'rock-4'];
