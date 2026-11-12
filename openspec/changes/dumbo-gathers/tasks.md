## 1. Sparkle field

- [x] 1.1 Add `SparkleField.drifting()` (alive, drifting, not pulled) and `SparkleField.collect(index)` (collects like a squid pickup, returns the position or null); verify Vitest tests that trail sparkles are never listed and a collected sparkle respawns under the usual rules

## 2. Dumbo's brain

- [x] 2.1 Add the gather activity after pointing or spinning, with target choice (nearest to dumbo within one screen of the squid), `gatherSpeed`, the pause and the 2 s minimum between pickups, ending as soon as the squid moves; verify Vitest tests for target choice, range, pace, stopping on movement, staying above the seabed, and no gathering before dumbo is found
- [x] 2.2 Check that the existing dumbo tests still pass (pointing once after 2 s, spin when all lit, following, catch-up)

## 3. Game wiring and feedback

- [x] 3.1 Pass drifting sparkles to the brain in `main.ts`; on a gather event collect the sparkle, fill the meter, hop dumbo; verify in the browser with `?debug=1` that the meter rises while the squid rests near drifting sparkles and trails stay untouched
- [x] 3.2 Add `SparklesView.fly(from, to)` for the spark from dumbo to the squid; verify by observation
- [x] 3.3 Add `Synth.dumboNote()` and play it on each pickup; verify it is triggered and silent when muted
- [x] 3.4 Run `npm test` and `npm run build`; verify both pass

## 4. Manual checks (you)

These need a person playing or listening. Claude does not tick them; tick them after trying.

- [ ] 4.1 Resting with dumbo feels like a nice reward but swimming is still the faster way to fill the meter
- [ ] 4.2 Dumbo's pickup note sounds soft and pleasant next to the squid's sparkle notes
