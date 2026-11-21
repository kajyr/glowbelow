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

test('an open way up (no soft wall) lets the squid straight through', () => {
  const open = { x0: 0, x1: 6, softFrom: Infinity };
  const b: Body = { pos: { x: 3, y: 0 }, vel: { x: 0, y: 0 } };
  for (let t = 0; t < 4; t += 1 / 60) {
    steer(b, { kind: 'direction', x: 0, y: 1 }, 1 / 60);
    shaftPush(b, open, 1 / 60);
  }
  expect(b.pos.y).toBeGreaterThan(15);
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
