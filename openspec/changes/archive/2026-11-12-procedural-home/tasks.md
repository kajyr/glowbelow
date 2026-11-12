## 1. Recipe and generator

- [x] 1.1 Define the zone recipe type and write the Midnight home recipe (about 128 × 44 units, landmarks, counts, spacing, cave scale about 1.35, about 45 plants); verify it type-checks and `npm run build` passes
- [x] 1.2 Generate seabed and ceiling with the shaft gap from a seed; verify Vitest tests for determinism (same seed → identical placements) and that the shaft lies in the middle 60%
- [x] 1.3 Place the start, cave (2–4 screens from start, entrance facing it) and arch with keep-out areas; verify Vitest tests over 500 seeds for distance and no overlap
- [x] 1.4 Place seabed rocks, floating rocks and decor rocks by Poisson-disc sampling around keep-out areas; verify Vitest tests for spacing and empty keep-out areas
- [x] 1.5 Place plants (one per screen-sized cell first, then rocks, arch, cave roof, floating rocks); verify Vitest tests for the recipe count and a plant within one screen of every cell

## 2. Validator

- [x] 2.1 Rasterise a `Level` onto the 0.5-unit clearance grid and flood-fill the wide and narrow fields; verify Vitest tests on small hand-made levels (open gap passes, a 2-unit gap fails)
- [x] 2.2 Implement the rule checks (reachable plants, cave and shaft; no narrow-only pockets; clear keep-outs; cave distance); verify each rule fails on a hand-made level built to break it
- [x] 2.3 Implement `generateValidZone` with up to 50 derived seeds; verify Vitest tests that all of 500 seeds succeed, most on the first try, and the result is deterministic

## 3. Trails and guidance

- [x] 3.1 Lay trails along A* paths (start → cave, then to each plant group and the shaft) with a sparkle every 2.2 units; verify Vitest tests that the first trail starts beside the start and ends at the cave entrance, and every point is within two screens of a trail
- [x] 3.2 Add timing checks; verify Vitest tests that crossing the zone is about a minute or less and the cave trail is under about 2 minutes at swimming speed

## 4. Game wiring

- [x] 4.1 Pick the seed in `main.ts` (`?seed=` or random), generate home at load and keep the seed for the session; verify the same `?seed=` gives the same home twice and two seeds differ
- [x] 4.2 Replace the hand-written `MIDNIGHT_HOME` with the recipe; verify the game runs with plants, cave, dumbo, arch and shaft in place and the existing tests still pass
- [x] 4.3 Cull local lights to the camera view (squid and pulses first, then nearest); verify Vitest tests for the order and the 32-slot limit, and that 45 lit plants (debug light-all key) show no flicker while swimming
- [x] 4.4 Add a debug overlay key (G) that draws the wide reachability field and the trail paths; verify it on a few seeds with `?debug=1`
- [x] 4.5 Measure generation time; verify it stays under about 100 ms in the browser on this laptop and is logged in debug mode

## 5. Review and checks

- [x] 5.1 Look at a dozen seeds in the browser and tune counts and spacing; verify layouts feel different from each other and none looks broken (add notes on any repetition to the design)
- [x] 5.2 Update `iteration-2-twilight` to build Twilight with the generator and drop its own light-culling task, and note in `iteration-3-save-and-album` that the seed is saved; verify `openspec validate` passes for both
- [x] 5.3 Run `npm test` and `npm run build`; verify both pass

## 6. Manual checks (you)

These need a real tablet or a person playing. Claude does not tick them; tick them after trying.

- [x] 6.1 On a tablet over the local network: 60 fps across the bigger home with all plants lit
- [x] 6.2 Play three different seeds: dumbo is found without help in each, and nobody gets lost or stuck
- [x] 6.3 The bigger home still feels cozy, not empty
