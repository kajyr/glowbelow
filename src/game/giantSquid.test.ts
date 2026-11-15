import { describe, expect, test } from 'vitest';
import { GiantSquid, type GiantEvent } from './giantSquid';

const DT = 1 / 60;
const spots = { sleep: { x: 22.5, y: 3.2 }, hover: { x: 22, y: 13.5 }, arm: { x: 17, y: 11 } };
const path = [{ x: 17, y: 11 }, { x: 40, y: 11 }, { x: 40, y: 60 }];
const far = { x: 0, y: 0 };

function run(g: GiantSquid, seconds: number, squid: () => { x: number; y: number }, steering = () => false): GiantEvent[] {
  const out: GiantEvent[] = [];
  for (let t = 0; t < seconds; t += DT) {
    const e = g.update(DT, squid(), steering());
    if (e) out.push(e);
  }
  return out;
}

describe('giant squid', () => {
  test('a small pulse makes it stir; it stays asleep', () => {
    const g = new GiantSquid(spots, () => path);
    expect(g.pulse('small')).toEqual({ kind: 'stir' });
    expect(g.stir).toBe(1);
    run(g, 3, () => far);
    expect(g.state).toBe('asleep');
    expect(g.stir).toBe(0);
  });

  test('a big pulse wakes it: it rises from behind the skull to hover above it', () => {
    const g = new GiantSquid(spots, () => path);
    expect(g.pulse('big')).toEqual({ kind: 'wake' });
    run(g, 5, () => far);
    expect(g.state).toBe('awake');
    expect(g.awake).toBe(1);
    expect(g.pos).toEqual(spots.hover);
    // Once awake, pulses do nothing more.
    expect(g.pulse('big')).toBeNull();
  });

  test('touching the arm carries the squid up the path and sets it down at the top', () => {
    const g = new GiantSquid(spots, () => path);
    g.restore();
    const events = run(g, 1, () => spots.arm);
    expect(events).toEqual([{ kind: 'board' }]);
    expect(g.riding).toBe(true);
    // The squid sits on the arm's tip (the seat) all the way up.
    const more: GiantEvent[] = [];
    for (let t = 0; t < 30; t += DT) {
      const e = g.update(DT, g.armTip, false);
      if (e) more.push(e);
      // The body stays near the seat, behind it as it travels, the arm reaching to it.
      if (g.riding) expect(Math.hypot(g.pos.x - g.armTip.x, g.pos.y - g.armTip.y)).toBeLessThan(9);
    }
    expect(more[0]).toEqual({ kind: 'drop' });
    expect(more).toContainEqual({ kind: 'home' });
    expect(g.state).toBe('awake');
  });

  test('steering away during the ride hops off, and the giant squid goes home', () => {
    const g = new GiantSquid(spots, () => path);
    g.restore();
    run(g, DT, () => spots.arm);
    let held = true;
    run(g, 1, () => g.armTip, () => held);
    held = false;
    run(g, DT * 2, () => g.armTip, () => held);
    held = true;
    const events = run(g, DT * 2, () => g.armTip, () => held);
    expect(events).toEqual([{ kind: 'hop' }]);
    expect(run(g, 30, () => far)).toContainEqual({ kind: 'home' });
  });

  test('does not board again until the squid has swum away from the arm', () => {
    const g = new GiantSquid(spots, () => path);
    g.restore();
    run(g, DT, () => spots.arm);
    // Ride all the way and come home, while the squid waits right at the arm's spot.
    run(g, 40, () => (g.riding ? g.armTip : spots.arm));
    expect(g.state).toBe('awake');
    expect(run(g, 1, () => spots.arm)).toEqual([]);
    run(g, DT, () => far);
    expect(run(g, DT, () => spots.arm)).toEqual([{ kind: 'board' }]);
  });

  test('the ride path is asked for only when first needed', () => {
    let asked = 0;
    const g = new GiantSquid(spots, () => (asked++, path));
    g.pulse('big');
    run(g, 5, () => far);
    expect(asked).toBe(0);
    run(g, DT, () => spots.arm);
    expect(asked).toBe(1);
  });
});
