import { TUNING } from './tuning';

export type InputKind = 'touch' | 'keyboard';

export interface HintFrame {
  /** The player is steering this step. */
  moving: boolean;
  /** Any input at all this step (steer, glow, tap). */
  anyInput: boolean;
  /** The player glowed this step. */
  glowed: boolean;
  meterFull: boolean;
  /** Input used most recently, if any this step. */
  inputKind?: InputKind;
}

/**
 * Icon-only control hints: the move hint shows at the start and fades after
 * about a second of movement; the glow hint shows when the meter is first
 * full or after 30 s, and fades after the first glow. The move hint comes
 * back after 20 s without input. Icons follow the input used last.
 */
export class Hints {
  moveVisible = true;
  glowVisible = false;
  icons: InputKind;
  private playTime = 0;
  private moveTime = 0;
  private idleTime = 0;
  private hasGlowed = false;

  constructor(initial: InputKind) {
    this.icons = initial;
  }

  update(dt: number, f: HintFrame): void {
    const H = TUNING.hints;
    this.playTime += dt;
    if (f.inputKind) this.icons = f.inputKind;

    if (f.anyInput) this.idleTime = 0;
    else this.idleTime += dt;

    if (this.moveVisible) {
      this.moveTime = f.moving ? this.moveTime + dt : this.moveTime;
      if (this.moveTime >= H.moveFadeAfter) this.moveVisible = false;
    } else if (this.idleTime >= H.idleReturn) {
      this.moveVisible = true;
      this.moveTime = 0;
    }

    if (f.glowed) {
      this.hasGlowed = true;
      this.glowVisible = false;
    } else if (!this.hasGlowed && (f.meterFull || this.playTime >= H.glowShowAfter)) {
      this.glowVisible = true;
    }
  }
}
