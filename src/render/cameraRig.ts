import type { Rect } from '../game/sparkleField';
import { clamp, type Vec2 } from '../game/vec';
import type { Stage } from './stage';

/**
 * Side-on camera that follows the squid smoothly, never lets it leave the
 * screen, and stops at the zone edges so nothing beyond the zone is shown.
 */
export class CameraRig {
  x = 0;
  y = 0;

  constructor(
    private readonly stage: Stage,
    private readonly bounds: Rect,
  ) {}

  /** Clamp a camera centre so the view stays inside the zone. */
  private clampCentre(x: number, y: number): Vec2 {
    const { w, h } = this.stage.halfView;
    const b = this.bounds;
    const cx = b.maxX - b.minX < 2 * w ? (b.minX + b.maxX) / 2 : clamp(x, b.minX + w, b.maxX - w);
    const cy = b.maxY - b.minY < 2 * h ? (b.minY + b.maxY) / 2 : clamp(y, b.minY + h, b.maxY - h);
    return { x: cx, y: cy };
  }

  snap(target: Vec2): void {
    const c = this.clampCentre(target.x, target.y);
    this.x = c.x;
    this.y = c.y;
    this.apply();
  }

  /** Centre exactly on a point, ignoring the zone edges (title close-up). */
  centreOn(target: Vec2): void {
    this.x = target.x;
    this.y = target.y;
    this.apply();
  }

  /**
   * `holding` is true while a finger or mouse button steers: the calm window
   * is then wider, so a finger held anywhere but near the screen edge is a
   * fixed spot the squid reaches and hovers at; holding near the edge keeps
   * panning that way.
   */
  follow(target: Vec2, dt: number, holding = false): void {
    // The camera only moves when the squid leaves a calm window around the
    // centre.
    const { w, h } = this.stage.halfView;
    const winX = w * (holding ? 0.45 : 0.3);
    const winY = h * (holding ? 0.4 : 0.22);
    const wantX = clamp(this.x, target.x - winX, target.x + winX);
    const wantY = clamp(this.y, target.y - winY, target.y + winY);
    const k = 1 - Math.exp(-4 * dt);
    let x = this.x + (wantX - this.x) * k;
    let y = this.y + (wantY - this.y) * k;
    // Never let the squid get close to the screen edge.
    x = clamp(x, target.x - w * 0.6, target.x + w * 0.6);
    y = clamp(y, target.y - h * 0.55, target.y + h * 0.55);
    const c = this.clampCentre(x, y);
    // Limit the camera's own speed so leaving the title close-up glides
    // instead of jumping; the squid is much slower than this.
    const max = 14 * dt;
    this.x += clamp(c.x - this.x, -max, max);
    this.y += clamp(c.y - this.y, -max, max);
    this.apply();
  }

  private apply() {
    const cam = this.stage.camera;
    cam.position.x = this.x;
    cam.position.y = this.y;
    cam.lookAt(this.x, this.y, 0);
  }

  /** The part of the zone currently visible at the play plane. */
  view(): Rect {
    const { w, h } = this.stage.halfView;
    return { minX: this.x - w, maxX: this.x + w, minY: this.y - h, maxY: this.y + h };
  }
}
