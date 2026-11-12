## 1. Model

- [x] 1.1 Write `tools/make_phantom_jelly.py` (bell and four ribbon arms as parts, pink and a little see-through, with a softly glowing rim, drawn at half size in the game) and build `models/phantom-jelly.glb`; verify in `tools/viewer.html` that it reads as a phantom jelly and the parts are listed

## 2. Route and generation

- [x] 2.1 Replace the route with a free area: mark every cell where the jelly fits (wide water around bell and arms, away from start, cave and shaft), add `jelly: { start }` to `Level`; verify Vitest tests that the free area obeys every rule and the same seed gives the same start
- [x] 2.2 Replace the `jelly-route` rule with `jelly-space` (enough free area and a start in it); verify Vitest tests that all of 500 seeds still give a valid home, most on the first try, and that existing layouts are unchanged apart from the jelly

## 3. Jelly logic

- [x] 3.1 Implement `src/game/jelly.ts` (free roaming at a slow speed: far-off destinations reached along paths through its open water, never stuck, bell and arm shapes, touch with a 2 s grace period, soft bell push that yields against walls) and `GlowMeter.spill(n)`; verify Vitest tests for touch, grace, spill amounts (10 → 5, 2 → 0, 0 → 0), arms not blocking, and a squid next to a rock always able to swim away; and, over ten simulated minutes on many seeds, the jelly always stays in its free area, never stays in one place, and roams a large part of the zone
- [x] 3.2 Implement `SparkleField.spill(at, n)` (reuse waiting sparkles, else the farthest drifting ones; outward drift; pickup delay); verify Vitest tests that the sparkle count stays constant, spilled sparkles move out and are not picked up during the delay, and can be collected afterwards

## 4. Game wiring and feedback

- [x] 4.1 Add `JellyView` (bell pulse, arm sway, rim flash on touch) and place it from the level; verify in the browser that it drifts slowly and goes around obstacles
- [x] 4.2 Wire touch → spill → meter, sparkle field and sounds in `main.ts`, with `Synth.jellyBoing()` and `Synth.spill()`; verify in the browser with `?debug=1` that a touch spills up to 5 stars that can be caught again, and that sounds are silent when muted
- [x] 4.3 Draw the jelly's free area in the debug reach overlay (G); verify on a few seeds
- [x] 4.4 Update `GAME_DESIGN.md` (stars can spill but are never lost for good; the phantom jelly in the world section)
- [x] 4.5 Run `npm test` and `npm run build`; verify both pass

## 5. Manual checks (you)

These need a person playing or listening. Claude does not tick them; tick them after trying.

- [x] 5.1 Touching the jelly feels like a funny oops, not a punishment, and the spilled stars are easy to catch again
- [x] 5.2 The jelly looks beautiful and slow, and is easy to swim around on a tablet
- [x] 5.3 The jelly's sounds are soft next to the rest
