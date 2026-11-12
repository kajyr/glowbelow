import { describe, expect, it } from 'vitest';
import { Nautilus, type NautilusEvent } from './nautilus';
import { TUNING } from './tuning';

const DT = 1 / 60;
const path = { x: 20, y0: 50, y1: 140 };
const away = { x: -100, y: 0 };
const run = (n: Nautilus, seconds: number, squid = away, onEvent?: (e: NautilusEvent, t: number) => void) => {
  for (let t = 0; t < seconds; t += DT) for (const e of n.update(DT, squid, 0.5)) onEvent?.(e, t);
};

describe('nautilus path', () => {
  it('goes from the bottom to the top and back in about a minute', () => {
    const n = new Nautilus(path);
    let topAt = -1;
    let backAt = -1;
    for (let t = 0; t < 90 && backAt < 0; t += DT) {
      n.update(DT, away, 0.5);
      if (topAt < 0 && n.pos.y >= path.y1) topAt = t;
      if (topAt >= 0 && backAt < 0 && n.pos.y <= path.y0) backAt = t;
    }
    expect(topAt).toBeGreaterThan(0);
    expect(backAt).toBeGreaterThan(topAt);
    expect(backAt).toBeLessThan(70);
  });

  it('pauses at the top, then turns to head down', () => {
    const n = new Nautilus(path);
    for (let t = 0; t < 60 && n.state !== 'pause'; t += DT) n.update(DT, away, 0.5);
    expect(n.pos.y).toBeCloseTo(path.y1, 5);
    expect(n.heading).toBe(-1);
    const y = n.pos.y;
    run(n, TUNING.nautilus.pauseTime - 0.2);
    expect(n.pos.y).toBe(y);
    run(n, 1);
    expect(n.pos.y).toBeLessThan(y);
  });

  it('never leaves its column', () => {
    const n = new Nautilus(path);
    run(n, 120);
    expect(n.pos.x).toBe(path.x);
    expect(n.pos.y).toBeGreaterThanOrEqual(path.y0);
    expect(n.pos.y).toBeLessThanOrEqual(path.y1);
  });
});

describe('nautilus sparkle trail', () => {
  it('sheds sparkles behind it while moving', () => {
    const n = new Nautilus(path);
    const sheds: NautilusEvent[] = [];
    run(n, 3, away, (e) => e.kind === 'shed' && sheds.push(e));
    expect(sheds.length).toBeGreaterThan(1);
    for (const e of sheds) if (e.kind === 'shed') expect(e.drift.y).toBeLessThan(0); // heading up, drifts down behind
  });

  it('never has more trail sparkles than the cap', () => {
    const n = new Nautilus(path);
    let most = 0;
    run(n, 200, away, () => (most = Math.max(most, n.trailCount)));
    expect(most).toBeLessThanOrEqual(TUNING.nautilus.trailCap);
    expect(most).toBe(TUNING.nautilus.trailCap);
  });

  it('sheds nothing while paused', () => {
    const n = new Nautilus(path);
    for (let t = 0; t < 60 && n.state !== 'pause'; t += DT) n.update(DT, away, 0.5);
    let sheds = 0;
    for (let t = 0; t < TUNING.nautilus.pauseTime - 0.2; t += DT) sheds += n.update(DT, away, 0.5).filter((e) => e.kind === 'shed').length;
    expect(sheds).toBe(0);
  });
});

describe('meeting and calling the nautilus', () => {
  it('the first touch is a discovery, and it happens once', () => {
    const n = new Nautilus(path);
    let met = 0;
    const squid = { x: path.x + 0.5, y: path.y0 };
    run(n, 10, squid, (e) => e.kind === 'met' && met++);
    expect(met).toBe(1);
    expect(n.found).toBe(true);
  });

  it('stops and turns to look at the squid when met', () => {
    const n = new Nautilus(path);
    n.update(DT, { x: path.x - 0.8, y: path.y0 }, 0.5);
    expect(n.state).toBe('meet');
    expect(n.facing).toBe(-1);
    const y = n.pos.y;
    run(n, TUNING.nautilus.meetTime - 0.2, away);
    expect(n.pos.y).toBe(y);
  });

  it('does not answer a call before it is found', () => {
    expect(new Nautilus(path).call(60)).toBe(false);
  });

  it('once found, a glow low down calls it down from the top toward the squid', () => {
    const n = new Nautilus(path);
    n.found = true;
    for (let t = 0; t < 60 && n.pos.y < path.y1; t += DT) n.update(DT, away, 0.5);
    expect(n.call(60)).toBe(true);
    expect(n.heading).toBe(-1);
    for (let t = 0; t < 40 && n.state === 'called'; t += DT) n.update(DT, away, 0.5);
    expect(n.pos.y).toBeCloseTo(60, 3);
    expect(n.state).toBe('pause');
  });

  it('a call is clamped to its column', () => {
    const n = new Nautilus(path);
    n.found = true;
    n.call(10);
    for (let t = 0; t < 40 && n.state === 'called'; t += DT) n.update(DT, away, 0.5);
    expect(n.pos.y).toBe(path.y0);
  });
});
