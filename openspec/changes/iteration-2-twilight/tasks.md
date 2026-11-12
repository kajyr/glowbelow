## 1. Environment models

- [ ] 1.1 Write `tools/make_jellyfish_lantern.py` (round bell and short tentacles as parts, emissive inner bell for the lit state); verify unlit and lit looks in the viewer
- [ ] 1.2 Write `tools/make_ledges.py` producing 3 wall-ledge variants in the Twilight palette, matching the rock style; verify in the viewer
- [ ] 1.3 Add colliders for the lantern and ledges to `src/levels/pieces.ts`; verify with the debug overlay

## 2. Connected world

- [ ] 2.1 Introduce the shared world space, zone offsets and passages; verify Vitest tests for which zone contains a point
- [ ] 2.2 Move lit plants and found friends into a `WorldState` object that views read from; verify Vitest tests and that state survives leaving and re-entering a zone
- [ ] 2.3 Register plants, lanterns, the cave and friends as one list of glow-reactive things; verify Vitest tests that the nearest unlit thing is chosen across kinds and zones
- [ ] 2.4 Fill the space around the zones with rock and clamp the camera to the world rectangle; verify no empty water is visible beside Twilight and no jump at a border
- [ ] 2.5 Add lit lanterns as light candidates to the existing light culling (from `procedural-home`); verify no flicker when looking from Twilight down at lit home plants
- [ ] 2.6 Add per-zone mood (water gradient backdrop, fog, pad layers) blended by position; verify by swimming between zones
- [ ] 2.7 Remove Midnight home's shaft soft push and open the shaft as a passage; verify the squid reaches Twilight and can swim back down

## 3. Twilight

- [ ] 3.1 Write a Twilight `ZoneRecipe` for the zone generator (placed above home's shaft, ledge models, lanterns, top passage soft wall) and extend the generator and rules where Twilight needs it; verify Vitest tests over 500 seeds and colliders with the debug overlay
- [ ] 3.2 Build the gradient mood and light rays; verify the water lightens upward
- [ ] 3.3 Add a Twilight sparkle field with the same density and rules as home; verify Vitest tests that the meter can be filled in Twilight
- [ ] 3.4 Place about 12 jellyfish lanterns that light on pulse, stay lit, bob and wiggle when pulsed again, with tentacles swaying; verify with the debug light-all key
- [ ] 3.5 Make lit lanterns add local light and play the all-lit celebration; verify Twilight brightens and the celebration plays once

## 4. Friends

- [ ] 4.1 Tag animated parts in `make_firefly_squid.py` and `make_nautilus.py` and rebuild; verify in the viewer
- [ ] 4.2 Generalise dumbo's follow logic into a follower behaviour; verify dumbo still behaves as in iteration 1 (existing tests pass)
- [ ] 4.3 Make dumbo point at the nearest unlit glow-reactive thing; verify Vitest tests for a lantern chosen in Twilight
- [ ] 4.4 Add firefly groups, joining, swarm boids and the arrow/star/heart shapes; verify Vitest tests for shape choice and arrow target, and on screen at 60 fps
- [ ] 4.5 Add the nautilus path with pauses, facing, no collider, and its sparkle trail with a cap; verify Vitest tests for the path, the cap and calling toward the squid's height
- [ ] 4.6 Add the nautilus's first-touch discovery; verify it happens once
- [ ] 4.7 Make `Hud.stickerFly` take sticker art; draw firefly and nautilus stickers; verify each friend sends its own sticker
- [ ] 4.8 Make friends follow across zones; verify dumbo and the swarm arrive in Twilight
- [ ] 4.9 Add the lantern note, firefly chimes and the nautilus's deep sound; verify each is triggered (no errors, muted when muted)

## 5. Dash

- [ ] 5.1 Implement the dash impulse, temporary top speed and 1 s cooldown in `src/game/`; verify Vitest tests for direction, cooldown and that a dash into a rock is an ordinary bump
- [ ] 5.2 Add the dash button above the glow button (at least 64 px, ready state) and Shift; verify both trigger a dash and the button shows the cooldown

## 6. Checks

- [ ] 6.1 Run `npm test` and `npm run build`; verify both pass
- [ ] 6.2 Play from home to the top of Twilight and back on a laptop in the browser; verify no stuck spots, state kept, friends follow, 60 fps

## 7. Manual checks (you)

These need a real tablet or ears. Claude does not tick them; tick them after trying.

- [ ] 7.1 On a tablet over the local network: 60 fps from home to the top of Twilight with the full swarm and both zones lit
- [ ] 7.2 On a tablet: the dash button and the glow button are easy to hit with a thumb and never pressed by mistake
- [ ] 7.3 On a tablet: both new friends can be found without help
- [ ] 7.4 By ear: lantern note, firefly chimes, nautilus sound and the pad blending between zones sound pleasant
