import { expect, test } from 'vitest';
import { shaftPush, SURFACE_SOFT, surfacePush } from './shaft';
import { steer, type Body } from './steering';

test('swimming up the shaft eases the squid back down', () => {
  const shaft = { x0: 0, x1: 6, softFrom: 10 };
  const b: Body = { pos: { x: 3, y: 9 }, vel: { x: 0, y: 0 } };
  let top = 0;
  for (let t = 0; t < 4; t += 1 / 60) {
    steer(b, { kind: 'direction', x: 0, y: 1 }, 1 / 60);
    shaftPush(b, shaft, 1 / 60);
    top = Math.max(top, b.pos.y);
  }
  expect(top).toBeLessThan(12.5);
  for (let t = 0; t < 4; t += 1 / 60) {
    steer(b, { kind: 'none' }, 1 / 60);
    shaftPush(b, shaft, 1 / 60);
  }
  expect(b.pos.y).toBeLessThan(10.2);
});

test('a lid holds the squid from below, but lets it through from above', () => {
  const shaft = { x0: 0, x1: 6, softFrom: 10, lid: 12 };
  const gate = { fromAbove: false };
  const b: Body = { pos: { x: 3, y: 8 }, vel: { x: 0, y: 20 } };
  for (let t = 0; t < 2; t += 1 / 60) {
    b.pos.y += b.vel.y / 60;
    shaftPush(b, shaft, 1 / 60, gate, 0.55);
    expect(b.pos.y).toBeLessThanOrEqual(12 - 0.55 + 1e-9);
  }
  // From above: straight through, down past the lid.
  const down: Body = { pos: { x: 3, y: 15 }, vel: { x: 0, y: -4 } };
  const g2 = { fromAbove: false };
  for (let t = 0; t < 2; t += 1 / 60) {
    down.pos.y += down.vel.y / 60;
    shaftPush(down, shaft, 1 / 60, g2, 0.55);
  }
  expect(down.pos.y).toBeLessThan(12 - 0.55);
});

test('the surface eases the squid back down', () => {
  const surface = { x0: 0, x1: 20, y: 30 };
  const b: Body = { pos: { x: 5, y: 25 }, vel: { x: 0, y: 0 } };
  let top = 0;
  for (let t = 0; t < 4; t += 1 / 60) {
    steer(b, { kind: 'direction', x: 0, y: 1 }, 1 / 60);
    surfacePush(b, surface, 1 / 60);
    top = Math.max(top, b.pos.y);
  }
  expect(top).toBeLessThan(30);
  for (let t = 0; t < 4; t += 1 / 60) {
    steer(b, { kind: 'none' }, 1 / 60);
    surfacePush(b, surface, 1 / 60);
  }
  expect(b.pos.y).toBeLessThan(30 - SURFACE_SOFT + 0.3);
});
