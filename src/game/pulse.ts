import { TUNING } from './tuning';
import type { Vec2 } from './vec';

export type PulseKind = 'small' | 'big';

export interface Pulse {
  kind: PulseKind;
  x: number;
  y: number;
  reach: number;
  duration: number;
  age: number;
  /** Ids of targets this pulse has already reached. */
  hit: Set<string>;
}

export interface PulseTarget {
  id: string;
  x: number;
  y: number;
  /** Size of the target; it is reached when the ring touches its edge. */
  r?: number;
}

/**
 * The glow pulse: a free small pulse with a cooldown, or a big pulse of
 * about three times the reach when the meter is full. Pulses grow from the
 * squid; `sweep` reports targets as the ring reaches them.
 */
export class PulseSystem {
  readonly active: Pulse[] = [];
  private cooldown = 0;

  get ready(): boolean {
    return this.cooldown <= 0;
  }

  /** Starts a pulse at `at` if the cooldown allows. Returns it, or null. */
  trigger(at: Vec2, meterFull: boolean): Pulse | null {
    if (!this.ready) return null;
    const P = TUNING.pulse;
    const big = meterFull;
    const pulse: Pulse = {
      kind: big ? 'big' : 'small',
      x: at.x,
      y: at.y,
      reach: big ? P.bigReach : P.smallReach,
      duration: big ? P.bigDuration : P.smallDuration,
      age: 0,
      hit: new Set(),
    };
    this.active.push(pulse);
    this.cooldown = P.cooldown;
    return pulse;
  }

  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    for (const p of this.active) p.age += dt;
    // Keep finished pulses around while their light fades.
    for (let i = this.active.length - 1; i >= 0; i--) {
      if (this.active[i].age > this.active[i].duration + TUNING.pulse.lightTime) this.active.splice(i, 1);
    }
  }

  /** Targets newly reached by any pulse since the last sweep. */
  sweep(targets: PulseTarget[]): string[] {
    const reached: string[] = [];
    for (const p of this.active) {
      const radius = ringRadius(p);
      for (const t of targets) {
        if (p.hit.has(t.id)) continue;
        if (Math.hypot(t.x - p.x, t.y - p.y) - (t.r ?? 0) <= radius) {
          p.hit.add(t.id);
          if (!reached.includes(t.id)) reached.push(t.id);
        }
      }
    }
    return reached;
  }
}

/** Current radius of the ring: eases out to the full reach. */
export function ringRadius(p: Pulse): number {
  const t = Math.min(1, p.age / p.duration);
  return p.reach * (1 - (1 - t) ** 3);
}

/** Whether a point is inside the full reach of a pulse fired at `from`. */
export function inReach(from: Vec2, kind: PulseKind, point: Vec2, r = 0): boolean {
  const reach = kind === 'big' ? TUNING.pulse.bigReach : TUNING.pulse.smallReach;
  return Math.hypot(point.x - from.x, point.y - from.y) - r <= reach;
}
