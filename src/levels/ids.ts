import type { GameWorld } from './assembleWorld';

/**
 * The ids saved things have in the world state and the glow list. They come
 * from the order the generator makes things in, so for a seed they stay the
 * same only while the generator is unchanged (see the save's layout version).
 */
export const plantId = (i: number): string => `plant-${i}`;
export const lanternId = (i: number): string => `lantern-${i}`;
export const fireflyGroupId = (i: number): string => `firefly-${i}`;
/** Starfish ids name their zone, so the album can count them per zone. */
export const starfishId = (zone: string, i: number): string => `starfish-${zone}-${i}`;

/** A starfish's id from its place in the world's starfish list (numbered within its zone). */
export function starfishIds(spots: { zone: string }[]): string[] {
  const n: Record<string, number> = {};
  return spots.map((s) => starfishId(s.zone, (n[s.zone] = (n[s.zone] ?? -1) + 1)));
}

/** Every saved id in a world, in a stable order. */
export function worldIds(w: GameWorld): string[] {
  const l = w.level;
  return [
    ...l.plants.map((_p, i) => plantId(i)),
    ...(l.lanterns ?? []).map((_p, i) => lanternId(i)),
    ...(l.fireflyGroups ?? []).map((_p, i) => fireflyGroupId(i)),
    ...starfishIds(l.starfish ?? []),
  ];
}
