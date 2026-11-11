"""Low-poly cuttlefish, the colour-changing show-off of the reef.

    python3 tools/make_cuttlefish.py

Writes models/cuttlefish.glb and artwork/cuttlefish-model-preview.svg.

Built in profile like the nautilus: the body lies along X, the head and arms
point right (+X), and the camera (-Y) sees its side. The game flips it when
it swims left.
"""

import math

from lowpoly import (
    Model, add_eye, centroid, circle, face_normal, flat, lathe, ridge,
    write_glb, write_preview,
)

BACK = ("#2FAE85", "#1D9E75", "#168763")
BELLY = ("#D6F3E8", "#9FE1CB", "#7BD3B6")
FIN = ("#B9EBDA", "#9FE1CB", "#7BD3B6")
ARM = ("#1D9E75", "#168763", "#0F6E56")
PATCHES = (flat("#EF9F27"), flat("#E8724A"), flat("#D4537E"))
EYE = ("#FFFFFF", "#E1F5EE", "#C9EADD")
PUPIL = ("#085041", "#04342C", "#04342C")
SHINE = flat("#FFFFFF")

SIDES = 8
SQUASH = 1.15  # the body is a little taller than it is wide

# (radius, position along the body), head end first.
PROFILE = [
    (0.34, 1.02),
    (0.54, 0.82),
    (0.46, 0.5),
    (0.72, 0.0),
    (0.66, -0.55),
    (0.4, -1.0),
]
TAIL = -1.2
NOSE = 1.12


def along_x(point):
    """Lay a shape built standing up along +X instead, and squash it."""
    x, y, z = point
    return (z, y, -x * SQUASH)


def width_at(x):
    """Half-width of the body at a position along it."""
    for (r1, x1), (r2, x2) in zip(PROFILE, PROFILE[1:]):
        if x2 <= x <= x1:
            t = (x - x2) / (x1 - x2)
            return r2 + (r1 - r2) * t
    return PROFILE[-1][0] if x < PROFILE[-1][1] else PROFILE[0][0]


def build():
    model = Model("cuttlefish")

    # Body and head in one piece: teal back with bright patches, pale belly.
    turn = math.pi / SIDES
    rings = [[(0.0, 0.0, NOSE)]]
    rings += [circle(SIDES, r, x, turn) for r, x in PROFILE]
    rings += [[(0.0, 0.0, TAIL)]]
    verts, faces = lathe(rings)
    verts = [along_x(v) for v in verts]
    for i, face in enumerate(faces):
        band, j = divmod(i, SIDES)
        pts = [verts[v] for v in face]
        up = face_normal(pts)[2]
        on_mantle = centroid(pts)[0] < 0.5
        if up > -0.1 and on_mantle and (band + j) % 2 == 0:
            palette = PATCHES[(band + j // 2) % 3]
        elif up < -0.3:
            palette = BELLY
        else:
            palette = BACK
        model.add(pts, [tuple(range(len(pts)))], palette)

    # Frilly fin: a wavy ribbon hanging along each side of the mantle.
    steps = 9
    for side in (-1, 1):
        inner, outer = [], []
        for i in range(steps):
            x = -1.1 + 1.5 * i / (steps - 1)
            w = width_at(x)
            taper = math.sin(math.pi * (i + 0.5) / steps) ** 0.6
            wave = 0.07 if i % 2 == 0 else -0.07
            inner.append((x, side * w * 0.92, -0.08))
            outer.append((x, side * (w + 0.2 * taper), -0.12 - (0.2 + wave) * taper))
        strip = inner + outer
        for i in range(steps - 1):
            quad = (i, i + 1, steps + i + 1, steps + i)
            model.add(strip, [quad, tuple(reversed(quad))], FIN)

    # Eight short arms bunched together at the front.
    for k in range(8):
        angle = 2 * math.pi * (k + 0.5) / 8
        c, s = math.cos(angle), math.sin(angle) * SQUASH
        around = (0.0, -math.sin(angle), math.cos(angle))
        path = [
            (0.95, 0.22 * c, 0.22 * s),
            (1.35, 0.32 * c, 0.32 * s - 0.04),
            (1.75, 0.3 * c, 0.3 * s - 0.16),
        ]
        parts, _tip = ridge(path, around, (0.11, 0.09, 0.05), tip_length=0.12)
        for part_v, part_f in parts:
            model.add(part_v, part_f, ARM)

    # One eye on each side of the head.
    for side in (-1, 1):
        add_eye(model, (0.8, side * 0.46, 0.12), (0.0, float(side), 0.12), -1,
                0.25, EYE, PUPIL, SHINE, pupil_size=0.6)

    return model


if __name__ == "__main__":
    cuttlefish = build()
    cuttlefish.check()
    write_glb(cuttlefish)
    write_preview(cuttlefish, scale=70)
