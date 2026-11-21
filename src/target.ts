/** Which build this is: `itch` for the itch.io zip, `app` inside the store apps, unset on the web. */
export type Target = 'itch' | 'app' | undefined;

export const TARGET = import.meta.env.VITE_TARGET as Target;

/** Running inside a store app (Android, later iOS). */
export function isApp(target: Target = TARGET): boolean {
  return target === 'app';
}

/**
 * The parent corner offers to open the game full page only when a frame
 * blocks saving, and never in the app: saving always works there and a
 * kids' app has no links out.
 */
export function offerFullPage(saveUnavailable: boolean, target: Target = TARGET): boolean {
  return saveUnavailable && !isApp(target);
}
