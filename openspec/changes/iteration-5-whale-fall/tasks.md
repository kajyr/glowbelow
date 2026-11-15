## 1. Zone

- [ ] 1.1 Write the Whale fall recipe and generator in `src/levels/` (about 4 × 3 screens, skeleton and giant squid as fixed anchors, keep-out areas) and add it to the zone graph left of home, near the seabed; verify Vitest tests over hundreds of seeds pass the layout rules and the Whale fall rules
- [ ] 1.2 Open home's left passage near the seabed and keep it clear in home's generator; verify the squid swims into Whale fall and home's existing seed tests still pass
- [ ] 1.3 Write `tools/make_whale_skeleton.py` (rounded skull, spine, and each rib a named part so it can light and act as a note target); verify in the viewer
- [ ] 1.4 Write `tools/make_small_fish.py` (a tiny friendly fish for set dressing, reused in later zones); verify in the viewer
- [ ] 1.5 Place the skeleton with rib colliders from `src/levels/pieces.ts` and a few schools of small fish; verify the squid passes between ribs without sticking, with the debug overlay
- [ ] 1.6 Add the zone mood (palette, fog, ambient layer); verify the colour blends at the passage
- [ ] 1.7 Make ribs play rising notes in nearest-first order and stay lit; verify Vitest tests for note order and by listening
- [ ] 1.8 Place five starfish and one bubble-ring chain; verify they work and appear in the album
- [ ] 1.9 Add the whale song: first time every rib is lit, then on a tail-to-head swim along lit ribs; song, skeleton glow, sparkle burst, full meter; verify Vitest tests for both triggers and by playing

## 2. Giant squid

- [ ] 2.1 Tag animated parts in `tools/make_giant_squid.py` and rebuild; verify in the viewer
- [ ] 2.2 Place the sleeping giant squid behind the skull with breathing and stirring on small pulses; verify
- [ ] 2.3 Wake on a big pulse with rise, sound and sticker; add its album page and its fun fact in `en.json`; verify the album page shows it (the speaker icon stays hidden)
- [ ] 2.4 Make dumbo point at unlit ribs, then at the sleeping giant squid, then spin once it is awake; verify Vitest tests in `dumboBrain.test.ts`
- [ ] 2.5 Write the shared carrier behaviour in `src/game/carrier.ts` (path, seat, hop-off on input); verify Vitest tests
- [ ] 2.6 Add the arm ride to the top of the world (resolved from the zone graph), hopping off, and the giant squid sinking back to Whale fall; verify by playing

## 3. Saving

- [ ] 3.1 Bump the save format from version 1 to 2 with Whale fall ribs, starfish and rings, the whale song and the giant squid state, plus the upgrade; verify a Vitest test upgrading a version 1 save

## 4. Verification and release

- [ ] 4.1 Play home → Whale fall → whale song → wake the giant squid → ride to the top on a tablet; verify 60 fps and no stuck spots
- [ ] 4.2 Run `npm test` and `npm run build`; verify both pass
- [ ] 4.3 Write the iteration's devlog post in `docs/itch/devlog/` with screenshots; verify it reads well for parents
- [ ] 4.4 Record the giant squid exception to "friends never gate progress" in `AGENTS.md` and `GAME_DESIGN.md`; verify both say the same
