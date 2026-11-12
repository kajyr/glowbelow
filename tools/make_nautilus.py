"""Low-poly nautilus, the slow old friend that cruises up and down Twilight.

    python3 tools/make_nautilus.py

Writes models/nautilus.glb and artwork/nautilus-model-preview.svg.

Parts (one node each, for animation in the game): shell, head (body, hood
and eyes), tentacles.

Unlike the other creatures, the nautilus is built in profile: the flat side
of the shell faces the camera (-Y) and the animal looks to the right (+X).
The game flips it when it travels left.
"""

import math

from lowpoly import (
    Model, add, add_eye, dome, flat, lathe, mul, placed, ridge, unit,
    write_glb, write_preview,
)

SHELL = ("#FFFFFF", "#FAECE7", "#F1D9CF")
STRIPE = ("#E8724A", "#D85A30", "#B5482A")
CENTER = ("#F8D3C5", "#F5C4B3", "#E9AC97")
BODY = ("#FAD9CC", "#F5C4B3", "#F0997B")
HOOD = ("#C9633B", "#A84A26", "#863618")
ARM = ("#F8D3C5", "#F5C4B3", "#F0997B")
EYE = ("#FFFFFF", "#FAECE7", "#F1D9CF")
PUPIL = ("#712B13", "#4A1B0C", "#4A1B0C")
SHINE = flat("#FFFFFF")

SEGMENTS = 12
START = math.radians(10)  # where the small end of the spiral tucks in


def growth(j):
    """The shell gets wider as it winds round, which leaves a step at the
    opening between the last segment and the first."""
    return 0.72 + 0.5 * j / (SEGMENTS - 1)


def shell_ring(radius, half_thickness):
    points = []
    for j in range(SEGMENTS):
        angle = START + 2 * math.pi * j / SEGMENTS
        g = growth(j)
        points.append((radius * g * math.cos(angle), radius * g * math.sin(angle),
                       half_thickness * g))
    return points


def on_edge(point):
    """Stand a shape built flat on the ground up on its edge, facing -Y."""
    x, y, z = point
    return (x, -z, y)


def build():
    model = Model("nautilus")

    # Shell: a fat lens, striped in wedges, pale around the center.
    rings = [
        [(0.0, 0.0, 0.3)],
        shell_ring(0.35, 0.36),
        shell_ring(0.8, 0.3),
        shell_ring(1.0, 0.0),
        shell_ring(0.8, -0.3),
        shell_ring(0.35, -0.36),
        [(0.0, 0.0, -0.3)],
    ]
    verts, faces = lathe(rings)
    verts = [on_edge(v) for v in verts]
    bands = len(rings) - 1
    for i, face in enumerate(faces):
        band, j = divmod(i, SEGMENTS)
        if band in (0, bands - 1):
            palette = CENTER
        elif j % 2 == 1 and j <= 9:
            palette = STRIPE
        else:
            palette = SHELL
        model.add([verts[v] for v in face], [tuple(range(len(face)))], palette, part="shell")

    # Soft body poking out of the opening, looking right and a little down.
    forward = unit((1.0, 0.0, -0.22))
    body_v, body_f = dome(0.44, 0.62, segments=8)
    body = placed(body_v, (0.78, 0.0, -0.1), forward)
    model.add([(x, y * 0.78, z) for x, y, z in body], body_f, BODY, part="head")
    model.pivot("head", (0.78, 0.0, -0.1))

    # Hood: a leathery cap over the top of the head.
    hood_v, hood_f = dome(0.46, 0.2, segments=6)
    hood = placed(hood_v, (1.0, 0.0, 0.2), (0.3, 0.0, 1.0))
    model.add([(x, y * 0.8, z) for x, y, z in hood], hood_f, HOOD, part="head")

    # A fan of short tentacles.
    spread = [(8, 0.0), (-8, 0.14), (-8, -0.14), (-26, 0.0),
              (-42, 0.13), (-42, -0.13), (-58, 0.0)]
    for degrees, y in spread:
        a = math.radians(degrees)
        direction = (math.cos(a), 0.0, math.sin(a))
        start = (1.22, y, -0.2)
        path = [
            start,
            add(start, mul(direction, 0.25)),
            add(add(start, mul(direction, 0.45)), (0.0, 0.0, -0.04)),
        ]
        parts, _tip = ridge(path, (0.0, 1.0, 0.0), (0.1, 0.085, 0.055), tip_length=0.1)
        for part_v, part_f in parts:
            model.add(part_v, part_f, ARM, part="tentacles")
    model.pivot("tentacles", (1.22, 0.0, -0.2))

    # One eye on each side of the head.
    for side in (-1, 1):
        add_eye(model, (1.05, side * 0.27, 0.0), (0.0, float(side), 0.0), -1,
                0.17, EYE, PUPIL, SHINE, pupil_size=0.6, part="head")

    return model


if __name__ == "__main__":
    nautilus = build()
    nautilus.check()
    write_glb(nautilus)
    write_preview(nautilus, scale=75)
