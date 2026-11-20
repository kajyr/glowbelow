import { TUNING } from './tuning';
import type { Vec2 } from './vec';

/**
 * The end of the journey: reaching the reef's surface, the top of the
 * world, plays the ending (issue #2). Once per visit: it plays again only
 * after the squid has swum well away from the surface, so bumping the
 * surface right after does not repeat it. Nothing is reset or lost.
 */
export class SurfaceEnding {
  private armed = true;

  constructor(private readonly surface: { x0: number; x1: number; y: number }) {}

  /** True on the step the squid reaches the surface (and the ending should play). */
  update(pos: Vec2): boolean {
    const E = TUNING.ending;
    const below = this.surface.y - pos.y;
    if (below > E.rearm) this.armed = true;
    const inside = pos.x >= this.surface.x0 && pos.x <= this.surface.x1;
    if (this.armed && inside && below <= E.reach) {
      this.armed = false;
      return true;
    }
    return false;
  }
}
