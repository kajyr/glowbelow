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

/** Home's navy, then Twilight from deep blue at its bottom to lavender at its top. */
export function worldMood(homeTop: number, twilightTop: number): MoodStop[] {
  return [
    { y: homeTop - 6, color: hex('#041233') },
    { y: homeTop + 6, color: hex('#08245a') },
    { y: (homeTop + twilightTop) / 2, color: hex('#1b2f78') },
    { y: twilightTop, color: hex('#4a4596') },
  ];
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
