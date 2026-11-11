import { describe, expect, test } from 'vitest';
import { GlowMeter } from './glowMeter';

describe('glow meter', () => {
  test('15 sparkles fill it from empty, 14 do not', () => {
    const m = new GlowMeter();
    for (let i = 0; i < 14; i++) expect(m.add()).toBe(false);
    expect(m.full).toBe(false);
    expect(m.add()).toBe(true);
    expect(m.full).toBe(true);
  });

  test('a full meter stays full when more sparkles come', () => {
    const m = new GlowMeter();
    for (let i = 0; i < 15; i++) m.add();
    expect(m.add()).toBe(false);
    expect(m.full).toBe(true);
    expect(m.value).toBe(1);
  });

  test('emptying sets it back to zero', () => {
    const m = new GlowMeter();
    for (let i = 0; i < 15; i++) m.add();
    m.empty();
    expect(m.value).toBe(0);
  });
});
