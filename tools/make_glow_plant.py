"""Glow plant for Midnight home: a stem with a bud that opens into petals.

    python3 tools/make_glow_plant.py

Writes models/glow-plant.glb with three parts:
- stem: curved stalk with two leaves, pivot at the base
- bud: closed bud on top of the stem, pivot at the stem top
- petals: five open petals with glowing tips and a glowing heart, pivot at
  the stem top

The game shows the bud and hides the petals (scale 0) while the plant is
unlit, then shrinks the bud and grows the petals to bloom. About 1.3 world
units tall when open.
"""

import math

from lowpoly import Model, add, circle, gem, lathe, mul, pyramid, ridge, unit, write_glb
from midnight import BUD, PETAL, PETAL_GLOW, STEM

TOP = (0.08, 0.0, 0.95)
PETALS = 5


def build():
    model = Model("glow-plant")

    # Stem: a gentle S-curve from the seabed to the top.
    path = [(0.0, 0.0, -0.1), (-0.05, 0.0, 0.3), (0.06, 0.0, 0.65), TOP]
    parts, _tip = ridge(path, (1.0, 0.0, 0.0), (0.07, 0.06, 0.05, 0.04), tip_length=0.02)
    for verts, faces in parts:
        model.add(verts, faces, STEM, part="stem")

    # Two leaves: flat pyramids sticking out sideways.
    for side, z in ((-1, 0.28), (1, 0.5)):
        base = [(0.0, -0.05, z - 0.05), (0.0, 0.05, z - 0.05), (0.0, 0.05, z + 0.05), (0.0, -0.05, z + 0.05)]
        model.add(*pyramid(base, (side * 0.32, 0.0, z + 0.15)), STEM, part="stem")
    model.pivot("stem", (0.0, 0.0, 0.0))

    # Closed bud: a teardrop.
    rings = [
        [(0.0, 0.0, 0.38)],
        circle(6, 0.09, 0.28),
        circle(6, 0.16, 0.14),
        circle(6, 0.12, 0.02),
        [(0.0, 0.0, -0.04)],
    ]
    verts, faces = lathe(rings)
    model.add([add(TOP, v) for v in verts], faces, BUD, part="bud")
    model.pivot("bud", TOP)

    # Open petals around a glowing heart.
    for k in range(PETALS):
        a = 2 * math.pi * k / PETALS + 0.3
        out = unit((math.cos(a), math.sin(a), 0.9))
        side = (-math.sin(a), math.cos(a), 0.0)
        p0 = add(TOP, mul(out, 0.05))
        p1 = add(TOP, add(mul(out, 0.22), (0.0, 0.0, 0.06)))
        p2 = add(TOP, add(mul(out, 0.36), (0.0, 0.0, 0.04)))
        parts, tip = ridge([p0, p1, p2], side, (0.06, 0.1, 0.07), tip_length=0.06)
        for verts, faces in parts:
            model.add(verts, faces, PETAL, part="petals")
        model.add(*gem(tip, 0.055), PETAL_GLOW, glow=True, part="petals")
    model.add(*gem(add(TOP, (0.0, 0.0, 0.1)), 0.09), PETAL_GLOW, glow=True, part="petals")
    model.pivot("petals", TOP)
    return model


if __name__ == "__main__":
    plant = build()
    plant.check()
    write_glb(plant, glow_color=PETAL_GLOW[1])
