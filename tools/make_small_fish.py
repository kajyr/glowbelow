"""Small fish: a tiny, friendly set-dressing fish, drawn in small schools.

    python3 tools/make_small_fish.py

Writes models/small-fish.glb and artwork/small-fish-model-preview.svg.
About 0.6 world units long, in profile facing +X (the camera is on -Y). The
game instances it in schools, flips it to swim left and sways it as a whole.
Reused in later zones.
"""

import math

from lowpoly import Model, add_eye, circle, face_out, flat, lathe, pyramid, write_glb, write_preview

BODY = ("#CFE8F4", "#A8CFE6", "#7FAFD0")
BELLY = ("#F4F1E4", "#E2DECC", "#C9C4AE")
FIN = ("#9FD0E8", "#7DB6D8", "#5E97BE")
EYE = ("#FFFFFF", "#F1F4F6", "#E1E6EA")
PUPIL = ("#1E2A44", "#16203A", "#16203A")
SHINE = flat("#FFFFFF")


def build():
    model = Model("small-fish")

    # Body: a short lathe along X, pale belly underneath.
    stations = [(0.22, 0.07), (0.1, 0.12), (-0.06, 0.11), (-0.2, 0.05)]
    rings = [[(0.0, 0.0, 0.3)]] + [circle(6, r, x) for x, r in stations] + [[(0.0, 0.0, -0.24)]]
    verts, faces = lathe(rings)
    verts = [(z, y * 0.6, x * 0.85 + 0.0) for x, y, z in [(v[0], v[1], v[2]) for v in verts]]
    # lathe rings are built around +Z; lay them along X: (x, y, z) -> (z, y, x)
    for face in faces:
        pts = [verts[i] for i in face]
        mid_z = sum(p[2] for p in pts) / len(pts)
        model.add(*face_out(pts, [tuple(range(len(pts)))], (0.0, 0.0, 0.0)), BELLY if mid_z < -0.05 else BODY)

    # Tail fin: a flat triangle pair.
    tail = [(-0.2, 0.0, 0.0), (-0.36, -0.015, 0.12), (-0.33, 0.0, 0.0), (-0.36, -0.015, -0.12)]
    model.add(*face_out(tail + [(-0.3, 0.03, 0.0)], [(0, 1, 2), (0, 2, 3), (0, 1, 4), (0, 4, 3)], (-0.28, 0.0, 0.0)), FIN)
    # Back fin.
    model.add(*pyramid([(0.05, -0.02, 0.09), (-0.08, -0.02, 0.08), (-0.08, 0.02, 0.08), (0.05, 0.02, 0.09)], (-0.06, 0.0, 0.17)), FIN)

    add_eye(model, (0.13, -0.065, 0.025), (0.2, -1.0, 0.05), -1, 0.035, EYE, PUPIL, SHINE, pupil_size=0.6)
    return model


if __name__ == "__main__":
    fish = build()
    fish.check()
    write_glb(fish)
    write_preview(fish, scale=320)
