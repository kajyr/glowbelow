/**
 * The reef's colours. Corals step through the cycle when touched; the
 * cuttlefish shows one of them in its colour game, and finishing the game
 * unlocks it as a glow colour. Teal is the squid's own glow, unlocked from
 * the start and not on any coral. The game never names a colour: it shows it.
 */
export const CORAL_COLOURS = ['pink', 'amber', 'lavender', 'coral', 'sky'] as const;
export type CoralColour = (typeof CORAL_COLOURS)[number];

export const GLOW_COLOURS = ['teal', ...CORAL_COLOURS] as const;
export type GlowColour = (typeof GLOW_COLOURS)[number];

/** Pastel tints, sRGB. */
export const COLOUR_HEX: Record<GlowColour, string> = {
  teal: '#5dcaa5',
  pink: '#f49ac1',
  amber: '#f7c46c',
  lavender: '#b9a3f0',
  coral: '#f58b76',
  sky: '#7cc8f2',
};

/** Brighter versions, for the glow itself: the pulse ring and the glow button. */
export const GLOW_BRIGHT: Record<GlowColour, string> = {
  teal: '#7ff0d0',
  pink: '#ffb3d6',
  amber: '#ffd98a',
  lavender: '#cdb9ff',
  coral: '#ffa48f',
  sky: '#9adcff',
};

/** The colour after `c` in the coral cycle. */
export function nextColour(c: CoralColour): CoralColour {
  return CORAL_COLOURS[(CORAL_COLOURS.indexOf(c) + 1) % CORAL_COLOURS.length];
}

export const isGlowColour = (c: unknown): c is GlowColour => typeof c === 'string' && (GLOW_COLOURS as readonly string[]).includes(c);
export const isCoralColour = (c: unknown): c is CoralColour => typeof c === 'string' && (CORAL_COLOURS as readonly string[]).includes(c);
