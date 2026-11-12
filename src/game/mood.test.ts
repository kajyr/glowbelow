import { describe, expect, test } from 'vitest';
import { brighten, moodColor, twilightness, worldMood } from './mood';

const stops = worldMood(44.5, 154.5);
const lum = (c: number[]) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

describe('mood across zones', () => {
  test('home is navy, the water lightens steadily going up Twilight', () => {
    const ys = [0, 30, 44.5, 60, 90, 120, 154.5];
    const l = ys.map((y) => lum(moodColor(stops, y)));
    for (let i = 1; i < l.length; i++) expect(l[i]).toBeGreaterThanOrEqual(l[i - 1] - 1e-9);
    expect(l[l.length - 1]).toBeGreaterThan(l[0] * 3);
  });

  test('the colour changes gradually across the passage, with no jump', () => {
    let prev = moodColor(stops, 30);
    for (let y = 30; y < 60; y += 0.25) {
      const c = moodColor(stops, y);
      expect(Math.max(...c.map((v, i) => Math.abs(v - prev[i])))).toBeLessThan(0.01);
      prev = c;
    }
  });

  test('twilightness blends from home to Twilight around the passage', () => {
    expect(twilightness(44.5, 20)).toBe(0);
    expect(twilightness(44.5, 44.5)).toBeCloseTo(0.5);
    expect(twilightness(44.5, 80)).toBe(1);
  });

  test('lit lanterns brighten the water', () => {
    const c = moodColor(stops, 90);
    expect(lum(brighten(c, 1))).toBeGreaterThan(lum(brighten(c, 0.5)));
    expect(lum(brighten(c, 0.5))).toBeGreaterThan(lum(c));
  });
});
