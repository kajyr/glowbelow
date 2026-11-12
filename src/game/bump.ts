import { TUNING } from './tuning';
import type { Contact } from './collision';

/**
 * Decides when a contact is a bump (a fast hit): the squid spins, a sparkle
 * cloud appears, and control is locked for a moment.
 */
export class BumpState {
  /** Time left in the spin, 0 when not spinning. */
  spin = 0;
  /** Time left with steering locked. */
  lock = 0;
  private cooldown = 0;

  /** Returns true when this contact starts a bump. */
  update(contact: Contact | null, dt: number, topSpeed: number = TUNING.squid.topSpeed): boolean {
    this.spin = Math.max(0, this.spin - dt);
    this.lock = Math.max(0, this.lock - dt);
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (!contact || this.cooldown > 0) return false;
    if (contact.impactSpeed <= topSpeed * TUNING.bump.speedShare) return false;
    this.spin = TUNING.bump.spinTime;
    this.lock = TUNING.bump.lockTime;
    this.cooldown = TUNING.bump.cooldown;
    return true;
  }

  /** 0 → 1 over the spin, for the renderer. */
  get spinProgress(): number {
    return this.spin > 0 ? 1 - this.spin / TUNING.bump.spinTime : 0;
  }

  /** Locks steering for a moment without a spin (bouncing off the jelly). */
  lockBriefly(): void {
    this.lock = Math.max(this.lock, TUNING.bump.lockTime);
  }

  get locked(): boolean {
    return this.lock > 0;
  }
}
