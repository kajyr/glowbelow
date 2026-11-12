import type { Vec2 } from './vec';

/** Kinds of things a glow pulse can reach. */
export type GlowKind = 'plant' | 'lantern' | 'cave' | 'firefly' | 'nautilus';

/**
 * Something a pulse can reach, anywhere in the world. Plants and lanterns can
 * be lit; the cave and friends react in their own way.
 */
export interface GlowTarget {
  id: string;
  kind: GlowKind;
  x: number;
  y: number;
  /** Size: reached when the ring touches its edge. */
  r: number;
}

/** Kinds that count as "unlit things" friends point at. */
export const LIGHTABLE: GlowKind[] = ['plant', 'lantern'];

/**
 * The unlit lightable thing nearest to a point, across every kind and zone,
 * or null when everything is lit.
 */
export function nearestUnlit(from: Vec2, targets: GlowTarget[], isLit: (id: string) => boolean): GlowTarget | null {
  let best: GlowTarget | null = null;
  let bestD = Infinity;
  for (const t of targets) {
    if (!LIGHTABLE.includes(t.kind) || isLit(t.id)) continue;
    const d = Math.hypot(t.x - from.x, t.y - from.y);
    if (d < bestD) {
      bestD = d;
      best = t;
    }
  }
  return best;
}
