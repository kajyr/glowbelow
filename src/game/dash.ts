import { SQUID_STEER, wantedVelocity, type Body, type SteerInput, type SteerParams } from './steering';
import { TUNING } from './tuning';
import type { Vec2 } from './vec';

/** Where a dash goes: the way the player is steering, or the way the squid faces when not steering. */
export function dashDirection(body: Body, input: SteerInput, facing: number): Vec2 {
  const want = wantedVelocity(body, input);
  const l = want ? Math.hypot(want.x, want.y) : 0;
  if (want && l > 1e-6) return { x: want.x / l, y: want.y / l };
  return { x: facing >= 0 ? 1 : -1, y: 0 };
}

/**
 * The optional dash: a burst of speed in a direction, with the top speed
 * raised for a moment so steering eases back down instead of clamping it,
 * and a cooldown before the next one. A dash into a wall is just a fast
 * swim into it, so it becomes an ordinary bump.
 */
export class Dash {
  private cooldown = 0;
  private boost = 0;

  get ready(): boolean {
    return this.cooldown <= 0;
  }

  /** 0 just after a dash, 1 when ready again (for the button). */
  get readiness(): number {
    return 1 - this.cooldown / TUNING.dash.cooldown;
  }

  /** Dashes along `dir` if ready. Returns true if it dashed. */
  trigger(body: Body, dir: Vec2): boolean {
    if (!this.ready) return false;
    const D = TUNING.dash;
    body.vel.x = dir.x * D.speed;
    body.vel.y = dir.y * D.speed;
    this.cooldown = D.cooldown;
    this.boost = D.boostTime;
    return true;
  }

  update(dt: number): void {
    this.cooldown = Math.max(0, this.cooldown - dt);
    this.boost = Math.max(0, this.boost - dt);
  }

  /** Steering for this step: the top speed is raised during the burst and eases back to normal. */
  params(base: SteerParams = SQUID_STEER): SteerParams {
    if (this.boost <= 0) return base;
    const k = this.boost / TUNING.dash.boostTime;
    return { ...base, topSpeed: base.topSpeed + (TUNING.dash.speed - base.topSpeed) * k };
  }
}
