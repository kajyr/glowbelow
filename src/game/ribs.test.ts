import { describe, expect, test } from 'vitest';
import { ribOrder, WhaleSong } from './ribs';

const DT = 1 / 60;
const XS = [0, 4.5, 9, 13.5, 18, 22.5, 27];

/** Swims straight from x0 to x1 at height y, at speed 4; returns whether the song played. */
function swim(song: WhaleSong, x0: number, x1: number, y = 3, allLit = true, speed = 4): boolean {
  let played = false;
  const dir = Math.sign(x1 - x0);
  for (let x = x0; (x1 - x) * dir > 0; x += dir * speed * DT) if (song.update(DT, { x, y }, allLit)) played = true;
  return played;
}

describe('whale song', () => {
  test('plays the first time every rib is lit, in any order, and only then', () => {
    const song = new WhaleSong(XS, 14, false);
    for (let n = 1; n < XS.length; n++) expect(song.lit(n)).toBe(false);
    expect(song.lit(XS.length)).toBe(true);
    expect(song.lit(XS.length)).toBe(false);
  });

  test('a continued game where every rib was lit has already sung', () => {
    expect(new WhaleSong(XS, 14, true).lit(XS.length)).toBe(false);
  });

  test('swimming along the lit ribs from tail to head plays it again', () => {
    const song = new WhaleSong(XS, 14, true);
    expect(swim(song, -3, 30)).toBe(true);
  });

  test('not from head to tail, and not before every rib is lit', () => {
    expect(swim(new WhaleSong(XS, 14, true), 30, -3)).toBe(false);
    expect(swim(new WhaleSong(XS, 14, false), -3, 30, 3, false)).toBe(false);
  });

  test('a swim that turns back, or goes too high, starts over', () => {
    const song = new WhaleSong(XS, 14, true);
    swim(song, -3, 12);
    swim(song, 12, 5);
    expect(swim(song, 5, 30)).toBe(false);
    expect(swim(song, 30, -3)).toBe(false);
    swim(song, -3, 12);
    song.update(DT, { x: 12, y: 20 }, true);
    expect(swim(song, 12, 30)).toBe(false);
  });

  test('a long pause between ribs breaks the swim', () => {
    const song = new WhaleSong(XS, 14, true);
    swim(song, -3, 11);
    for (let t = 0; t < 6; t += DT) song.update(DT, { x: 11, y: 3 }, true);
    expect(swim(song, 11, 30)).toBe(false);
  });

  test('works with the head on the left (a mirrored skeleton)', () => {
    const song = new WhaleSong([...XS].map((x) => -x), 14, true);
    expect(swim(song, 3, -30)).toBe(true);
  });

  test('cannot start again while it is still playing', () => {
    const song = new WhaleSong(XS, 14, true);
    expect(swim(song, -3, 30, 3, true, 10)).toBe(true);
    // Back to the tail over the top, and along again within the song's length: no second song yet.
    song.update(DT, { x: -3, y: 20 }, true);
    expect(swim(song, -3, 30, 3, true, 10)).toBe(false);
    // Once it has finished, it can play again.
    for (let t = 0; t < 8; t += DT) song.update(DT, { x: -3, y: 20 }, true);
    expect(swim(song, -3, 30, 3, true, 10)).toBe(true);
  });

  test('a pulse reaching several ribs plays them nearest first', () => {
    const ribs = XS.map((x, i) => ({ id: `rib-${i}`, x, y: 6 }));
    expect(ribOrder(ribs, { x: 10, y: 6 })).toEqual(['rib-2', 'rib-3', 'rib-1', 'rib-4', 'rib-0', 'rib-5', 'rib-6']);
  });
});
