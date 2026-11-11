## Why

The game exists only as a design document and six 3D models. Many decisions (zones, friends, album, cosmetics) are deliberately postponed until there is something a 6-year-old can actually play. This first iteration builds the smallest playable slice — one zone, one friend, the full core loop — to test whether swim + collect + glow is fun on its own.

This is iteration 1 of 8. The later iterations are separate build changes (`iteration-2-twilight` … `iteration-8-later-friends-and-zones`).

## What Changes

- New browser game project (TypeScript + Vite + Three.js) that runs on a tablet in landscape and on a laptop
- Title screen with the squid bobbing in dark water and one big play button
- Side-on 2.5D camera that follows the squid
- The vampire squid, loaded from `models/squid.glb`, swimming with touch (swim toward the finger) or arrow keys, with floaty easing, soft walls and code-driven animation (cape, ears, blink, idle "pineapple pose")
- Sparkles (star-shaped marine snow) drifting in the water, collected by touch, each playing a note and filling the glow meter
- Glow pulse: a ring of light from the squid; a full meter gives a big pulse
- Glow plants in Midnight home that bloom and stay lit when reached by a glow
- Midnight home zone: dark seabed, rock arch, small cave, about 20 glow plants, sparkle trails as breadcrumbs
- Dumbo octopus hidden in the cave: blinking eyes, pops out when glowed near, does a happy spin, then follows the squid and points toward the nearest unlit plant
- A sticker fly-in to an album button when dumbo is found (the album button is visible but the album itself comes in iteration 3)
- Controls overlay: icon hints for touch and keyboard that fade after first use and return after about 20 seconds idle
- Synthesised audio: notes for sparkles, glow sound, ambient pad, dumbo's call, always-visible mute button
- Bump reaction: a silly spin and a sparkle cloud when hitting a wall

Not in this iteration (recorded so they are not forgotten): save/continue, album pages, dash, bubble rings, starfish, other zones and friends, Italian, offline mode, parent corner.

## Capabilities

### New Capabilities

- `game-shell`: app bootstrap, title screen, side-on camera, scene lighting, render loop, mute button, landscape layout and browser-gesture blocking
- `squid-swimming`: player input (touch and keyboard), floaty movement, soft walls, bump reaction, squid animation
- `sparkles`: drifting star-shaped collectibles, magnet pickup, glow-meter filling
- `glow-pulse`: glow meter, glow input, small and big pulse, what a pulse lights up
- `midnight-home`: the demo zone layout, glow plants that stay lit, sparkle breadcrumb trails
- `dumbo-octopus`: dumbo hidden in the cave, discovery, sticker fly-in, follow and point behaviour
- `controls-hints`: icon-only control hints that fade after use and return when idle
- `game-audio`: synthesised notes and sounds, ambient pad, mute

### Modified Capabilities

None (no specs exist yet).

## Impact

- New files: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/**`, `public/**` (models copied or served from `models/`)
- New dependencies: `three`, `vite`, `typescript`, `vitest`
- Existing `models/*.glb` are used as-is; `models/squid.glb` and `models/dumbo-octopus.glb` are needed in this iteration
- New environment model scripts in `tools/` and their `.glb` files: rocks, seabed segments, arch, cave, glow plant and sparkle
- No backend, no network calls, no data collection
