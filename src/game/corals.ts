import type { Circle } from './collision';
import type { CoralColour } from './colours';
import type { Vec2 } from './vec';

/** A coral of the garden: its id, touch circles and the colour it has in a new world. */
export interface Coral {
  id: string;
  circles: Circle[];
  first: CoralColour;
  /** Its top edge, where a glow reaches it. */
  top: Vec2;
}

/** The id a coral has in the world state, from its place in the level's list. */
export const coralId = (i: number): string => `coral-${i}`;

/** How far past a coral's circles the squid must swim before touching it counts again. */
const REARM = 0.6;

/**
 * Touching corals. A coral counts as touched when the squid swims into it
 * (corals are not solid: it brushes past), once per visit: the squid must
 * swim clear of it before touching it again counts. Pure: the colours live
 * in the world state.
 */
export class CoralTouch {
  private readonly inside = new Set<string>();

  constructor(readonly corals: Coral[]) {}

  /** Corals the squid has just swum into. */
  update(pos: Vec2, radius: number): string[] {
    const touched: string[] = [];
    for (const c of this.corals) {
      const d = Math.min(...c.circles.map((k) => Math.hypot(pos.x - k.x, pos.y - k.y) - k.r));
      if (d < radius) {
        if (!this.inside.has(c.id)) {
          this.inside.add(c.id);
          touched.push(c.id);
        }
      } else if (d > radius + REARM) this.inside.delete(c.id);
    }
    return touched;
  }
}
