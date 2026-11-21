import { describe, expect, test } from 'vitest';
import { contextRuns } from './synth';

describe('audio context', () => {
  test('runs when sound is on and the game is on screen', () => {
    expect(contextRuns({ muted: false, hidden: false })).toBe(true);
  });

  test('stops when muted or off screen (an app in the background is silent)', () => {
    expect(contextRuns({ muted: true, hidden: false })).toBe(false);
    expect(contextRuns({ muted: false, hidden: true })).toBe(false);
    expect(contextRuns({ muted: true, hidden: true })).toBe(false);
  });
});
