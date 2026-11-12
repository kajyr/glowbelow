import { registerSW } from 'virtual:pwa-register';

export interface Where {
  /** `VITE_TARGET` at build time: `itch` for the itch.io zip. */
  target: string | undefined;
  /** Running inside another page's frame. */
  framed: boolean;
  hostname: string;
  referrer: string;
}

const ITCH = /(^|\.)(itch\.io|itch\.zone|hwcdn\.net)$/;

/**
 * Offline install belongs to the game's own address: never on the itch.io
 * build, inside a frame, or on an itch host (a safety net if the wrong build
 * is uploaded).
 */
export function offlineAllowed(w: Where): boolean {
  if (w.target === 'itch' || w.framed) return false;
  if (ITCH.test(w.hostname)) return false;
  try {
    return !ITCH.test(new URL(w.referrer).hostname);
  } catch {
    return true; // no referrer
  }
}

/**
 * Registers the service worker that keeps the whole game on the device. A new
 * version downloads in the background and waits; it takes over only on the
 * next launch, so play is never interrupted.
 */
export function registerOffline(): void {
  let framed = true;
  try {
    framed = window.top !== window.self;
  } catch {
    // A cross-origin parent: framed.
  }
  const where = { target: import.meta.env.VITE_TARGET, framed, hostname: location.hostname, referrer: document.referrer };
  if (import.meta.env.DEV || !('serviceWorker' in navigator) || !offlineAllowed(where)) return;
  registerSW({ immediate: true });
}
