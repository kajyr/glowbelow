import { describe, expect, test } from 'vitest';
import { Hints, type HintFrame } from './hints';

const DT = 1 / 60;
const idle: HintFrame = { moving: false, anyInput: false, glowed: false, meterFull: false };
const swim: HintFrame = { moving: true, anyInput: true, glowed: false, meterFull: false };

function run(h: Hints, f: HintFrame, seconds: number) {
  for (let t = 0; t < seconds - 1e-9; t += DT) h.update(DT, f);
}

describe('hints', () => {
  test('move hint shows at start and fades after about a second of swimming', () => {
    const h = new Hints('touch');
    expect(h.moveVisible).toBe(true);
    run(h, swim, 0.5);
    expect(h.moveVisible).toBe(true);
    run(h, swim, 0.6);
    expect(h.moveVisible).toBe(false);
  });

  test('move hint returns after 20 s idle and fades on the next movement', () => {
    const h = new Hints('touch');
    run(h, swim, 1.1);
    run(h, idle, 19);
    expect(h.moveVisible).toBe(false);
    run(h, idle, 1.1);
    expect(h.moveVisible).toBe(true);
    run(h, swim, 1.1);
    expect(h.moveVisible).toBe(false);
  });

  test('glow hint appears after 30 s of play without glowing', () => {
    const h = new Hints('keyboard');
    run(h, swim, 29);
    expect(h.glowVisible).toBe(false);
    run(h, swim, 1.1);
    expect(h.glowVisible).toBe(true);
  });

  test('glow hint appears as soon as the meter is full', () => {
    const h = new Hints('keyboard');
    run(h, swim, 5);
    h.update(DT, { ...swim, meterFull: true });
    expect(h.glowVisible).toBe(true);
  });

  test('glow hint fades after the first glow and does not return', () => {
    const h = new Hints('keyboard');
    run(h, { ...swim, meterFull: true }, 1);
    h.update(DT, { ...swim, glowed: true });
    expect(h.glowVisible).toBe(false);
    run(h, { ...idle, meterFull: true }, 40);
    expect(h.glowVisible).toBe(false);
  });

  test('icons follow the input used last', () => {
    const h = new Hints('touch');
    h.update(DT, { ...swim, inputKind: 'keyboard' });
    expect(h.icons).toBe('keyboard');
    h.update(DT, { ...swim, inputKind: 'touch' });
    expect(h.icons).toBe('touch');
  });
});
