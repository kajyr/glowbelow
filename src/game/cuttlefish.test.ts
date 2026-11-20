import { describe, expect, test } from 'vitest';
import { CORAL_COLOURS, nextColour, type CoralColour, type GlowColour } from './colours';
import { ColourGame, Cuttlefish, pickColour } from './cuttlefish';
import { makeRng } from './rng';
import { TUNING } from './tuning';

const DT = 1 / 60;
const none = (_c: GlowColour) => false;

describe('picking a colour', () => {
  test('always a colour on a nearby coral', () => {
    const rng = makeRng(3);
    for (let i = 0; i < 50; i++) expect(['pink', 'sky']).toContain(pickColour(['pink', 'sky', 'pink'], none, null, rng));
    expect(pickColour([], none, null, rng)).toBeNull();
  });

  test('colours not unlocked yet come first', () => {
    const rng = makeRng(4);
    const unlocked = (c: GlowColour) => c === 'pink' || c === 'teal';
    for (let i = 0; i < 50; i++) expect(pickColour(['pink', 'amber'], unlocked, null, rng)).toBe('amber');
    // Everything unlocked: any colour nearby.
    for (let i = 0; i < 20; i++) expect(['pink', 'amber']).toContain(pickColour(['pink', 'amber'], () => true, null, rng));
  });

  test('never the same colour twice in a row, when there is another', () => {
    const rng = makeRng(5);
    for (let i = 0; i < 50; i++) expect(pickColour(['pink', 'amber'], none, 'pink', rng)).toBe('amber');
    expect(pickColour(['pink'], none, 'pink', rng)).toBe('pink');
  });
});

/** A little garden: corals with colours, near the cuttlefish. */
function garden(colours: CoralColour[]) {
  const corals = [...colours];
  const rng = makeRng(9);
  const game = new ColourGame((prev) => pickColour(corals, none, prev, rng));
  /** Touch coral i the way the game does: judged by its colour before, a wrong one steps on. */
  const touch = (i: number) => {
    const before = corals[i];
    const ev = game.touch(before);
    if (ev?.kind !== 'right') corals[i] = nextColour(corals[i]);
    return ev;
  };
  const wait = () => {
    const events = [];
    for (let t = 0; t < TUNING.cuttlefish.cheerTime + 0.2; t += DT) {
      const e = game.update(DT);
      if (e) events.push(e);
    }
    return events;
  };
  return { corals, game, touch, wait };
}

describe('the colour game', () => {
  test('three right corals finish it; the prize is the last colour shown', () => {
    const g = garden(['pink', 'amber', 'sky', 'lavender', 'coral']);
    const first = g.game.start()!;
    expect(first.kind).toBe('show');
    for (let round = 0; round < 3; round++) {
      expect(g.game.state).toBe('showing');
      expect(g.game.round).toBe(round);
      const shown = g.game.colour!;
      const right = g.corals.indexOf(shown);
      expect(right).toBeGreaterThanOrEqual(0);
      expect(g.touch(right)).toEqual({ kind: 'right', round });
      // The right coral keeps its colour.
      expect(g.corals[right]).toBe(shown);
      const events = g.wait();
      if (round < 2) expect(events).toEqual([{ kind: 'show', colour: g.game.colour, round: round + 1 }]);
      else expect(events).toEqual([{ kind: 'finish', colour: shown }]);
    }
    expect(g.game.state).toBe('done');
  });

  test('wrong corals never fail it: the colour stays, there is no timer', () => {
    const g = garden(['pink', 'amber', 'sky']);
    g.game.start();
    const shown = g.game.colour!;
    const wrong = g.corals.findIndex((c) => c !== shown);
    for (let i = 0; i < 3; i++) {
      // Waiting changes nothing.
      for (let t = 0; t < 30; t += DT) expect(g.game.update(DT)).toBeNull();
      expect(g.game.state).toBe('showing');
      expect(g.game.colour).toBe(shown);
    }
    expect(g.touch(wrong)).toEqual({ kind: 'wrong' });
    expect(g.game.state).toBe('showing');
    expect(g.game.colour).toBe(shown);
  });

  test('tapping one wrong coral again and again reaches the shown colour within one cycle', () => {
    for (const start of CORAL_COLOURS) {
      const g = garden(['pink', 'amber', 'sky', 'lavender', 'coral']);
      g.game.start();
      const shown = g.game.colour!;
      // A coral not showing that colour (start it at `start`, or skip when it already matches).
      if (start === shown) continue;
      g.corals[0] = start;
      let taps = 0;
      let ev = g.touch(0);
      while (ev?.kind === 'wrong') {
        taps++;
        ev = g.touch(0);
      }
      expect(ev).toEqual({ kind: 'right', round: 0 });
      expect(taps).toBeLessThan(CORAL_COLOURS.length);
    }
  });

  test('touches while it cheers do nothing', () => {
    const g = garden(['pink', 'amber']);
    g.game.start();
    g.touch(g.corals.indexOf(g.game.colour!));
    expect(g.game.state).toBe('cheering');
    expect(g.game.touch('pink')).toBeNull();
    expect(g.game.touch('amber')).toBeNull();
  });
});

describe('the cuttlefish', () => {
  const make = () => {
    const game = new ColourGame(() => 'pink');
    return { c: new Cuttlefish({ x: 10, y: 0 }, game, makeRng(2)), game };
  };

  test('disguised, it flickers the wrong colour every few seconds', () => {
    const { c } = make();
    let flickers = 0;
    let was = false;
    for (let t = 0; t < 30; t += DT) {
      c.update(DT, { x: 40, y: 10 });
      if (c.flickering && !was) flickers++;
      was = c.flickering;
    }
    // Two flashes per flicker, one flicker every 3.5–6 s.
    expect(flickers / 2).toBeGreaterThanOrEqual(4);
    expect(flickers / 2).toBeLessThanOrEqual(9);
  });

  test('a glow reveals it once: it swims up out of the garden to its spot', () => {
    const { c } = make();
    expect(c.pulse()).toEqual({ kind: 'reveal' });
    expect(c.pulse()).toBeNull();
    for (let t = 0; t < TUNING.cuttlefish.revealTime + 0.1; t += DT) c.update(DT, { x: 40, y: 10 });
    expect(c.state).toBe('idle');
    expect(c.pos.y).toBeCloseTo(TUNING.cuttlefish.hoverAbove, 1);
  });

  test('touching it starts a game; after the game, the squid must swim away before touching starts another', () => {
    const { c, game } = make();
    c.restore();
    let ev = null;
    for (let t = 0; t < 1 && !ev; t += DT) ev = c.update(DT, c.pos);
    expect(ev).toEqual({ kind: 'start' });
    game.start();
    expect(c.state).toBe('playing');
    game.state = 'done';
    c.update(DT, c.pos);
    expect(c.state).toBe('idle');
    // Still touching: nothing.
    for (let t = 0; t < 2; t += DT) expect(c.update(DT, { ...c.pos })).toBeNull();
    // Away, then back.
    c.update(DT, { x: c.pos.x + 10, y: c.pos.y });
    let again = null;
    for (let t = 0; t < 1 && !again; t += DT) again = c.update(DT, c.pos);
    expect(again).toEqual({ kind: 'start' });
  });
});
