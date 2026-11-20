import { describe, expect, test } from 'vitest';
import { brighten, mix, moodColor, reefness, twilightness, whaleFallness, worldMood } from './mood';

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

describe('whale fall mood', () => {
  test('home on its side of the passage, Whale fall on the other, blending across it', () => {
    expect(whaleFallness(0, 10)).toBe(0);
    expect(whaleFallness(0, -12)).toBe(1);
    const mid = whaleFallness(0, -2);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(1);
    // Never jumps: small steps across the passage change it a little at a time.
    for (let x = 5; x > -10; x -= 0.5) expect(Math.abs(whaleFallness(0, x) - whaleFallness(0, x - 0.5))).toBeLessThanOrEqual(0.05 + 1e-9);
  });

  test('mixing water colours', () => {
    expect(mix([0, 0, 0], [1, 0.5, 0.2], 0.5)).toEqual([0.5, 0.25, 0.1]);
  });
});

describe('sunlit reef mood', () => {
  const withReef = worldMood(44.5, 154.5, 176.5);

  test('the reef is the brightest water of all, palest under the surface', () => {
    const twilightTop = lum(moodColor(withReef, 150));
    const reefFloor = lum(moodColor(withReef, 160));
    const surface = lum(moodColor(withReef, 176));
    expect(reefFloor).toBeGreaterThan(twilightTop);
    expect(surface).toBeGreaterThan(reefFloor);
  });

  test('it blends through the passage with no jump', () => {
    let prev = moodColor(withReef, 145);
    for (let y = 145; y < 165; y += 0.25) {
      const c = moodColor(withReef, y);
      expect(Math.max(...c.map((v, i) => Math.abs(v - prev[i])))).toBeLessThan(0.02);
      prev = c;
    }
  });

  test('reefness is 0 in Twilight and 1 in the reef', () => {
    expect(reefness(154.5, 140)).toBe(0);
    expect(reefness(154.5, 154.5)).toBeCloseTo(0.5);
    expect(reefness(154.5, 165)).toBe(1);
  });
});
