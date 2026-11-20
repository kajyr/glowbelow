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
 * version downloads in the background and waits; it takes over the next time
 * the game is hidden, so play is never interrupted.
 *
 * A home-screen app on iPad is suspended, not closed, so "the next launch"
 * may never come: the game checks for a new version each time it comes back
 * on screen, and swaps to a waiting one when it goes off screen (progress is
 * saved on the same event).
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
  let waiting = false;
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh: () => {
      waiting = true;
      if (document.visibilityState === 'hidden') void updateSW(true);
    },
    onRegisteredSW: (_url, registration) => {
      if (!registration) return;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') void registration.update().catch(() => {});
      });
    },
  });
  document.addEventListener('visibilitychange', () => {
    if (waiting && document.visibilityState === 'hidden') void updateSW(true);
  });
}
