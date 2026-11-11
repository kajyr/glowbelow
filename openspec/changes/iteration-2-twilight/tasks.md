## 1. Environment models

- [ ] 1.1 Write `tools/make_jellyfish_lantern.py` (round bell and short tentacles as parts, emissive inner bell for the lit state); verify unlit and lit looks in the viewer
- [ ] 1.2 Write `tools/make_ledges.py` producing 3 wall-ledge variants in the Twilight palette, matching the rock style; verify in the viewer
- [ ] 1.3 Add colliders for the lantern and ledges to `src/levels/pieces.ts`; verify with the debug overlay

## 2. Connected world

- [ ] 2.1 Introduce the shared world space, zone offsets and passages; verify Vitest tests for which zone contains a point
- [ ] 2.2 Move lit plants and found friends into a `WorldState` object; verify state survives leaving and re-entering a zone
- [ ] 2.3 Clamp the camera to the union of visible zones; verify no jump at a border
- [ ] 2.4 Blend water colour, fog and ambient pad across passages; verify by swimming between zones
- [ ] 2.5 Open Midnight home's shaft; verify the squid reaches Twilight

## 3. Twilight

- [ ] 3.1 Write `src/levels/twilight.ts` (about 2×4 screens, placed ledge models, top passage soft wall); verify colliders with the debug overlay
- [ ] 3.2 Build the gradient mood and light rays; verify the water lightens upward
- [ ] 3.3 Place about 12 jellyfish lantern models that light on pulse, stay lit and bob, with tentacles swaying; verify

## 4. Friends

- [ ] 4.1 Tag animated parts in `make_firefly_squid.py` and `make_nautilus.py` and rebuild; verify in the viewer
- [ ] 4.2 Generalise dumbo's follow logic into a follower behaviour; verify dumbo still behaves as in iteration 1 (existing tests pass)
- [ ] 4.3 Add firefly groups, joining, swarm boids and the arrow/star/heart shapes; verify Vitest tests for shape choice and on screen at 60 fps
- [ ] 4.4 Add the nautilus path, first-touch discovery, riding, hopping off and calling; verify each scenario
- [ ] 4.5 Make friends follow across zones; verify dumbo and the swarm arrive in Twilight
- [ ] 4.6 Add firefly chimes and the nautilus's deep sound; verify by listening

## 5. Dash

- [ ] 5.1 Add dash input (Shift, double-tap, swipe) and the impulse with 1 s cooldown; verify Vitest tests and on a tablet

## 6. Playtest

- [ ] 6.1 Play from home up to the top of Twilight on a tablet; verify 60 fps, no stuck spots, and that both friends can be found without help
- [ ] 6.2 Run `npm test` and `npm run build`; verify both pass
