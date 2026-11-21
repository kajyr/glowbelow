/** What the store app's back button does: close what is open, else go to the background. */
export type BackAction = 'close-parent' | 'close-album' | 'background';

export function backAction(s: { parentOpen: boolean; albumOpen: boolean }): BackAction {
  if (s.parentOpen) return 'close-parent';
  if (s.albumOpen) return 'close-album';
  return 'background';
}

/** The screen stays on only while the child is actually playing. */
export function wantsAwake(s: { mode: 'title' | 'play'; paused: boolean; overlayOpen: boolean }): boolean {
  return s.mode === 'play' && !s.paused && !s.overlayOpen;
}
