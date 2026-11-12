## 1. Saving

- [x] 1.1 Check generated ids (plants, lanterns, firefly groups, starfish); verify a Vitest test that they are unique and identical across two generations from the same seed
- [x] 1.2 Implement `src/game/save.ts` (`glowbelow.save` with version and `layout`, debounce, upgrade, validate, fall back to new game; on an older `layout` keep friends, groups, starfish and dash, drop lit ids); verify Vitest tests for round trip, corrupted data, blocked storage and an older layout
- [x] 1.3 Save on every world-state change (lighting, finding, joining, unlocking), zone crossing and page hide; verify progress survives closing and reopening the tab
- [x] 1.4 Make the title screen continue a save or start new; verify both cases

## 2. Album

- [x] 2.1 Build the album overlay with open/close by tap, B key and Escape, pausing logic; verify play resumes where it was and that A still steers left
- [x] 2.2 Make the album one page: a stamp per planned friend and sea creature (starfish, phantom jelly, lantern jelly; stamped at the first meeting, with a flying sticker) in a grid at least three by two, four wide past six stamps, with picture, name from `en.json` and sound on tap once found, silhouettes otherwise; verify a Vitest test for the grid size, and in the browser with a fresh and a partly found save
- [x] 2.3 Add the starfish strips per zone under the grid; verify counts match found starfish
- [x] 2.4 Make the whole page fit the screen; verify at laptop (1280×720), iPad (1024×768) and phone landscape (812×375) sizes
- [x] 2.5 Show the badge for unseen stamps, clear it when the album opens, and pop a stamp seen for the first time; verify

## 3. Parent corner

- [x] 3.1 Add the 3-second long-press control with a filling ring, and holding P for 3 s; verify a short tap or press does nothing and Shift still only dashes
- [x] 3.2 Add music and effects volume, remembered as settings in `glowbelow.volume`; verify each slider affects only its sounds
- [x] 3.3 Add reset with confirmation returning to the title; verify reset, cancel, and that mute and volumes are kept
- [x] 3.4 Detect unavailable storage in a framed context; verify a Vitest test with a throwing storage stub
- [x] 3.5 Show the "saving unavailable here" note with "open full page" in the parent corner only; verify it appears with blocked storage and not otherwise

## 4. Bubble rings

- [x] 4.1 Write `tools/make_bubble_ring.py` (a ring of about 12 bubbles, each a separate part so they can pop one by one); verify in the viewer
- [x] 4.2 Add the pop/re-form animation by scaling the bubble parts; verify it re-forms within 5 s
- [x] 4.3 Add speed push and rising notes per chain with a finishing flourish; verify Vitest tests for chain order and by listening
- [x] 4.4 Add a ring chain to the Midnight home and Twilight recipes, placed by the generator with a reachability rule; verify Vitest tests over 500 seeds

## 5. Starfish

- [x] 5.1 Write `tools/make_starfish.py` (chunky five-arm star with each arm a part, small eyes, emissive tips for the lit state); verify dim and lit looks in the viewer
- [x] 5.2 Add dim, lit and wave states by animating the arm parts; verify by observation
- [x] 5.3 Add five starfish per zone to the recipes (on rocks and the seabed, reachable, checked over 500 seeds), with generated ids, and connect them to pulses and saving; verify finding, no double count, and the zone celebration

## 6. Verification

- [ ] 6.1 Play a full session on a tablet, close the tab, reopen and continue; verify everything found is still there and the album matches
- [ ] 6.2 Push to itch.io and play there in Safari on an iPad, close Safari, reopen; verify the game still works; the parent-corner note appears only if storage was blocked, and progress lost to Safari clearing the frame's storage is expected
- [x] 6.3 Run `npm test` and `npm run build`; verify both pass
