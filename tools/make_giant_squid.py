"""Low-poly giant squid, the gentle giant of the whale fall.

    python3 tools/make_giant_squid.py

Writes models/giant-squid.glb and artwork/giant-squid-model-preview.svg.

Built in profile: the body lies along X, the head and arms point right (+X),
and the camera (-Y) sees its side. The game flips it when it swims left and
scales it up to several times the vampire squid.
"""

import math

from lowpoly import (
    Model, add_eye, circle, face_normal, flat, gem, lathe, pyramid,
    ridge, write_glb, write_preview,
)

BACK = ("#E8724A", "#D85A30", "#B5482A")
BELLY = ("#FAD9CC", "#F5C4B3", "#F0997B")
FIN = ("#F0997B", "#E8724A", "#D85A30")
ARM = ("#D85A30", "#B5482A", "#993C1D")
CLUB = ("#FAD9CC", "#F5C4B3", "#F0997B")
EYE = ("#FFFFFF", "#FAECE7", "#F1D9CF")
PUPIL = ("#712B13", "#4A1B0C", "#4A1B0C")
SHINE = flat("#FFFFFF")

SIDES = 8

# (radius, position along the body), head end first.
PROFILE = [
    (0.4, 1.15),
    (0.68, 0.9),
    (0.56, 0.6),
    (0.82, 0.3),
    (0.85, -0.6),
    (0.68, -1.6),
    (0.38, -2.4),
]
NOSE = 1.25
TAIL = -2.9


def along_x(point):
    """Lay a shape built standing up along +X instead."""
    x, y, z = point
    return (z, y, -x)


def build():
    model = Model("giant-squid")

    # Long torpedo body and head in one piece, with a pale belly.
    turn = math.pi / SIDES
    rings = [[(0.0, 0.0, NOSE)]]
    rings += [circle(SIDES, r, x, turn) for r, x in PROFILE]
    rings += [[(0.0, 0.0, TAIL)]]
    verts, faces = lathe(rings)
    verts = [along_x(v) for v in verts]
    for face in faces:
        pts = [verts[v] for v in face]
        palette = BELLY if face_normal(pts)[2] < -0.3 else BACK
        model.add(pts, [tuple(range(len(pts)))], palette)

    # Arrowhead tail fins, standing up so they read from the side.
    for side in (-1, 1):
        fin_base = [
            (-1.6, -0.09, side * 0.6),
            (-2.75, -0.09, side * 0.17),
            (-2.75, 0.09, side * 0.17),
            (-1.6, 0.09, side * 0.6),
        ]
        model.add(*pyramid(fin_base, (-2.35, 0.0, side * 1.5)), FIN)

    # Eight arms fanning out in front of the head.
    for k in range(8):
        angle = 2 * math.pi * (k + 0.5) / 8
        c, s = math.cos(angle), math.sin(angle)
        around = (0.0, -s, c)
        path = [
            (1.08, 0.27 * c, 0.27 * s),
            (1.65, 0.48 * c, 0.48 * s - 0.05),
            (2.35, 0.56 * c, 0.56 * s - 0.2),
        ]
        parts, _tip = ridge(path, around, (0.17, 0.13, 0.06), tip_length=0.18)
        for part_v, part_f in parts:
            model.add(part_v, part_f, ARM)

    # Two much longer tentacles ending in pale clubs.
    for side in (-1, 1):
        path = [
            (1.1, side * 0.08, side * 0.12),
            (2.1, side * 0.14, side * 0.75),
            (3.0, side * 0.1, side * 0.55),
            (3.7, 0.0, side * 0.85),
        ]
        parts, tip = ridge(path, (0.0, 1.0, 0.0), (0.12, 0.105, 0.09, 0.075), tip_length=0.1)
        for part_v, part_f in parts:
            model.add(part_v, part_f, ARM)
        model.add(*gem(tip, 0.26), CLUB)

    # One huge eye on each side of the head.
    for side in (-1, 1):
        add_eye(model, (0.88, side * 0.57, 0.12), (0.0, float(side), 0.1), -1,
                0.42, EYE, PUPIL, SHINE, pupil_size=0.58)

    return model


if __name__ == "__main__":
    giant = build()
    giant.check()
    write_glb(giant)
    write_preview(giant, scale=38)
