"""Three seabed segments for Midnight home that tile end to end.

    python3 tools/make_seabed.py

Writes models/seabed-1.glb … models/seabed-3.glb. Each segment is 12 world
units wide (x from -6 to 6). The surface rises gently toward the back and has
a steep front face so the seabed reads as a ledge from the side-on camera.

Tiling: every segment has the same height profile on its first and last
column, so any two segments can sit side by side without a gap. The height
of the play plane (y = 0) is printed per column: it is the seabed collider
line in src/levels/pieces.ts.
"""

import math

from lowpoly import Model, write_glb
from midnight import SEABED, SEABED_EDGE, seeded

WIDTH = 12.0
COLUMNS = 13  # x = -6 … 6, one unit apart
ROWS = (-2.5, -1.2, 0.0, 1.5, 3.5, 6.0)  # front (toward camera) to back
FRONT_DROP = -3.0

# Variant: (seed, bump amplitude, bump count, phase)
VARIANTS = {
    "seabed-1": (5, 0.55, 2, 0.0),
    "seabed-2": (9, 0.8, 1, 0.0),
    "seabed-3": (13, 0.45, 3, 1.3),
}


def back_rise(y):
    return 0.0 if y <= 0.0 else 1.4 * (y / 6.0) ** 1.4


def height(x, y, amplitude, bumps, phase):
    """Height of the surface. Vanishes at the segment ends, so every variant
    meets every other one at the same edge heights."""
    t = (x + WIDTH / 2) / WIDTH
    envelope = math.sin(math.pi * t) ** 2
    wave = 0.5 + 0.5 * math.sin(2 * math.pi * bumps * t + phase - math.pi / 2)
    return back_rise(y) + amplitude * envelope * wave


def build(name, seed, amplitude, bumps, phase):
    rng = seeded(seed)
    model = Model(name)
    xs = [-WIDTH / 2 + i for i in range(COLUMNS)]

    grid = []
    for y in ROWS:
        row = []
        for i, x in enumerate(xs):
            z = height(x, y, amplitude, bumps, phase)
            edge = i in (0, COLUMNS - 1)
            # Wobble interior vertices off the play plane so the surface is
            # faceted; the play-plane row stays exact for the collider.
            if not edge and y != 0.0:
                z += rng.uniform(-0.12, 0.12)
                jx = rng.uniform(-0.25, 0.25)
            else:
                jx = 0.0
            row.append((x + jx, y, z))
        grid.append(row)

    verts = [v for row in grid for v in row]
    faces = []
    for r in range(len(ROWS) - 1):
        for i in range(COLUMNS - 1):
            a = r * COLUMNS + i
            b = a + 1
            c = a + COLUMNS + 1
            d = a + COLUMNS
            # Two triangles; normals point up (+z).
            faces.append((a, b, c))
            faces.append((a, c, d))
    model.add(verts, faces, SEABED)

    # Front face: the front row dropped straight down.
    front = grid[0]
    low = [(x, y - 0.3, FRONT_DROP) for x, y, _z in front]
    fverts = front + low
    ffaces = []
    for i in range(COLUMNS - 1):
        ffaces.append((i, COLUMNS + i, COLUMNS + i + 1, i + 1))
    model.add(fverts, ffaces, SEABED_EDGE)
    return model, [height(x, 0.0, amplitude, bumps, phase) for x in xs]


if __name__ == "__main__":
    for name, args in VARIANTS.items():
        seabed, line = build(name, *args)
        seabed.check()
        write_glb(seabed)
        print(f"  {name} play-plane heights:", [round(h, 2) for h in line])
