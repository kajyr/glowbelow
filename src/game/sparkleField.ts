import { TUNING } from './tuning';
import type { Vec2 } from './vec';

export interface Rect {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface Sparkle {
  x: number;
  y: number;
  /** Centre of the sideways sway. */
  baseX: number;
  /** Rest height of a trail sparkle. */
  baseY: number;
  phase: number;
  age: number;
  /** Trail sparkles hang in place; drifting ones fall. */
  kind: 'drift' | 'trail';
  alive: boolean;
  respawnIn: number;
  /** Being pulled toward the squid. */
  pulled: boolean;
}

export interface FieldOptions {
  bounds: Rect;
  floor: (x: number) => number;
  trails: Vec2[];
  /** Number of drifting sparkles; default from the zone area. */
  count?: number;
  rng?: () => number;
}

/**
 * Star-shaped marine snow: drifting sparkles that fall slowly and sway,
 * trail sparkles that hang still as breadcrumbs, and a magnet pickup around
 * the squid. Collected sparkles come back from the top of the view.
 */
export class SparkleField {
  readonly sparkles: Sparkle[] = [];
  private readonly rng: () => number;
  private readonly bounds: Rect;
  private readonly floor: (x: number) => number;

  constructor(opts: FieldOptions) {
    this.rng = opts.rng ?? Math.random;
    this.bounds = opts.bounds;
    this.floor = opts.floor;
    const b = opts.bounds;
    const count = opts.count ?? Math.round((b.maxX - b.minX) * (b.maxY - b.minY) * TUNING.sparkles.density);
    for (const t of opts.trails) this.sparkles.push(this.make(t.x, t.y, 'trail'));
    for (let i = 0; i < count; i++) {
      const x = b.minX + this.rng() * (b.maxX - b.minX);
      const low = Math.max(b.minY, this.floor(x) + 0.5);
      this.sparkles.push(this.make(x, low + this.rng() * (b.maxY - low), 'drift'));
    }
  }

  private make(x: number, y: number, kind: Sparkle['kind']): Sparkle {
    return { x, y, baseX: x, baseY: y, phase: this.rng() * Math.PI * 2, age: 0, kind, alive: true, respawnIn: 0, pulled: false };
  }

  /**
   * Moves every sparkle, pulls nearby ones toward the squid, and returns the
   * positions of the sparkles collected this step. `view` is the visible part
   * of the zone; collected sparkles come back inside it, from the top.
   */
  update(dt: number, squid: Vec2, view: Rect): Vec2[] {
    const S = TUNING.sparkles;
    const collected: Vec2[] = [];
    for (const s of this.sparkles) {
      if (!s.alive) {
        s.respawnIn -= dt;
        if (s.respawnIn <= 0) this.respawnInView(s, view);
        continue;
      }
      s.age += dt;
      const dx = squid.x - s.x;
      const dy = squid.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < S.collectRadius) {
        s.alive = false;
        s.respawnIn = S.respawnMin + this.rng() * (S.respawnMax - S.respawnMin);
        collected.push({ x: s.x, y: s.y });
        continue;
      }
      if (s.pulled || d < S.magnetRadius) {
        // Once caught, keep pulling even if the squid swims on.
        s.pulled = d < S.magnetRadius * 2;
        const pull = S.magnetSpeed * dt * (1.4 - Math.min(1, d / S.magnetRadius));
        const step = Math.min(d, pull);
        s.x += (dx / d) * step;
        s.y += (dy / d) * step;
        s.baseX = s.x;
        s.baseY = s.y;
        continue;
      }
      if (s.kind === 'trail') {
        s.y = s.baseY + 0.12 * Math.sin(s.age * 1.6 + s.phase);
        s.x = s.baseX + 0.06 * Math.sin(s.age * 1.1 + s.phase);
        continue;
      }
      s.baseY -= S.fallSpeed * dt;
      s.y = s.baseY;
      s.x = s.baseX + S.sway * Math.sin(s.age * 0.9 + s.phase);
      if (s.y < this.floor(s.x) + 0.2) this.recycleAtTop(s);
    }
    return collected;
  }

  /** A sparkle that reached the seabed starts again high in the zone. */
  private recycleAtTop(s: Sparkle) {
    const b = this.bounds;
    s.baseX = b.minX + this.rng() * (b.maxX - b.minX);
    s.baseY = b.maxY - this.rng() * 2;
    s.x = s.baseX;
    s.y = s.baseY;
    s.age = 0;
  }

  private respawnInView(s: Sparkle, view: Rect) {
    const b = this.bounds;
    const minX = Math.max(b.minX + 0.5, view.minX + 0.5);
    const maxX = Math.min(b.maxX - 0.5, view.maxX - 0.5);
    const top = Math.min(b.maxY - 0.3, view.maxY - 0.2);
    s.kind = 'drift';
    s.alive = true;
    s.pulled = false;
    s.age = 0;
    s.baseX = minX + this.rng() * Math.max(0, maxX - minX);
    s.baseY = top - this.rng() * 0.8;
    s.x = s.baseX;
    s.y = s.baseY;
  }

  /** Alive sparkles inside a rectangle. */
  countIn(r: Rect): number {
    let n = 0;
    for (const s of this.sparkles) if (s.alive && s.x >= r.minX && s.x <= r.maxX && s.y >= r.minY && s.y <= r.maxY) n++;
    return n;
  }
}
