import { TUNING } from './tuning';
import { ease, type Vec2 } from './vec';

/** What the player is asking for this step. */
export type SteerInput =
  | { kind: 'none' }
  | { kind: 'target'; x: number; y: number } // finger or mouse held here
  | { kind: 'direction'; x: number; y: number }; // keys; any length, normalised here

export interface Body {
  pos: Vec2;
  vel: Vec2;
}

export interface SteerParams {
  topSpeed: number;
  accelRate: number;
  driftRate: number;
  stopBelow: number;
  arriveRadius: number;
  deadZone: number;
}

export const SQUID_STEER: SteerParams = TUNING.squid;

/** The velocity the player wants. */
export function wantedVelocity(body: Body, input: SteerInput, p: SteerParams = SQUID_STEER): Vec2 | null {
  if (input.kind === 'none') return null;
  if (input.kind === 'direction') {
    const l = Math.hypot(input.x, input.y);
    if (l === 0) return null;
    // Normalised, so a diagonal is exactly as fast as a straight swim.
    return { x: (input.x / l) * p.topSpeed, y: (input.y / l) * p.topSpeed };
  }
  const dx = input.x - body.pos.x;
  const dy = input.y - body.pos.y;
  const d = Math.hypot(dx, dy);
  if (d < p.deadZone) return { x: 0, y: 0 }; // hover at the finger
  const speed = p.topSpeed * Math.min(1, (d - p.deadZone) / p.arriveRadius + 0.15);
  return { x: (dx / d) * Math.min(speed, p.topSpeed), y: (dy / d) * Math.min(speed, p.topSpeed) };
}

/** Eases the velocity toward the wanted one and moves the body. Never stops dead. */
export function steer(body: Body, input: SteerInput, dt: number, p: SteerParams = SQUID_STEER): void {
  const want = wantedVelocity(body, input, p);
  const target = want ?? { x: 0, y: 0 };
  const k = ease(want ? p.accelRate : p.driftRate, dt);
  body.vel.x += (target.x - body.vel.x) * k;
  body.vel.y += (target.y - body.vel.y) * k;
  if (!want && Math.hypot(body.vel.x, body.vel.y) < p.stopBelow) {
    body.vel.x = 0;
    body.vel.y = 0;
  }
  body.pos.x += body.vel.x * dt;
  body.pos.y += body.vel.y * dt;
}
