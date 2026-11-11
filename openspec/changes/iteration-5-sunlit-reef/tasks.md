## 1. Coral models

- [ ] 1.1 Write `tools/make_corals.py` producing branching, fan, brain, tube-cluster and mushroom corals in two sizes each, in a neutral base colour; verify each in the viewer
- [ ] 1.2 Write `tools/make_sunglasses.py` (chunky round sunglasses sized to the squid's head, with the attach point as origin); verify in the viewer together with the squid
- [ ] 1.3 Add coral colliders to `src/levels/pieces.ts`; verify with the debug overlay

## 2. Zone

- [ ] 2.1 Write `src/levels/sunlitReef.ts`, add it above Twilight, and open Twilight's top passage; verify the squid swims into the reef
- [ ] 2.2 Place the coral models as an instanced coral garden, and add the surface soft wall, dancing light patterns and cheerful ambient layer; verify mood change on entry
- [ ] 2.3 Add the hue-shift material patch with per-instance hue; verify a coral can show every colour in the cycle
- [ ] 2.4 Make corals change colour on touch or pulse; verify with a chime
- [ ] 2.5 Attach `sunglasses.glb` to the squid head node with on/off by zone; verify on entering and leaving
- [ ] 2.6 Retarget the giant squid's ride to the reef; verify the ride ends in the reef
- [ ] 2.7 Place five starfish and one bubble-ring chain; verify they work and appear in the album

## 3. Cuttlefish

- [ ] 3.1 Tag animated parts in `tools/make_cuttlefish.py` and rebuild; verify in the viewer
- [ ] 3.2 Add the disguise flicker among corals; verify it is noticeable but not obvious
- [ ] 3.3 Add the reveal on pulse with sound, sticker and album page; verify
- [ ] 3.4 Implement the colour game state machine; verify Vitest tests that wrong touches never fail and three rounds finish
- [ ] 3.5 Add colour cycling while swimming; verify by observation

## 4. Cosmetics

- [ ] 4.1 Add `cosmetics` to the save with teal unlocked, plus the upgrade; verify a Vitest test upgrading an iteration 4 save
- [ ] 4.2 Unlock a colour when the colour game finishes; verify
- [ ] 4.3 Drive glow tips, pulse ring and glow button from the chosen colour; verify each changes
- [ ] 4.4 Add the squid page to the album with a colour row usable by touch and keys; verify switching

## 5. Verification

- [ ] 5.1 Play the full world on a tablet: home, Whale fall, Twilight, reef, all five friends; verify 60 fps and no stuck spots
- [ ] 5.2 Run `npm test` and `npm run build`; verify both pass
