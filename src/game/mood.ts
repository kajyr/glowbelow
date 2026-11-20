/**
 * The mood of the water at a height in the world: its colour (used for the
 * background and the fog) and how much it is Twilight rather than home. Pure,
 * so the blend between zones can be tested.
 */
export interface MoodStop {
  /** World height of this stop. */
  y: number;
  /** Water colour as [r, g, b] in 0..1 (sRGB). */
  color: [number, number, number];
}

const hex = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255];

/**
 * Home's navy, then Twilight from deep blue at its bottom to lavender at its
 * top, then the Sunlit reef's bright turquoise, palest under the surface.
 */
export function worldMood(homeTop: number, twilightTop: number, reefTop = twilightTop): MoodStop[] {
  const stops: MoodStop[] = [
    { y: homeTop - 6, color: hex('#041233') },
    { y: homeTop + 6, color: hex('#08245a') },
    { y: (homeTop + twilightTop) / 2, color: hex('#1b2f78') },
    { y: twilightTop - 4, color: hex('#4a4596') },
  ];
  if (reefTop > twilightTop) stops.push({ y: twilightTop + 4, color: hex('#2f9cc4') }, { y: reefTop, color: hex('#8ad8ea') });
  return stops;
}

/** 0 below the reef, 1 in it, blending through the passage; `seabed` is the reef's seabed height. */
export function reefness(seabed: number, y: number): number {
  return Math.min(1, Math.max(0, (y - (seabed - 4)) / 8));
}

/** Whale fall's water: a soft blue, gentler and a little lighter than home's navy. */
export const WHALE_FALL_WATER: [number, number, number] = hex('#123a6b');

/** 0 in home, 1 in Whale fall, blending across the passage; `wallX` is home's left edge. */
export function whaleFallness(wallX: number, x: number): number {
  return Math.min(1, Math.max(0, (wallX + 3 - x) / 10));
}

/** Two colours mixed: 0 gives `a`, 1 gives `b`. */
export function mix(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t) as [number, number, number];
}

/** Water colour at a height: linear between stops, flat beyond the ends. */
export function moodColor(stops: MoodStop[], y: number): [number, number, number] {
  if (y <= stops[0].y) return [...stops[0].color];
  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    if (y <= b.y) {
      const t = (y - a.y) / (b.y - a.y);
      return [0, 1, 2].map((k) => a.color[k] + (b.color[k] - a.color[k]) * t) as [number, number, number];
    }
  }
  return [...stops[stops.length - 1].color];
}

/** 0 in home, 1 in Twilight, blending across the passage. */
export function twilightness(homeTop: number, y: number): number {
  return Math.min(1, Math.max(0, (y - (homeTop - 6)) / 12));
}

/**
 * Twilight water gets lighter as its lanterns are lit (up to about a quarter
 * of the way to white-lavender), so a lit Twilight is visibly brighter.
 */
export function brighten(color: [number, number, number], amount: number): [number, number, number] {
  const target = [0.62, 0.6, 0.86];
  const k = Math.min(1, Math.max(0, amount)) * 0.25;
  return [0, 1, 2].map((i) => color[i] + (target[i] - color[i]) * k) as [number, number, number];
}
