import { describe, expect, test } from 'vitest';
import { inReach, PulseSystem } from './pulse';
import { TUNING } from './tuning';

const DT = 1 / 60;
const at = { x: 0, y: 0 };

describe('pulse', () => {
  test('a small pulse is free and limited to one per second', () => {
    const p = new PulseSystem();
    let fired = 0;
    // Five taps in one second.
    for (let i = 0; i < 60; i++) {
      if (i % 12 === 0 && p.trigger(at, false)) fired++;
      p.update(DT);
    }
    expect(fired).toBe(1);
    expect(p.active[0].kind).toBe('small');
  });

  test('can glow again after the cooldown', () => {
    const p = new PulseSystem();
    p.trigger(at, false);
    for (let t = 0; t < TUNING.pulse.cooldown + DT; t += DT) p.update(DT);
    expect(p.trigger(at, false)).not.toBeNull();
  });

  test('a full meter gives a big pulse with about three times the reach', () => {
    const p = new PulseSystem();
    const big = p.trigger(at, true)!;
    expect(big.kind).toBe('big');
    const ratio = TUNING.pulse.bigReach / TUNING.pulse.smallReach;
    expect(ratio).toBeGreaterThan(2.7);
    expect(ratio).toBeLessThan(3.3);
  });

  test('reach query', () => {
    expect(inReach(at, 'small', { x: TUNING.pulse.smallReach - 0.1, y: 0 })).toBe(true);
    expect(inReach(at, 'small', { x: TUNING.pulse.smallReach + 1, y: 0 })).toBe(false);
    expect(inReach(at, 'small', { x: TUNING.pulse.smallReach + 1, y: 0 }, 1.5)).toBe(true);
    expect(inReach(at, 'big', { x: TUNING.pulse.smallReach * 2.5, y: 0 })).toBe(true);
  });

  test('sweep reports each target once, near ones before far ones', () => {
    const p = new PulseSystem();
    p.trigger(at, false);
    const targets = [
      { id: 'near', x: 1, y: 0 },
      { id: 'far', x: 3.3, y: 0 },
      { id: 'out', x: 9, y: 0 },
    ];
    const order: string[] = [];
    for (let t = 0; t < 2; t += DT) {
      p.update(DT);
      order.push(...p.sweep(targets));
    }
    expect(order).toEqual(['near', 'far']);
  });

  test('sweepHits says which kind of pulse reached each target', () => {
    const small = new PulseSystem();
    small.trigger(at, false);
    const big = new PulseSystem();
    big.trigger(at, true);
    const target = [{ id: 'giant', x: 2, y: 0, r: 1 }];
    const hits = (p: PulseSystem) => {
      const out: { id: string; kind: string }[] = [];
      for (let t = 0; t < 2; t += DT) {
        p.update(DT);
        out.push(...p.sweepHits(target));
      }
      return out;
    };
    expect(hits(small)).toEqual([{ id: 'giant', kind: 'small' }]);
    expect(hits(big)).toEqual([{ id: 'giant', kind: 'big' }]);
  });
});
