"""Bubble ring: a hoop of bubbles hanging in the water, to swim through.

    python3 tools/make_bubble_ring.py

Writes models/bubble-ring.glb and artwork/bubble-ring-model-preview.svg.
The ring stands in the play plane, facing the camera, about 2 world units
across (a bit taller than the squid). Each bubble is its own part
(bubble-0 ... bubble-11), pivoted at its centre, so the game can pop them
one by one and grow them back.
"""

import math

from lowpoly import Model, circle, face_out, lathe, write_glb, write_preview

BUBBLE = ("#E6F7FF", "#B8E4F8", "#8CCBEA")
BUBBLES = 12
RADIUS = 1.0
SIDES = 6


def bubble(center, r):
    """A small low-poly sphere: two caps and a waist, six sides."""
    rings = [
        [(0.0, 0.0, r)],
        circle(SIDES, r * 0.75, r * 0.6),
        circle(SIDES, r, 0.0, offset=math.pi / SIDES),
        circle(SIDES, r * 0.75, -r * 0.6),
        [(0.0, 0.0, -r)],
    ]
    verts, faces = lathe(rings)
    cx, cy, cz = center
    return face_out([(x + cx, y + cy, z + cz) for x, y, z in verts], faces, center)


def build():
    model = Model("bubble-ring")
    for i in range(BUBBLES):
        a = math.pi / 2 + 2 * math.pi * i / BUBBLES
        # Sizes vary a little round the ring, so it reads as bubbles, not beads.
        r = 0.17 + 0.05 * (0.5 + 0.5 * math.sin(i * 2.3))
        center = (RADIUS * math.cos(a), 0.0, RADIUS * math.sin(a))
        name = f"bubble-{i}"
        model.add(*bubble(center, r), BUBBLE, part=name)
        model.pivot(name, center)
    return model


if __name__ == "__main__":
    ring = build()
    ring.check()
    write_glb(ring)
    write_preview(ring, scale=70)
