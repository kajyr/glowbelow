import { describe, expect, it } from 'vitest';
import { BumpState } from './bump';
import { collide, type CollisionWorld } from './collision';
import { Dash, dashDirection } from './dash';
import { steer, type Body, type SteerInput } from './steering';
import { TUNING } from './tuning';

const DT = 1 / 60;
const body = (): Body => ({ pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 } });

describe('dash direction', () => {
  it('follows the steering: holding up dashes up', () => {
    const d = dashDirection(body(), { kind: 'direction', x: 0, y: 1 }, 1);
    expect(d.x).toBeCloseTo(0);
    expect(d.y).toBeCloseTo(1);
  });

  it('goes toward a held finger', () => {
    const d = dashDirection(body(), { kind: 'target', x: -3, y: 4 }, 1);
    expect(d.x).toBeCloseTo(-0.6);
    expect(d.y).toBeCloseTo(0.8);
  });

  it('uses the facing when not steering', () => {
    expect(dashDirection(body(), { kind: 'none' }, -1)).toEqual({ x: -1, y: 0 });
    expect(dashDirection(body(), { kind: 'none' }, 1)).toEqual({ x: 1, y: 0 });
  });
});

describe('dash', () => {
  it('shoots the squid out quickly, then eases back to normal speed', () => {
    const b = body();
    const dash = new Dash();
    const up: SteerInput = { kind: 'direction', x: 0, y: 1 };
    expect(dash.trigger(b, dashDirection(b, up, 1))).toBe(true);
    let fastest = 0;
    for (let t = 0; t < 1.5; t += DT) {
      dash.update(DT);
      steer(b, up, DT, dash.params());
      fastest = Math.max(fastest, b.vel.y);
    }
    expect(fastest).toBeGreaterThan(TUNING.squid.topSpeed * 1.8);
    expect(b.vel.y).toBeCloseTo(TUNING.squid.topSpeed, 1);
  });

  it('three presses in one second make only one dash', () => {
    const b = body();
    const dash = new Dash();
    let dashes = 0;
    for (let t = 0; t < 1; t += DT) {
      if ([0, 0.3, 0.6].some((p) => Math.abs(t - p) < DT / 2) && dash.trigger(b, { x: 1, y: 0 })) dashes++;
      dash.update(DT);
    }
    expect(dashes).toBe(1);
  });

  it('is ready again after about a second', () => {
    const b = body();
    const dash = new Dash();
    dash.trigger(b, { x: 1, y: 0 });
    expect(dash.ready).toBe(false);
    expect(dash.readiness).toBeCloseTo(0);
    for (let t = 0; t < TUNING.dash.cooldown + DT; t += DT) dash.update(DT);
    expect(dash.ready).toBe(true);
    expect(dash.readiness).toBe(1);
  });

  it('a dash into a rock is an ordinary bump, with control back within 0.5 s', () => {
    const rock: CollisionWorld = {
      circles: [{ x: 3, y: 0, r: 1 }],
      floor: { xs: [], ys: [] },
      bounds: { minX: -100, maxX: 100, minY: -100, maxY: 100 },
      ceilings: [],
    };
    const b = body();
    const dash = new Dash();
    const bump = new BumpState();
    dash.trigger(b, { x: 1, y: 0 });
    let bumps = 0;
    let bumpAt = -1;
    let freeAt = -1;
    for (let t = 0; t < 2; t += DT) {
      dash.update(DT);
      const input: SteerInput = bump.locked ? { kind: 'none' } : { kind: 'direction', x: 1, y: 0 };
      steer(b, input, DT, dash.params());
      const contact = collide(b, TUNING.squid.radius, rock, DT);
      if (bump.update(contact, DT)) {
        bumps++;
        if (bumpAt < 0) bumpAt = t;
      }
      if (bumpAt >= 0 && freeAt < 0 && !bump.locked) freeAt = t;
    }
    expect(bumps).toBeGreaterThanOrEqual(1);
    expect(freeAt - bumpAt).toBeLessThan(0.5);
    // Never pushed through the rock.
    expect(b.pos.x).toBeLessThan(3 - 1 - TUNING.squid.radius + 0.2);
  });
});
