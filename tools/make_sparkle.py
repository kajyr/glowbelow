"""Sparkle: a small chunky five-point star of glowing marine snow.

    python3 tools/make_sparkle.py

Writes models/sparkle.glb. About 0.3 world units across, facing the camera,
every face emissive. The game draws hundreds of them with one InstancedMesh.
"""

import math

from lowpoly import Model, face_out, write_glb
from midnight import SPARKLE

POINTS = 5
OUTER = 0.16
INNER = 0.075
THICK = 0.05


def build():
    model = Model("sparkle")
    rim = []
    for j in range(POINTS * 2):
        a = math.pi / 2 + math.pi * j / POINTS
        r = OUTER if j % 2 == 0 else INNER
        rim.append((r * math.cos(a), 0.0, r * math.sin(a)))
    front = (0.0, -THICK, 0.0)
    back = (0.0, THICK, 0.0)
    verts = rim + [front, back]
    n = len(rim)
    faces = []
    for j in range(n):
        faces.append((j, (j + 1) % n, n))
        faces.append((j, (j + 1) % n, n + 1))
    model.add(*face_out(verts, faces, (0.0, 0.0, 0.0)), SPARKLE, glow=True)
    return model


if __name__ == "__main__":
    sparkle = build()
    sparkle.check()
    write_glb(sparkle, glow_color=SPARKLE[1])
