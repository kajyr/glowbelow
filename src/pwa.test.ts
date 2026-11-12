import { describe, expect, test, vi } from 'vitest';

vi.mock('virtual:pwa-register', () => ({ registerSW: () => () => {} }));
const { offlineAllowed } = await import('./pwa');

const own = { target: undefined, framed: false, hostname: 'kajyr.github.io', referrer: '' };

describe('offline install', () => {
  test('on the game’s own address', () => {
    expect(offlineAllowed(own)).toBe(true);
    expect(offlineAllowed({ ...own, referrer: 'https://www.google.com/' })).toBe(true);
  });

  test('never in the itch.io build', () => {
    expect(offlineAllowed({ ...own, target: 'itch' })).toBe(false);
  });

  test('never inside a frame or on an itch host', () => {
    expect(offlineAllowed({ ...own, framed: true })).toBe(false);
    expect(offlineAllowed({ ...own, hostname: 'html-classic.itch.zone' })).toBe(false);
    expect(offlineAllowed({ ...own, hostname: 'v6p9d9t4.ssl.hwcdn.net' })).toBe(false);
    expect(offlineAllowed({ ...own, referrer: 'https://kajyr.itch.io/glow-below' })).toBe(false);
  });
});
