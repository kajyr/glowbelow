import type { RingChain } from '../levels/rings';
import type { Body } from './steering';
import { TUNING } from './tuning';

export type RingEvent =
  /** Passed through a ring: `step` is its place in the current run (0, 1, 2… rising notes). */
  | { kind: 'ring'; chain: number; ring: number; step: number }
  /** Every ring of a chain in a row: a little flourish. */
  | { kind: 'flourish'; chain: number };

interface RingState {
  /** Counts down while popped; 0 when whole. */
  popped: number;
}

/**
 * Bubble rings: swimming through one pops it with a short push of speed along
 * the swim and a note; the next ring of the chain plays the next note up, and
 * a whole chain in a row ends with a flourish (either direction). Popped rings
 * grow back after a few seconds. Nothing is counted or saved: they are a toy.
 */
export class BubbleRings {
  readonly state: RingState[][];
  /** The run in progress: which chain, the last ring passed, how many in a row, the way it goes. */
  private run: { chain: number; last: number; count: number; dir: number; since: number } | null = null;

  constructor(readonly chains: RingChain[]) {
    this.state = chains.map((c) => c.rings.map(() => ({ popped: 0 })));
  }

  /** Whole (1) or popped and growing back (0 → 1), for the view. */
  whole(chain: number, ring: number): number {
    const p = this.state[chain][ring].popped;
    return p <= 0 ? 1 : 1 - p / TUNING.rings.regrow;
  }

  update(dt: number, body: Body): RingEvent[] {
    const R = TUNING.rings;
    const out: RingEvent[] = [];
    for (const rings of this.state) for (const r of rings) r.popped = Math.max(0, r.popped - dt);
    if (this.run) {
      this.run.since += dt;
      if (this.run.since > R.chainGap) this.run = null;
    }
    this.chains.forEach((c, ci) => {
      c.rings.forEach((p, ri) => {
        const st = this.state[ci][ri];
        if (st.popped > 0 || Math.hypot(body.pos.x - p.x, body.pos.y - p.y) > R.hitRadius) return;
        st.popped = R.regrow;
        // A short push along the way the squid swims.
        const v = Math.hypot(body.vel.x, body.vel.y);
        if (v > 1e-6) {
          body.vel.x += (body.vel.x / v) * R.push;
          body.vel.y += (body.vel.y / v) * R.push;
        }
        // The run goes on with the neighbouring ring, in the same direction.
        const r = this.run;
        const d = r && r.chain === ci ? ri - r.last : 0;
        if (r && r.chain === ci && Math.abs(d) === 1 && (r.count === 1 || d === r.dir)) {
          this.run = { chain: ci, last: ri, count: r.count + 1, dir: d, since: 0 };
        } else {
          this.run = { chain: ci, last: ri, count: 1, dir: 0, since: 0 };
        }
        out.push({ kind: 'ring', chain: ci, ring: ri, step: this.run.count - 1 });
        if (this.run.count === c.rings.length) {
          out.push({ kind: 'flourish', chain: ci });
          this.run = null;
        }
      });
    });
    return out;
  }
}
