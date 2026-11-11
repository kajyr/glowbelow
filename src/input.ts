import type { SteerInput } from './game/steering';
import type { InputKind } from './game/hints';

const KEY_DIRS: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
  KeyA: [-1, 0],
  KeyD: [1, 0],
  KeyW: [0, 1],
  KeyS: [0, -1],
};

/** Keys whose browser default (scrolling) is blocked while the game has focus. */
const BLOCKED = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown', 'Home', 'End']);

/**
 * Touch, mouse and keyboard merged into one steering input. A held pointer
 * steers toward itself; keys give a direction. Also reports glow presses
 * and which kind of input was used last.
 */
export class Input {
  private readonly keys = new Set<string>();
  /** Keys pressed since the last step, so a very short tap still counts once. */
  private readonly tapped = new Set<string>();
  private pointer: { id: number; x: number; y: number } | null = null;
  private glowQueued = false;
  private tapQueued: { x: number; y: number } | null = null;
  private pressStart: { x: number; y: number; t: number } | null = null;
  /** Input used most recently. */
  last: InputKind;
  /** Set when any input happened since the last `consume`. */
  private touched = false;
  private kindThisStep: InputKind | undefined;
  onKey: (code: string) => void = () => {};

  constructor(
    surface: HTMLElement,
    private readonly ignore: (target: EventTarget | null) => boolean,
  ) {
    this.last = matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard';

    // Positions relative to the game box, from client coordinates (offsetX
    // depends on which element is under the pointer).
    const local = (e: PointerEvent) => {
      const r = surface.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    surface.addEventListener('pointerdown', (e) => {
      if (this.ignore(e.target)) return;
      e.preventDefault();
      surface.focus({ preventScroll: true });
      if (this.pointer) return; // first finger steers
      const p = local(e);
      this.pointer = { id: e.pointerId, ...p };
      this.pressStart = { ...p, t: performance.now() };
      try {
        surface.setPointerCapture(e.pointerId);
      } catch {
        // Not every pointer can be captured; steering works without it.
      }
      // Mouse steering works like a finger, so both show the drag hint.
      this.mark('touch');
    });
    surface.addEventListener('pointermove', (e) => {
      if (this.pointer?.id !== e.pointerId) return;
      const p = local(e);
      this.pointer.x = p.x;
      this.pointer.y = p.y;
    });
    const up = (e: PointerEvent) => {
      if (this.pointer?.id !== e.pointerId) return;
      // A quick tap that hardly moved is also a tap (glow if on the squid).
      const p = local(e);
      if (this.pressStart && performance.now() - this.pressStart.t < 250 && Math.hypot(p.x - this.pressStart.x, p.y - this.pressStart.y) < 14) {
        this.tapQueued = p;
      }
      this.pointer = null;
      this.pressStart = null;
    };
    surface.addEventListener('pointerup', up);
    surface.addEventListener('pointercancel', up);

    window.addEventListener('keydown', (e) => {
      if (BLOCKED.has(e.code)) e.preventDefault();
      if (e.repeat) return;
      this.keys.add(e.code);
      this.tapped.add(e.code);
      if (e.code === 'Space') this.glowQueued = true;
      if (KEY_DIRS[e.code] || e.code === 'Space') this.mark('keyboard');
      this.onKey(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.pointer = null;
    });
  }

  private mark(kind: InputKind) {
    this.last = kind;
    this.kindThisStep = kind;
    this.touched = true;
  }

  /** Requests a glow from a button. */
  glow(kind: InputKind): void {
    this.glowQueued = true;
    this.mark(kind);
  }

  /**
   * Current steering. `toWorld` converts a pointer position (CSS pixels in
   * the surface) to the play plane.
   */
  steer(toWorld: (x: number, y: number) => { x: number; y: number }): SteerInput {
    let dx = 0;
    let dy = 0;
    for (const k of new Set([...this.keys, ...this.tapped])) {
      const d = KEY_DIRS[k];
      if (d) {
        dx += d[0];
        dy += d[1];
      }
    }
    this.tapped.clear();
    if (dx !== 0 || dy !== 0) {
      this.touched = true;
      return { kind: 'direction', x: dx, y: dy };
    }
    if (this.pointer) {
      this.touched = true;
      const w = toWorld(this.pointer.x, this.pointer.y);
      return { kind: 'target', x: w.x, y: w.y };
    }
    return { kind: 'none' };
  }

  /** Events since the last call: glow presses, taps, whether any input happened. */
  consume(): { glow: boolean; tap: { x: number; y: number } | null; any: boolean; kind: InputKind | undefined } {
    const out = { glow: this.glowQueued, tap: this.tapQueued, any: this.touched, kind: this.kindThisStep };
    this.glowQueued = false;
    this.tapQueued = null;
    this.touched = false;
    this.kindThisStep = undefined;
    return out;
  }

  /** A finger or mouse button is held on the play area. */
  get holding(): boolean {
    return this.pointer !== null;
  }

  /** Forget held keys and pointers (when pausing). */
  reset(): void {
    this.keys.clear();
    this.tapped.clear();
    this.pointer = null;
    this.glowQueued = false;
    this.tapQueued = null;
  }
}
