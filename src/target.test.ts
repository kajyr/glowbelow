import { describe, expect, test } from 'vitest';
import { isApp, offerFullPage } from './target';

describe('build target', () => {
  test('only the app build is the app', () => {
    expect(isApp('app')).toBe(true);
    expect(isApp('itch')).toBe(false);
    expect(isApp(undefined)).toBe(false);
  });

  test('"open full page" never shows in the app', () => {
    expect(offerFullPage(true, 'app')).toBe(false);
    expect(offerFullPage(false, 'app')).toBe(false);
  });

  test('"open full page" shows on the web only when saving is blocked', () => {
    expect(offerFullPage(true, 'itch')).toBe(true);
    expect(offerFullPage(true, undefined)).toBe(true);
    expect(offerFullPage(false, 'itch')).toBe(false);
  });
});
