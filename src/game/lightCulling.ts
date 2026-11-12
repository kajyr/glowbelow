import type { Rect } from './sparkleField';

export interface LightCandidate {
  x: number;
  y: number;
  radius: number;
  /** The squid's own light and pulses: kept before anything else. */
  priority?: boolean;
}

/** How far outside the view a light still counts, in world units. */
export const VIEW_MARGIN = 4;

/**
 * Picks the lights to use this frame from all that were asked for: lights
 * that cannot touch the view (plus a margin) are dropped, then priority
 * lights come first and the rest nearest the view centre, up to `max`. A
 * light that leaves the selection is always outside the margin, so nothing
 * visibly flickers.
 */
export function selectLights<T extends LightCandidate>(candidates: T[], view: Rect, max: number, margin = VIEW_MARGIN): T[] {
  const cx = (view.minX + view.maxX) / 2;
  const cy = (view.minY + view.maxY) / 2;
  const near = candidates.filter((c) => {
    const dx = Math.max(view.minX - c.x, 0, c.x - view.maxX);
    const dy = Math.max(view.minY - c.y, 0, c.y - view.maxY);
    return Math.hypot(dx, dy) <= c.radius + margin;
  });
  const priority = near.filter((c) => c.priority);
  const rest = near
    .filter((c) => !c.priority)
    .map((c) => ({ c, d: Math.hypot(c.x - cx, c.y - cy) }))
    .sort((a, b) => a.d - b.d)
    .map((e) => e.c);
  return [...priority, ...rest].slice(0, max);
}
