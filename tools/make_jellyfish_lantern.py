"""Jellyfish lantern for Twilight: a small round jelly that lights up.

    python3 tools/make_jellyfish_lantern.py

Writes models/jellyfish-lantern.glb. Built in world units, about 1.2 units
across. Parts (one node each, for animation in the game):
- bell: the round, pale-lavender bell, pivot at its centre
- glow: a warm glowing heart inside the bell (emissive); the game hides it
  while the lantern is unlit and grows it when it lights up
- tentacles: short wavy tentacles under the bell, pivot under the bell
"""

import math

from lowpoly import Model, circle, face_out, gem, lathe, write_glb

BELL = ("#D6D2FA", "#B9B3EE", "#948DD6")
RIM = ("#ECE9FF", "#D6D2FA", "#B9B3EE")
GLOW = ("#FFE7B0", "#FFD58A", "#FFD58A")
TENTACLE = ("#C9C3F4", "#A9A1E4", "#8A82CC")

SEGMENTS = 10


def build():
    model = Model("jellyfish-lantern")

    # Bell: a round dome, a little taller than wide, open underneath.
    rings = [
        [(0.0, 0.0, 0.62)],
        circle(SEGMENTS, 0.32, 0.56),
        circle(SEGMENTS, 0.52, 0.36),
        circle(SEGMENTS, 0.6, 0.08),
        circle(SEGMENTS, 0.56, -0.12),
    ]
    verts, faces = lathe(rings)
    model.add(*face_out(verts, faces, (0.0, 0.0, 0.2)), BELL, part="bell")
    # A frilly rim.
    top = circle(SEGMENTS * 2, 0.57, -0.12)
    bottom = [(x * 1.08, y * 1.08, -0.2 - 0.04 * (i % 2)) for i, (x, y, _z) in enumerate(circle(SEGMENTS * 2, 0.57, 0.0))]
    n = SEGMENTS * 2
    rim_faces = [(j, (j + 1) % n, n + (j + 1) % n, n + j) for j in range(n)]
    model.add(*face_out(top + bottom, rim_faces, (0.0, 0.0, 0.3)), RIM, part="bell")
    model.pivot("bell", (0.0, 0.0, 0.2))

    # Warm heart inside the bell.
    model.add(*gem((0.0, 0.0, 0.22), 0.26), GLOW, glow=True, part="glow")
    model.pivot("glow", (0.0, 0.0, 0.22))

    # Short tentacles: thin wavy ribbons hanging below the bell.
    for k in range(6):
        a = 2 * math.pi * k / 6 + 0.3
        rx, ry = 0.36 * math.cos(a), 0.36 * math.sin(a)
        left, right = [], []
        steps = 5
        for i in range(steps + 1):
            t = i / steps
            z = -0.15 - 0.9 * t
            sway = 0.12 * math.sin(k + t * 4.0) * t
            w = 0.05 * (1 - 0.6 * t) + 0.015
            left.append((rx + sway - w, ry, z))
            right.append((rx + sway + w, ry, z))
        verts = left + right
        m = steps + 1
        front = [(i, i + 1, m + i + 1, m + i) for i in range(steps)]
        back = [tuple(reversed(f)) for f in front]
        model.add(verts, front + back, TENTACLE, part="tentacles")
    model.pivot("tentacles", (0.0, 0.0, -0.12))
    return model


if __name__ == "__main__":
    lantern = build()
    lantern.check()
    write_glb(lantern, glow_color=GLOW[1])
