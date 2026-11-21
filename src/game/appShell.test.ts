import { describe, expect, test } from 'vitest';
import { backAction, wantsAwake } from './appShell';

describe('back button', () => {
  test('closes the parent corner first', () => {
    expect(backAction({ parentOpen: true, albumOpen: true })).toBe('close-parent');
  });

  test('closes the album', () => {
    expect(backAction({ parentOpen: false, albumOpen: true })).toBe('close-album');
  });

  test('with nothing open, goes to the background (never quits)', () => {
    expect(backAction({ parentOpen: false, albumOpen: false })).toBe('background');
  });
});

describe('keep awake', () => {
  test('during play', () => {
    expect(wantsAwake({ mode: 'play', paused: false, overlayOpen: false })).toBe(true);
  });

  test('not on the title, in the album or parent corner, or held in portrait', () => {
    expect(wantsAwake({ mode: 'title', paused: false, overlayOpen: false })).toBe(false);
    expect(wantsAwake({ mode: 'play', paused: false, overlayOpen: true })).toBe(false);
    expect(wantsAwake({ mode: 'play', paused: true, overlayOpen: false })).toBe(false);
  });
});
