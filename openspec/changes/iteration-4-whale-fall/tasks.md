## 1. Zone

- [ ] 1.1 Write `src/levels/whaleFall.ts` and add it to the zone graph left of home; verify colliders with the debug overlay
- [ ] 1.2 Open home's left passage; verify the squid swims into Whale fall
- [ ] 1.3 Write `tools/make_whale_skeleton.py` (rounded skull, spine, and each rib a named part so it can light and act as a note target); verify in the viewer
- [ ] 1.4 Write `tools/make_small_fish.py` (a tiny friendly fish for set dressing, reused in later zones); verify in the viewer
- [ ] 1.5 Place the skeleton with rib colliders from `src/levels/pieces.ts` and a few schools of small fish; verify the squid passes between ribs without sticking
- [ ] 1.6 Add the zone mood (palette, fog, ambient layer); verify the colour blends at the passage
- [ ] 1.7 Make ribs play rising notes in nearest-first order and stay lit; verify Vitest tests for note order and by listening
- [ ] 1.8 Place five starfish and one bubble-ring chain; verify they work and appear in the album

## 2. Giant squid

- [ ] 2.1 Tag animated parts in `tools/make_giant_squid.py` and rebuild; verify in the viewer
- [ ] 2.2 Place the sleeping giant squid behind the skull with breathing and stirring on small pulses; verify
- [ ] 2.3 Wake on a big pulse with rise, sound and sticker; add its album page; verify
- [ ] 2.4 Make dumbo point at the sleeping giant squid when nothing else is unlit nearby; verify
- [ ] 2.5 Extract the nautilus ride into a shared carrier behaviour; verify existing nautilus tests still pass
- [ ] 2.6 Add the arm ride to the top of the world and back; verify both directions and hopping off

## 3. Saving

- [ ] 3.1 Bump the save version with Whale fall ribs, starfish and the giant squid state, plus the upgrade; verify a Vitest test upgrading an iteration 3 save

## 4. Verification

- [ ] 4.1 Play home → Whale fall → wake the giant squid → ride to the top on a tablet; verify 60 fps and no stuck spots
- [ ] 4.2 Run `npm test` and `npm run build`; verify both pass
