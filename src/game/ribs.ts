import { TUNING } from './tuning';
import type { Vec2 } from './vec';

/** The order notes play in when one pulse reaches several ribs at once: nearest first. */
export function ribOrder(ribs: { id: string; x: number; y: number }[], from: Vec2): string[] {
  return [...ribs].sort((a, b) => Math.hypot(a.x - from.x, a.y - from.y) - Math.hypot(b.x - from.x, b.y - from.y)).map((r) => r.id);
}

/**
 * The whale song: plays the first time every rib is lit (in any order), and
 * again whenever the squid swims along the lit ribs from the tail to the
 * head. `ribXs` are the ribs' x positions, tail first; `band` is the height
 * below which a swim counts (a little above the spine).
 */
export class WhaleSong {
  /** The first song (every rib lit) has played. */
  firstDone: boolean;
  /** The song is playing: it cannot start again yet. */
  private playing = 0;
  private passed = -1;
  private running = false;
  private gap = 0;
  private readonly dir: number;

  constructor(
    private readonly ribXs: number[],
    private readonly band: number,
    allLit: boolean,
  ) {
    this.firstDone = allLit;
    this.dir = Math.sign(ribXs[ribXs.length - 1] - ribXs[0]) || 1;
  }

  /** A rib was lit; returns true when that makes every rib lit for the first time. */
  lit(litCount: number): boolean {
    if (this.firstDone || litCount < this.ribXs.length) return false;
    this.firstDone = true;
    this.playing = TUNING.whaleFall.songTime;
    return true;
  }

  /** Ribs the squid is past, counted from the tail. */
  private past(pos: Vec2): number {
    return this.ribXs.filter((x) => (pos.x - x) * this.dir > 0).length;
  }

  /** Each step: returns true when a tail-to-head swim along the lit ribs has just finished. */
  update(dt: number, pos: Vec2, allLit: boolean): boolean {
    const W = TUNING.whaleFall;
    this.playing = Math.max(0, this.playing - dt);
    this.gap += dt;
    if (this.gap > W.runGap) this.running = false;
    if (pos.y > this.band) {
      this.running = false;
      this.passed = -1;
      return false;
    }
    const p = this.past(pos);
    if (this.passed < 0) this.passed = p;
    if (p < this.passed) this.running = false;
    else if (p > this.passed) {
      if (this.passed === 0) this.running = true;
      this.gap = 0;
    }
    this.passed = p;
    if (this.running && p === this.ribXs.length) {
      this.running = false;
      if (allLit && this.firstDone && this.playing <= 0) {
        this.playing = W.songTime;
        return true;
      }
    }
    return false;
  }
}
