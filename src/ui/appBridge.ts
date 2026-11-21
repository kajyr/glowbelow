import { isApp } from '../target';

/** What the Android activity puts on the page (see `MainActivity.kt`). */
interface GlowNative {
  keepAwake(on: boolean): void;
}

declare global {
  interface Window {
    GlowNative?: GlowNative;
    /** Called by the activity on the back button; true when something was closed. */
    __glowBack?: () => boolean;
  }
}

/** In the store app, lets the back button ask the game what to close. */
export function installBackHandler(handler: () => boolean): void {
  if (isApp()) window.__glowBack = handler;
}

let awake = false;

/** Keeps the screen on (store app only); only tells the native side when it changes. */
export function setKeepAwake(on: boolean): void {
  if (!isApp() || on === awake) return;
  awake = on;
  window.GlowNative?.keepAwake(on);
}
