"""Starfish: a chunky, shy five-armed star that lights up when found.

    python3 tools/make_starfish.py

Writes models/starfish.glb and artwork/starfish-model-preview.svg.
About 1.1 world units across, lying in the play plane facing the camera
(the game turns it to sit on a rock or the seabed). Parts: body (with
small eyes and a smile) and arm-0 ... arm-4, each pivoted where it joins
the body so it can wave. The arm tips glow, for the lit state.
"""

import math

from lowpoly import Model, add_eye, add_smile, face_out, flat, write_glb, write_preview

STAR = ("#F7B48A", "#E8865C", "#C9653F")
TIP = ("#FFE9C2", "#FFD58F", "#FFC46B")
EYE = ("#FFFFFF", "#FBEFE6", "#F1DCCD")
PUPIL = ("#4A1B0C", "#3A1508", "#3A1508")
SHINE = flat("#FFFFFF")
MOUTH = flat("#8A3B1E")

ARMS = 5
ROOT = 0.17  # where an arm meets the body
TIP_AT = 0.55
THICK = 0.11


def arm(a):
    """A tapered, slightly domed arm from the body to its tip, in the XZ plane."""
    c, s = math.cos(a), math.sin(a)
    side = (-s, c)

    def at(r, w, y=0.0):
        return [(c * r + side[0] * w, y, s * r + side[1] * w), (c * r - side[0] * w, y, s * r - side[1] * w)]

    root = at(ROOT, 0.15)
    mid = at(0.36, 0.1)
    end = at(TIP_AT - 0.06, 0.05)
    ridge = [(c * ROOT, -THICK, s * ROOT), (c * 0.36, -THICK * 0.8, s * 0.36), (c * (TIP_AT - 0.06), -THICK * 0.4, s * (TIP_AT - 0.06))]
    back = [(c * ROOT, THICK * 0.5, s * ROOT), (c * 0.36, THICK * 0.4, s * 0.36), (c * (TIP_AT - 0.06), THICK * 0.2, s * (TIP_AT - 0.06))]
    verts = root + mid + end + ridge + back
    # Front faces (toward the camera, -Y) and back faces, strip by strip.
    faces = []
    for k in range(2):
        l0, r0, l1, r1 = 2 * k, 2 * k + 1, 2 * k + 2, 2 * k + 3
        f0, f1 = 6 + k, 6 + k + 1
        b0, b1 = 9 + k, 9 + k + 1
        faces += [(l0, f0, f1, l1), (f0, r0, r1, f1), (l0, l1, b1, b0), (b0, b1, r1, r0)]
    center = (c * 0.3, 0.0, s * 0.3)
    return face_out(verts, faces, center), (c * TIP_AT, -THICK * 0.2, s * TIP_AT), (c * ROOT, 0.0, s * ROOT)


def tip(at):
    """A small glowing bead at the end of an arm."""
    x, y, z = at
    r = 0.06
    verts = [(x + r, y, z), (x - r, y, z), (x, y, z + r), (x, y, z - r), (x, y - r, z), (x, y + r * 0.6, z)]
    faces = [(0, 2, 4), (2, 1, 4), (1, 3, 4), (3, 0, 4), (2, 0, 5), (1, 2, 5), (3, 1, 5), (0, 3, 5)]
    return face_out(verts, faces, at)


def build():
    model = Model("starfish")
    # Body: a low pentagonal dome, front toward the camera.
    rim = [(0.2 * math.cos(math.pi / 2 + 2 * math.pi * k / ARMS), 0.0, 0.2 * math.sin(math.pi / 2 + 2 * math.pi * k / ARMS)) for k in range(ARMS)]
    front, back = (0.0, -THICK * 1.25, 0.0), (0.0, THICK * 0.6, 0.0)
    verts = rim + [front, back]
    faces = [(k, (k + 1) % ARMS, ARMS) for k in range(ARMS)] + [(k, (k + 1) % ARMS, ARMS + 1) for k in range(ARMS)]
    model.add(*face_out(verts, faces, (0.0, 0.0, 0.0)), STAR, part="body")
    for side in (-1, 1):
        add_eye(model, (side * 0.06, -THICK * 1.05, 0.04), (0.0, -1.0, 0.0), side, 0.045, EYE, PUPIL, SHINE, pupil_size=0.6, part="body")
    add_smile(model, -THICK * 1.08, -0.05, 0.045, MOUTH, thickness=0.018, part="body")
    model.pivot("body", (0.0, 0.0, 0.0))

    for k in range(ARMS):
        a = math.pi / 2 + 2 * math.pi * k / ARMS
        (arm_v, arm_f), tip_at, root = arm(a)
        name = f"arm-{k}"
        model.add(arm_v, arm_f, STAR, part=name)
        model.add(*tip(tip_at), TIP, glow=True, part=name)
        model.pivot(name, root)
    return model


if __name__ == "__main__":
    star = build()
    star.check()
    write_glb(star, glow_color=TIP[2])
    write_preview(star, scale=150)
