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
  /** Outward drift of a spilled sparkle, slowing down. */
  vx: number;
  vy: number;
  /** Time before a spilled sparkle can be picked up. */
  noPickup: number;
  /** The water region the sparkle drifts in. */
  region: number;
}

/** How long spilled sparkles float out before they can be caught again. */
export const SPILL_PICKUP_DELAY = 1;

export interface FieldOptions {
  /** Where sparkles drift: one rectangle, or several water regions (one per zone). */
  bounds: Rect | Rect[];
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
  private readonly regions: Rect[];
  private readonly floor: (x: number) => number;

  constructor(opts: FieldOptions) {
    this.rng = opts.rng ?? Math.random;
    this.regions = Array.isArray(opts.bounds) ? opts.bounds : [opts.bounds];
    this.floor = opts.floor;
    const areas = this.regions.map((b) => (b.maxX - b.minX) * (b.maxY - b.minY));
    const total = areas.reduce((a, b) => a + b, 0);
    const count = opts.count ?? Math.round(total * TUNING.sparkles.density);
    for (const t of opts.trails) this.sparkles.push(this.make(t.x, t.y, 'trail', this.regionAt(t)));
    for (let i = 0; i < count; i++) {
      // Spread by area, so every region has the same density.
      let pickArea = this.rng() * total;
      let r = 0;
      while (r < areas.length - 1 && pickArea > areas[r]) pickArea -= areas[r++];
      const b = this.regions[r];
      const x = b.minX + this.rng() * (b.maxX - b.minX);
      const low = Math.max(b.minY, this.floor(x) + 0.5);
      this.sparkles.push(this.make(x, low + this.rng() * Math.max(0, b.maxY - low), 'drift', r));
    }
  }

  /** Index of the region a point is in (the nearest one if it is in none). */
  private regionAt(p: Vec2): number {
    let best = 0;
    let bestD = Infinity;
    this.regions.forEach((r, i) => {
      const d = Math.hypot(Math.max(r.minX - p.x, 0, p.x - r.maxX), Math.max(r.minY - p.y, 0, p.y - r.maxY));
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  }

  private make(x: number, y: number, kind: Sparkle['kind'], region: number): Sparkle {
    return { x, y, baseX: x, baseY: y, phase: this.rng() * Math.PI * 2, age: 0, kind, alive: true, respawnIn: 0, pulled: false, vx: 0, vy: 0, noPickup: 0, region };
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
      if (s.noPickup > 0 || s.vx !== 0 || s.vy !== 0) {
        // A spilled sparkle floats outward and slows down before it can be caught.
        s.noPickup = Math.max(0, s.noPickup - dt);
        s.baseX += s.vx * dt;
        s.baseY += s.vy * dt;
        const slow = Math.exp(-2.5 * dt);
        s.vx *= slow;
        s.vy *= slow;
        if (Math.hypot(s.vx, s.vy) < 0.05) {
          s.vx = 0;
          s.vy = 0;
        }
        if (s.noPickup > 0) {
          s.x = s.baseX;
          s.y = s.baseY;
          continue;
        }
      }
      const dx = squid.x - s.x;
      const dy = squid.y - s.y;
      const d = Math.hypot(dx, dy);
      if (d < S.collectRadius) {
        collected.push(this.take(s));
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
      if (s.y < this.floor(s.x) + 0.2 || s.y < this.regions[s.region].minY) this.recycleAtTop(s);
    }
    return collected;
  }

  /** Collects a sparkle: it disappears and comes back later from the top of the view. */
  private take(s: Sparkle): Vec2 {
    const S = TUNING.sparkles;
    s.alive = false;
    s.respawnIn = S.respawnMin + this.rng() * (S.respawnMax - S.respawnMin);
    return { x: s.x, y: s.y };
  }

  /**
   * Sparkles a friend may gather: alive, drifting (never part of a trail) and
   * not already being pulled in by the squid.
   */
  drifting(): { index: number; x: number; y: number }[] {
    const out: { index: number; x: number; y: number }[] = [];
    this.sparkles.forEach((s, index) => {
      if (s.alive && s.kind === 'drift' && !s.pulled) out.push({ index, x: s.x, y: s.y });
    });
    return out;
  }

  /**
   * Collects a drifting sparkle on a friend's behalf, exactly like a squid
   * pickup (same respawn). Returns where it was, or null if it is gone or is
   * not a drifting sparkle.
   */
  collect(index: number): Vec2 | null {
    const s = this.sparkles[index];
    if (!s || !s.alive || s.kind !== 'drift') return null;
    return this.take(s);
  }

  /**
   * Spills `n` sparkles at a point (the phantom jelly): they float out around
   * it and can be caught again after a moment, as ordinary drifting sparkles.
   * Reuses sparkles waiting to respawn, else the drifting ones farthest away,
   * so the number of sparkles never changes.
   */
  spill(at: Vec2, n: number): void {
    const waiting = this.sparkles.filter((s) => !s.alive);
    const far = this.sparkles
      .filter((s) => s.alive && s.kind === 'drift')
      .sort((a, b) => Math.hypot(b.x - at.x, b.y - at.y) - Math.hypot(a.x - at.x, a.y - at.y));
    const chosen = [...waiting, ...far].slice(0, n);
    chosen.forEach((s, i) => {
      const a = (i / Math.max(1, chosen.length)) * Math.PI * 2 + this.rng() * 0.8;
      // Floats out about 2.5–4 units before slowing to a stop.
      const speed = 6.5 + this.rng() * 3.5;
      s.kind = 'drift';
      s.alive = true;
      s.pulled = false;
      s.respawnIn = 0;
      s.region = this.regionAt(at);
      s.age = 0;
      s.x = s.baseX = at.x;
      s.y = s.baseY = at.y;
      s.vx = Math.cos(a) * speed;
      s.vy = Math.sin(a) * speed;
      s.noPickup = SPILL_PICKUP_DELAY;
    });
  }

  /**
   * Sheds one sparkle at a point, drifting gently with `drift` (the nautilus'
   * trail). Like a spill, it reuses a waiting or far-away sparkle, so the
   * number of sparkles never changes.
   */
  shed(at: Vec2, drift: Vec2): void {
    const s =
      this.sparkles.find((q) => !q.alive) ??
      this.sparkles.filter((q) => q.alive && q.kind === 'drift').sort((a, b) => Math.hypot(b.x - at.x, b.y - at.y) - Math.hypot(a.x - at.x, a.y - at.y))[0];
    if (!s) return;
    s.kind = 'drift';
    s.alive = true;
    s.pulled = false;
    s.respawnIn = 0;
    s.region = this.regionAt(at);
    s.age = 0;
    s.x = s.baseX = at.x;
    s.y = s.baseY = at.y;
    s.vx = drift.x;
    s.vy = drift.y;
    s.noPickup = 0.3;
  }

  /** A sparkle that reached the seabed starts again high in the zone. */
  private recycleAtTop(s: Sparkle) {
    const b = this.regions[s.region];
    s.baseX = b.minX + this.rng() * (b.maxX - b.minX);
    s.baseY = b.maxY - this.rng() * 2;
    s.x = s.baseX;
    s.y = s.baseY;
    s.age = 0;
  }

  private respawnInView(s: Sparkle, view: Rect) {
    // In the region the player is looking at.
    s.region = this.regionAt({ x: (view.minX + view.maxX) / 2, y: (view.minY + view.maxY) / 2 });
    const b = this.regions[s.region];
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
