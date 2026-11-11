/** Inline SVG icons for the HUD and the hints. Icons only, no text. */

export const ICON_PLAY = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M24 16 L50 32 L24 48 Z" fill="currentColor" stroke="currentColor" stroke-width="5" stroke-linejoin="round"/></svg>`;

export const ICON_SOUND_ON = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18h7l10-8v28l-10-8H8z" fill="currentColor"/><path d="M31 17c3 3 3 11 0 14M35 12c6 6 6 18 0 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`;

export const ICON_SOUND_OFF = `<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M8 18h7l10-8v28l-10-8H8z" fill="currentColor"/><path d="M31 18l10 12M41 18L31 30" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round"/></svg>`;

export const ICON_ALBUM = `<svg viewBox="0 0 48 48" aria-hidden="true"><rect x="9" y="7" width="30" height="34" rx="4" fill="currentColor"/><rect x="14" y="7" width="3" height="34" fill="#0b1f4a" opacity=".35"/><path d="M28 17l2 4.2 4.6.6-3.3 3.2.8 4.6L28 27.4l-4.1 2.2.8-4.6-3.3-3.2 4.6-.6z" fill="#0b1f4a" opacity=".55"/></svg>`;

export const ICON_GLOW = `<svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="9" fill="currentColor"/><circle cx="32" cy="32" r="17" fill="none" stroke="currentColor" stroke-width="3.5" opacity=".75"/><circle cx="32" cy="32" r="25" fill="none" stroke="currentColor" stroke-width="3" opacity=".4"/></svg>`;

export const ICON_ROTATE = `<svg viewBox="0 0 120 120" aria-hidden="true"><rect x="40" y="18" width="40" height="70" rx="7" fill="none" stroke="currentColor" stroke-width="5"/><rect x="26" y="62" width="70" height="40" rx="7" fill="currentColor" opacity=".35"/><path d="M92 40a30 30 0 0 1 4 26" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/><path d="M89 62l7 6 5-9" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

/** A finger dragging: hand pointing down onto the glass with a curved trail. */
export const ICON_DRAG = `<svg viewBox="0 0 96 96" aria-hidden="true">
<path d="M14 70 C 26 52, 44 48, 58 54" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 9" opacity=".8"/>
<path d="M50 26 c0-4 6-4 6 0 v20 c0-4 6-4 6 0 v4 c0-4 6-4 6 0 v4 c0-4 6-4 6 0 v14 c0 10-6 18-16 18 h-6 c-6 0-10-3-13-8 l-9-15 c-2-4 3-7 6-4 l5 6 V26z" fill="#ffffff" stroke="#0b1f4a" stroke-width="2.5" stroke-linejoin="round"/>
<circle cx="53" cy="22" r="7" fill="none" stroke="currentColor" stroke-width="3" opacity=".7"/>
</svg>`;

const key = (x: number, y: number, w: number, label: string) =>
  `<g transform="translate(${x} ${y})"><rect width="${w}" height="26" rx="5" fill="#ffffff" stroke="#0b1f4a" stroke-width="2"/><rect y="20" width="${w}" height="6" rx="3" fill="#0b1f4a" opacity=".25"/>${label}</g>`;
const arrow = (rot: number) => `<path transform="translate(13 12) rotate(${rot})" d="M-5 3 L0 -4 L5 3 Z" fill="#0b1f4a"/>`;

/** The four arrow keys. */
export const ICON_ARROWS = `<svg viewBox="0 0 92 62" aria-hidden="true">
${key(32, 2, 26, arrow(0))}
${key(2, 32, 26, arrow(-90))}
${key(32, 32, 26, arrow(180))}
${key(62, 32, 26, arrow(90))}
</svg>`;

/** The Space bar. */
export const ICON_SPACE = `<svg viewBox="0 0 110 32" aria-hidden="true">${key(3, 3, 104, '<rect x="30" y="10" width="44" height="4" rx="2" fill="#0b1f4a" opacity=".55"/>')}</svg>`;

/** Dumbo sticker: a round orange face with big ears. */
export const STICKER_DUMBO = `<svg viewBox="0 0 80 80" aria-hidden="true">
<circle cx="40" cy="40" r="37" fill="#fff8ec" stroke="#ffffff" stroke-width="4"/>
<ellipse cx="17" cy="33" rx="9" ry="12" fill="#fac775"/><ellipse cx="63" cy="33" rx="9" ry="12" fill="#fac775"/>
<path d="M18 52 Q40 66 62 52 L62 58 Q40 70 18 58Z" fill="#d98a1c"/>
<ellipse cx="40" cy="40" rx="22" ry="20" fill="#ef9f27"/>
<circle cx="32" cy="38" r="6" fill="#fff"/><circle cx="48" cy="38" r="6" fill="#fff"/>
<circle cx="33" cy="39" r="3.4" fill="#412402"/><circle cx="49" cy="39" r="3.4" fill="#412402"/>
<circle cx="26" cy="47" r="3" fill="#f4a9a0"/><circle cx="54" cy="47" r="3" fill="#f4a9a0"/>
<path d="M36 48 Q40 51 44 48" fill="none" stroke="#854f0b" stroke-width="2" stroke-linecap="round"/>
</svg>`;
