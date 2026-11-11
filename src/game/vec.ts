/** Tiny 2D vector helpers for the play plane (x right, y up). */
export interface Vec2 {
  x: number;
  y: number;
}

export const vec = (x = 0, y = 0): Vec2 => ({ x, y });
export const len = (v: Vec2): number => Math.hypot(v.x, v.y);
export const dist = (a: Vec2, b: Vec2): number => Math.hypot(a.x - b.x, a.y - b.y);
export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** Exponential smoothing factor for a rate in 1/s over dt seconds. */
export const ease = (rate: number, dt: number): number => 1 - Math.exp(-rate * dt);
