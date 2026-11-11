"""Rock arch for Midnight home.

    python3 tools/make_arch.py

Writes models/arch.glb. A thick half-ellipse of rock standing on z = 0, seen
from the front. The opening is 4.4 units wide and 3 units tall, room for the
squid and dumbo to swim through side by side. Its collider (a chain of
circles along the middle of the rock) is in src/levels/pieces.ts.
"""

import math

from lowpoly import Model, centroid, face_out, write_glb
from midnight import ROCK, seeded

INNER = (2.2, 3.0)   # half width, height of the opening
OUTER = (3.4, 4.2)
DEPTH = 0.9          # half depth (toward and away from the camera)
STATIONS = 12


def build():
    rng = seeded(7)
    model = Model("arch")
    sections = []
    for k in range(STATIONS + 1):
        a = math.pi * k / STATIONS
        bulge = 1.0 + rng.uniform(-0.06, 0.08)
        foot = -0.3 if k in (0, STATIONS) else 0.0
        c, s = math.cos(a), math.sin(a)
        inner = (INNER[0] * c, INNER[1] * s + foot)
        outer = (OUTER[0] * bulge * c, OUTER[1] * bulge * s + foot)
        d = DEPTH * (1.0 + rng.uniform(-0.15, 0.15))
        # front-inner, front-outer, back-outer, back-inner
        sections.append([
            (inner[0], -d, inner[1]),
            (outer[0], -d * 1.05, outer[1]),
            (outer[0], d * 1.05, outer[1]),
            (inner[0], d, inner[1]),
        ])

    for k in range(STATIONS):
        a, b = sections[k], sections[k + 1]
        verts = a + b
        faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
        model.add(*face_out(verts, faces, centroid(verts)), ROCK)

    # Caps under the two feet.
    for cap in (sections[0], sections[-1]):
        model.add(*face_out(cap, [(0, 1, 2, 3)], (0.0, 0.0, 1.0)), ROCK)
    return model


if __name__ == "__main__":
    arch = build()
    arch.check()
    write_glb(arch)
