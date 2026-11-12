import type { PlantInfo, SquidInfo } from './dumboBrain';
import { nearestUnlit } from './dumboBrain';
import { Follower } from './follower';
import { TUNING } from './tuning';
import { ease, type Vec2 } from './vec';

/** A firefly group's id in the world state and the glow list. */
export const fireflyGroupId = (i: number): string => `firefly-${i}`;

export type SwarmShape = 'arrow' | 'star' | 'heart';

/** The shape a still swarm makes: an arrow with 1–2 groups, a star with 3–4, a heart with all 5. */
export function shapeFor(groups: number): SwarmShape | null {
  if (groups <= 0) return null;
  if (groups <= 2) return 'arrow';
  if (groups <= 4) return 'star';
  return 'heart';
}

/**
 * `n` spots making a shape around `centre`. The arrow sits between the squid
 * and `toward` and points at it; star and heart are drawn around the squid.
 */
export function shapePoints(shape: SwarmShape, n: number, centre: Vec2, toward: Vec2 | null): Vec2[] {
  const F = TUNING.firefly;
  const pts: Vec2[] = [];
  if (shape === 'arrow') {
    const dx = (toward?.x ?? centre.x + 1) - centre.x;
    const dy = (toward?.y ?? centre.y) - centre.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const mid = { x: centre.x + ux * F.arrowDistance, y: centre.y + uy * F.arrowDistance };
    const tip = { x: mid.x + (ux * F.arrowLength) / 2, y: mid.y + (uy * F.arrowLength) / 2 };
    // Shaft along the direction, then two barbs swept back from the tip.
    const shaft = Math.max(2, Math.round(n * 0.5));
    const barb = n - shaft;
    for (let i = 0; i < shaft; i++) {
      const t = shaft === 1 ? 0 : i / (shaft - 1);
      pts.push({ x: tip.x - ux * F.arrowLength * t, y: tip.y - uy * F.arrowLength * t });
    }
    for (let i = 0; i < barb; i++) {
      const side = i % 2 === 0 ? 1 : -1;
      const k = (Math.floor(i / 2) + 1) / (Math.ceil(barb / 2) + 1);
      const back = F.arrowLength * 0.45 * k;
      // Back along the shaft and out to one side, at 45°.
      pts.push({ x: tip.x - ux * back - uy * back * side, y: tip.y - uy * back + ux * back * side });
    }
    return pts;
  }
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    if (shape === 'star') {
      // A five-pointed star: radius swings between the points and the dips.
      const a = t + Math.PI / 2;
      const r = F.starRadius * (0.55 + 0.45 * Math.cos(5 * t));
      pts.push({ x: centre.x + Math.cos(a) * r, y: centre.y + Math.sin(a) * r });
    } else {
      // The classic heart curve, scaled to the heart radius, centred on the squid.
      const hx = 16 * Math.sin(t) ** 3;
      const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const k = F.heartRadius / 16;
      pts.push({ x: centre.x + hx * k, y: centre.y + (hy + 3) * k });
    }
  }
  return pts;
}

/** One firefly. */
export interface Firefly {
  pos: Vec2;
  vel: Vec2;
  /** The group it came from. */
  group: number;
  /** Twinkle and orbit phase. */
  phase: number;
  /** Counts down the giggly swirl after its group joins. */
  swirl: number;
}

export type SwarmEvent = { kind: 'join'; group: number; first: boolean } | null;

/**
 * The firefly squid: five groups hovering and twinkling around Twilight.
 * When a pulse reaches a group it swirls and joins the swarm, which trails
 * behind the squid in a loose cloud (its centre is a follower, like dumbo).
 * When the squid hovers still, the swarm makes a shape that depends on how
 * many groups have joined. Members ignore walls, so they never get stuck.
 */
export class Swarm {
  readonly fireflies: Firefly[] = [];
  readonly centre: Follower;
  /** Groups that have joined, in the order they joined. */
  readonly joined: number[] = [];
  /** The shape being made right now, if any. */
  shape: SwarmShape | null = null;
  /** What the arrow points at, while making one. */
  pointing: PlantInfo | null = null;
  private stillTime = 0;
  private time = 0;

  constructor(
    readonly groups: Vec2[],
    start: Vec2,
  ) {
    this.centre = new Follower(start);
    groups.forEach((g, gi) => {
      for (let k = 0; k < TUNING.firefly.perGroup; k++) {
        const phase = gi * 1.7 + k * ((Math.PI * 2) / TUNING.firefly.perGroup);
        this.fireflies.push({ pos: { x: g.x + Math.cos(phase) * 0.6, y: g.y + Math.sin(phase) * 0.6 }, vel: { x: 0, y: 0 }, group: gi, phase, swirl: 0 });
      }
    });
  }

  hasJoined(group: number): boolean {
    return this.joined.includes(group);
  }

  /** A pulse reached this group: it joins (once). `first` is true for the very first group. */
  join(group: number): SwarmEvent {
    if (group < 0 || group >= this.groups.length || this.hasJoined(group)) return null;
    this.joined.push(group);
    for (const f of this.fireflies) if (f.group === group) f.swirl = TUNING.firefly.swirlTime;
    // The centre starts where the group is, so the swarm flies off from there.
    if (this.joined.length === 1) {
      this.centre.pos.x = this.groups[group].x;
      this.centre.pos.y = this.groups[group].y;
    }
    return { kind: 'join', group, first: this.joined.length === 1 };
  }

  /** `unlit` are the lightable things the arrow may point at. */
  update(dt: number, squid: SquidInfo, unlit: PlantInfo[]): void {
    const F = TUNING.firefly;
    this.time += dt;
    const moving = Math.hypot(squid.vel.x, squid.vel.y) > F.stillSpeed;
    this.stillTime = moving ? 0 : this.stillTime + dt;
    const want = this.stillTime >= F.shapeAfter ? shapeFor(this.joined.length) : null;
    if (want !== this.shape) this.pointing = want === 'arrow' ? nearestUnlit(squid.pos, unlit) : null;
    this.shape = want;

    if (this.joined.length > 0) {
      const spot = { x: squid.pos.x - squid.facing * F.followDistance, y: squid.pos.y - F.followDrop };
      this.centre.follow(dt, spot, squid.pos, F);
    }

    const members = this.fireflies.filter((f) => this.hasJoined(f.group));
    const shapeSpots = this.shape ? shapePoints(this.shape, members.length, squid.pos, this.pointing) : null;
    let m = 0;
    for (const f of this.fireflies) {
      f.swirl = Math.max(0, f.swirl - dt);
      let target: Vec2;
      if (!this.hasJoined(f.group)) {
        // Hovering at home in a slow little orbit.
        const g = this.groups[f.group];
        const a = f.phase + this.time * 0.6;
        target = { x: g.x + Math.cos(a) * 0.6, y: g.y + Math.sin(a * 1.3) * 0.45 };
      } else if (f.swirl > 0) {
        // The giggly swirl: a quick loop around where the group was.
        const g = this.groups[f.group];
        const a = f.phase + (F.swirlTime - f.swirl) * 9;
        target = { x: g.x + Math.cos(a) * 1.1, y: g.y + Math.sin(a) * 1.1 };
      } else if (shapeSpots) {
        target = shapeSpots[m];
      } else {
        // A loose, lively cloud around the swarm centre.
        const a = f.phase + this.time * 1.4;
        const r = F.cloudRadius * (0.6 + 0.4 * Math.sin(this.time * 0.9 + f.phase * 2));
        target = { x: this.centre.pos.x + Math.cos(a) * r, y: this.centre.pos.y + Math.sin(a * 1.2) * r * 0.7 };
      }
      if (this.hasJoined(f.group)) m++;
      this.steer(f, target, members, dt);
    }
  }

  private steer(f: Firefly, target: Vec2, neighbours: Firefly[], dt: number): void {
    const F = TUNING.firefly;
    let wx = (target.x - f.pos.x) * 3;
    let wy = (target.y - f.pos.y) * 3;
    // Keep a little apart from the others, so the cloud stays airy.
    if (this.hasJoined(f.group)) {
      for (const o of neighbours) {
        if (o === f) continue;
        const dx = f.pos.x - o.pos.x;
        const dy = f.pos.y - o.pos.y;
        const d = Math.hypot(dx, dy);
        if (d > 1e-6 && d < F.separation) {
          wx += (dx / d) * (F.separation - d) * 12;
          wy += (dy / d) * (F.separation - d) * 12;
        }
      }
    }
    const s = Math.hypot(wx, wy);
    if (s > F.memberSpeed) {
      wx = (wx / s) * F.memberSpeed;
      wy = (wy / s) * F.memberSpeed;
    }
    const k = ease(F.memberRate, dt);
    f.vel.x += (wx - f.vel.x) * k;
    f.vel.y += (wy - f.vel.y) * k;
    f.pos.x += f.vel.x * dt;
    f.pos.y += f.vel.y * dt;
  }
}
