import { TUNING } from './tuning';
import type { Vec2 } from './vec';

/**
 * The end of the journey (issue #2): one sunbeam pours through a gap in the
 * reef's surface, and swimming up into it plays the ending. The rest of the
 * surface is only a soft wall, so looking around the reef never ends the
 * game by accident. Once per visit: it plays again only after the squid has
 * swum well away from the sunbeam. Nothing is reset or lost.
 */
export class SurfaceEnding {
  private armed = true;

  /** `beam`: the middle of the gap, at the surface. */
  constructor(private readonly beam: Vec2) {}

  /** True on the step the squid swims up into the sunbeam (and the ending should play). */
  update(pos: Vec2): boolean {
    const E = TUNING.ending;
    if (Math.hypot(pos.x - this.beam.x, pos.y - this.beam.y) > E.rearm) this.armed = true;
    const inBeam = Math.abs(pos.x - this.beam.x) <= E.beamWidth / 2;
    if (this.armed && inBeam && this.beam.y - pos.y <= E.reach) {
      this.armed = false;
      return true;
    }
    return false;
  }
}
