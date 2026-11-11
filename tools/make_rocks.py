"""Four low-poly rock variants for Midnight home.

    python3 tools/make_rocks.py

Writes models/rock-1.glb … models/rock-4.glb. Rocks sit on z = 0 (a little
sunk below it) and are about 1.5–3 world units across. Their colliders are in
src/levels/pieces.ts.
"""

import math

from lowpoly import Model, lathe, write_glb
from midnight import ROCK, ROCK_ALT, lumpy_ring, seeded

# name: (seed, half width, half depth, height, palette, segments, lean)
VARIANTS = {
    "rock-1": (11, 1.0, 0.9, 1.5, ROCK, 7, 0.10),    # round boulder
    "rock-2": (23, 1.5, 1.0, 1.0, ROCK_ALT, 8, -0.15),  # low wide slab
    "rock-3": (37, 0.7, 0.7, 2.4, ROCK, 6, 0.20),    # tall spire
    "rock-4": (41, 1.3, 1.1, 1.8, ROCK_ALT, 8, -0.05),  # big lump
}

# Radius and height fractions from the sunk base to the top.
PROFILE = ((1.0, -0.15), (1.08, 0.3), (0.92, 0.62), (0.58, 0.88), (0.0, 1.0))


def build(name, seed, rx, ry, height, palette, segments, lean):
    rng = seeded(seed)
    model = Model(name)
    rings = [[(0.0, 0.0, -0.2 * height)]]
    for frac, zfrac in PROFILE:
        z = zfrac * height
        shift = lean * max(zfrac, 0.0) * height
        if frac == 0.0:
            rings.append([(shift + rng.uniform(-0.1, 0.1), 0.0, z)])
            continue
        ring = lumpy_ring(rng, segments, rx * frac, ry * frac, z, 0.14,
                          offset=rng.uniform(0, math.pi))
        rings.append([(x + shift, y, zz + rng.uniform(-0.06, 0.06) * height) for x, y, zz in ring])
    # lathe() lists rings top to bottom.
    model.add(*lathe(list(reversed(rings))), palette)
    return model


if __name__ == "__main__":
    for name, args in VARIANTS.items():
        rock = build(name, *args)
        rock.check()
        write_glb(rock)
