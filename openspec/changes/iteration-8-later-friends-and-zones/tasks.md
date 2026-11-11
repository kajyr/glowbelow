## 1. Friend models

- [ ] 1.1 Write `tools/make_bobtail_squid.py` and refine it against `artwork/friends-later/bobtail-squid.svg` in the viewer; verify it renders with no console errors
- [ ] 1.2 Write `tools/make_coconut_octopus.py` (octopus plus two shell halves as parts) and refine it; verify in the viewer
- [ ] 1.3 Write `tools/make_glass_squid.py` with separate body and eye parts and refine it; verify in the viewer
- [ ] 1.4 Write `tools/make_mimic_octopus.py` and refine it; verify in the viewer
- [ ] 1.5 Write `tools/make_blanket_octopus.py` with a long cape part, coloured clearly unlike the hero, and refine it; verify in the viewer

## 2. Environment models

- [ ] 2.1 Write `tools/make_vents.py` (2 warm vent chimneys with emissive orange cracks) and `tools/make_tube_worms.py` (a cluster with each worm a part so it can duck in); verify in the viewer
- [ ] 2.2 Write `tools/make_sand_mound.py` and `tools/make_shell.py` (a scallop shell, small enough to carry); verify in the viewer
- [ ] 2.3 Write `tools/make_shell_house.py` with each shell slot a part, so the house can grow one shell at a time; verify empty and full looks in the viewer
- [ ] 2.4 Write `tools/make_shipwreck.py` (rounded hull lying on its side, three rooms with wide openings, rooms as parts for lighting) and `tools/make_ship_lantern.py`; verify the openings fit the squid in the viewer
- [ ] 2.5 Add colliders for every new piece to `src/levels/pieces.ts`, including the ship's room walls; verify with the debug overlay

## 3. Currents

- [ ] 3.1 Implement currents as spline carriers with release on input; verify Vitest tests that the squid always exits into open water
- [ ] 3.2 Render instanced bubbles along the spline with a whoosh sound; verify direction is readable

## 4. Vent garden

- [ ] 4.1 Write `src/levels/ventGarden.ts`, add it right of home and open home's right passage; verify the squid swims in
- [ ] 4.2 Place the vent and tube-worm models (worms duck and light), add bubble columns and the warm mood; verify
- [ ] 4.3 Add two currents, five starfish and a bubble-ring chain; verify
- [ ] 4.4 Add the bobtail squid: buried eyes, pop-out on pulse, sticker, follow in zone, digging at mounds, carried shells; verify each scenario

## 5. Shipwreck

- [ ] 5.1 Write `src/levels/shipwreck.ts`, add it beside Twilight and open the side passage; verify the squid swims in
- [ ] 5.2 Place the shipwreck model with room lanterns and small-fish schools; verify every room can be entered and left
- [ ] 5.3 Add five starfish and a bubble-ring chain; verify
- [ ] 5.4 Add the coconut octopus: found on pulse, takes shells, growing house, finished-house celebration and bonus sticker; verify each scenario
- [ ] 5.5 Add the blanket octopus above the ship: drift, unfurl on pulse, sticker, long current ride together; verify

## 6. Twilight and reef friends

- [ ] 6.1 Add the transparent glass-squid material driven by pulse light; verify it is invisible, then visible when lit
- [ ] 6.2 Add the glass squid's three hiding spots with bubble trails and the sticker on the third; verify
- [ ] 6.3 Add the mimic octopus's three disguises with giveaways, moving on each find, sticker on the third, excluded from starfish counts; verify

## 7. Album, text and saving

- [ ] 7.1 Add album pages for the five friends and the shell-house bonus sticker; verify silhouettes and found pages
- [ ] 7.2 Add names and fun facts in `en.json` and `it.json`; verify the key-completeness test passes
- [ ] 7.3 Bump the save version with new zones, friends and shells, plus the upgrade; verify a Vitest test upgrading an iteration 7 save
- [ ] 7.4 Confirm new models and files are in the offline precache; verify the new zones work in airplane mode

## 8. Verification

- [ ] 8.1 Play the whole six-zone world on a tablet; verify 60 fps, no stuck spots, and every friend can be found
- [ ] 8.2 Run `npm test` and `npm run build`; verify both pass
