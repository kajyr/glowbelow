## 1. Project setup

- [ ] 1.1 Create `package.json` with `three`, `vite`, `typescript`, `vitest`, `@types/three`; verify `npm install` succeeds
- [ ] 1.2 Add `tsconfig.json`, `vite.config.ts` (with `base: './'`, `assetsInclude: ['**/*.glb']`, `server.host: true`) and `index.html`; verify `npm run build` produces `dist/` with only relative asset paths and no type errors
- [ ] 1.3 Add `npm test` running Vitest with one placeholder test; verify it passes
- [ ] 1.4 Add `.gitignore` entries for `node_modules/` and `dist/`; verify `git status` does not list them

## 2. Model parts for animation

- [ ] 2.1 Extend `tools/lowpoly.py` so `Model.add` accepts a `part` name and `write_glb` writes one node per part with a pivot; verify a model with no parts produces the same file as before
- [ ] 2.2 Tag the squid parts (head, cape, lining, arms, ears, eyes, collar) in `tools/make_squid.py` and rebuild; verify in `tools/viewer.html` that the squid looks unchanged and the nodes are listed in the console
- [ ] 2.3 Tag dumbo parts (body, ears, skirt, arms, eyes) in `tools/make_dumbo_octopus.py` and rebuild; verify it looks unchanged in the viewer
- [ ] 2.4 Re-run the other four model scripts; verify all six models still load in the viewer with no console errors

## 3. Environment models

- [ ] 3.1 Write `tools/make_rocks.py` producing 4 rock variants (`rock-1.glb` … `rock-4.glb`) in the Midnight home palette; verify each in the viewer
- [ ] 3.2 Write `tools/make_seabed.py` producing 3 seabed segments that tile with matching edges; verify in the viewer by placing them side by side with no visible seam
- [ ] 3.3 Write `tools/make_arch.py` (a rock arch wide enough for the squid and dumbo together); verify in the viewer
- [ ] 3.4 Write `tools/make_cave.py` (a rock cave with a wide mouth facing the camera and a dark interior); verify in the viewer
- [ ] 3.5 Write `tools/make_glow_plant.py` with stem, closed bud and open petals as separate parts, and emissive petal tips; verify closed and open looks in the viewer
- [ ] 3.6 Write `tools/make_sparkle.py` (a small chunky five-point star, fully emissive); verify in the viewer
- [ ] 3.7 Add `src/levels/pieces.ts` with a collider for each piece; verify with the debug overlay that colliders match the models

## 4. Game shell

- [ ] 4.1 Create the render setup: renderer, side-on camera, fog, the viewer's three lights, and resizing to the container (not the screen); verify an empty dark scene fills the window and a resized container
- [ ] 4.2 Add the fixed-step game loop in `main.ts` (input → logic → render → audio); verify a frame counter advances at 60 Hz logic regardless of display rate
- [ ] 4.3 Add the title screen (squid bobbing, working title from `src/i18n/en.json`, play control) starting play on tap, click, Space or Enter; verify each start method
- [ ] 4.4 Add the portrait rotate-device icon and pause; verify in a portrait-sized browser window
- [ ] 4.5 Block browser gestures (touch-action, overscroll, user-select, arrow/Space default) during play; verify arrow keys do not scroll and pinch does not zoom on a tablet
- [ ] 4.6 Add the camera follow with zone-edge clamping; verify the squid never leaves the screen and no space beyond the zone is shown
- [ ] 4.7 Add half-resolution bloom with automatic fallback when frame time stays over budget; verify glow tips bloom and the fallback triggers when throttling the CPU in dev tools

## 5. Squid swimming

- [ ] 5.1 Implement `src/game/steering.ts` (target or direction in, eased velocity out, top speed, drift to stop); verify Vitest tests for diagonal speed and stop time
- [ ] 5.2 Implement soft collision against circles, the seabed line and zone bounds; verify a Vitest test that a squid driven into a corner for 10 seconds can still leave it
- [ ] 5.3 Implement bump detection (speed threshold, spin, control lock under 0.5 s); verify Vitest tests for fast and slow bumps
- [ ] 5.4 Wire touch, mouse and keyboard input into one steering target and track the last input type; verify on a laptop and a tablet
- [ ] 5.5 Load `squid.glb`, face the travel direction, turn toward the camera when hovering; verify by swimming left and right
- [ ] 5.6 Animate cape strokes, ear flaps, blinking and the 4-second pineapple pose; verify each by observation

## 6. Midnight home

- [ ] 6.1 Write `src/levels/midnightHome.ts` (bounds about 3×2 screens, placed seabed segments, rocks, arch, cave, shaft, ~20 plant spots, sparkle trails); verify with a debug overlay that draws the colliders
- [ ] 6.2 Load the seabed, rock, arch and cave models and place them from the level data with instancing for repeats; verify the zone is dark but outlines are visible
- [ ] 6.3 Add the shaft's soft wall at the top; verify the squid is eased back down
- [ ] 6.4 Add drifting particles and rising bubbles; verify the scene moves while idle
- [ ] 6.5 Place the glow plant model with unlit, blooming (animating the bud and petal parts) and lit states plus local light; verify the zone brightens as plants are lit (debug key to light all)
- [ ] 6.6 Add the all-plants-lit celebration wave; verify with the debug key

## 7. Sparkles and glow

- [ ] 7.1 Implement `src/game/sparkleField.ts` (drift, respawn within 10 s, trails, magnet pickup radius); verify Vitest tests for pickup at one squid-width and respawn
- [ ] 7.2 Render sparkles by instancing `sparkle.glb`; verify hundreds of sparkles keep 60 fps
- [ ] 7.3 Implement `src/game/glowMeter.ts` (about 15 sparkles to full, full stays full); verify Vitest tests
- [ ] 7.4 Implement `src/game/pulse.ts` (small free pulse with 1 s cooldown, big pulse at about 3× reach that empties the meter, reach query); verify Vitest tests
- [ ] 7.5 Render the pulse ring and the temporary light it leaves; verify rocks light and fade back
- [ ] 7.6 Connect pulses to plants; verify unlit plants bloom and lit plants wiggle
- [ ] 7.7 Make the squid's glow tips brighten with the meter; verify the difference between empty and full

## 8. HUD and hints

- [ ] 8.1 Add the glow button (bottom-right, at least 64 px, fills with light, pulses when full), the album button and the mute button as DOM over the canvas; verify hit areas on a tablet
- [ ] 8.2 Implement `src/game/hints.ts` (move hint at start, glow hint at full meter or 30 s, fade after use, return after 20 s idle, icon set by last input); verify Vitest tests for each timer
- [ ] 8.3 Draw the hint icons (finger-drag, arrow keys, Space) as inline SVG; verify both icon sets appear on the right devices

## 9. Dumbo octopus

- [ ] 9.1 Place blinking eyes in the cave; verify they blink before discovery
- [ ] 9.2 Implement discovery on the first pulse reaching the cave: pop out, spin, sticker fly-in to the album button with a badge; verify it happens once
- [ ] 9.3 Implement `src/game/dumboBrain.ts` (follow at a distance, catch up, point at the nearest unlit plant after 2 s of squid stillness, spin when all lit); verify Vitest tests for target choice and catch-up
- [ ] 9.4 Load `dumbo-octopus.glb`, animate ears and skirt, bounce on pulses; verify by observation
- [ ] 9.5 Make the album button only wiggle when tapped; verify

## 10. Audio

- [ ] 10.1 Create the audio engine on the first interaction with a master gain tied to mute; verify no sound before the play tap and none while muted
- [ ] 10.2 Add pentatonic sparkle notes, small and big whoom, bloom chime, bump boing and the celebration chord; verify each by triggering it
- [ ] 10.3 Add dumbo's flute call and the ambient pad with an extra layer when half the plants are lit; verify by listening

## 11. Playtest and wrap-up

- [ ] 11.1 Run the first-five-minutes walkthrough from `GAME_DESIGN.md` on a laptop; verify every step happens in order
- [ ] 11.2 Run it on a real tablet over the local network; verify 60 fps, no browser gestures, readable hints, and that dumbo is found within about 3 minutes
- [ ] 11.3 Serve `dist/` from a subfolder and open it inside a 960×600 iframe on a test page; verify it fills the frame, all models load, and arrow keys do not scroll the outer page after the first click
- [ ] 11.4 Run `npm test` and `npm run build`; verify both pass with no errors
