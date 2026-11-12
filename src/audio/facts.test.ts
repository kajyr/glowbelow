import { describe, expect, test } from 'vitest';
import { factSource, factText } from './facts';
import type { StampName } from '../game/worldState';

/** Stamps that can be found in the game today; each later zone adds its own. */
const FINDABLE: StampName[] = ['dumbo', 'starfish', 'phantom-jelly', 'firefly', 'lantern-jelly', 'nautilus'];

describe('fun facts', () => {
  test('every stamp that can be found has a short fact', () => {
    for (const s of FINDABLE) {
      const text = factText(s);
      expect(text, s).toBeTruthy();
      expect(text!.match(/[.!?](\s|$)/g)!.length, s).toBeLessThanOrEqual(2);
    }
  });

  test('a recording in the language wins over the device voice', () => {
    const recordings = { '../../voice/en/dumbo.mp3': '/assets/dumbo.mp3' };
    expect(factSource('dumbo', 'en', recordings)).toEqual({ kind: 'recording', url: '/assets/dumbo.mp3' });
    expect(factSource('dumbo', 'it', recordings)).toMatchObject({ kind: 'speech', lang: 'it' });
  });

  test('without a recording the device voice reads the text', () => {
    expect(factSource('firefly', 'en', {})).toEqual({ kind: 'speech', text: factText('firefly'), lang: 'en' });
  });

  test('a stamp with no fact yet stays silent', () => {
    expect(factSource('cuttlefish', 'en', {})).toBeNull();
  });
});
