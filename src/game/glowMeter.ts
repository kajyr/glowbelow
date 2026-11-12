import { TUNING } from './tuning';

/**
 * The glow meter: about 15 sparkles fill it, a full meter stays full until
 * a big pulse empties it. Value runs from 0 to 1.
 */
export class GlowMeter {
  value = 0;
  private readonly step: number;

  constructor(toFill: number = TUNING.meter.toFill) {
    this.step = 1 / toFill;
  }

  get full(): boolean {
    return this.value >= 1 - 1e-9;
  }

  /** Adds one sparkle. Returns true if this sparkle made the meter full. */
  add(): boolean {
    if (this.full) return false;
    this.value = Math.min(1, this.value + this.step);
    if (this.value > 1 - this.step / 2) this.value = 1;
    return this.full;
  }

  empty(): void {
    this.value = 0;
  }

  /** Sparkles in the meter, as a whole number. */
  get count(): number {
    return Math.round(this.value / this.step);
  }

  /** Takes up to `n` sparkles out of the meter. Returns how many came out. */
  spill(n: number): number {
    const removed = Math.min(n, this.count);
    this.value = Math.max(0, (this.count - removed) * this.step);
    return removed;
  }
}
