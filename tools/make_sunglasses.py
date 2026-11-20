"""Silly sunglasses the squid wears in the bright Sunlit reef.

    python3 tools/make_sunglasses.py

Writes models/sunglasses.glb and artwork/sunglasses-model-preview.svg.

Built in the squid model's own units (tools/make_squid.py), with the origin
at the squid's head node: the game adds it as a child of that node, so the
round lenses sit just in front of the eyes and the arms reach back over the
ears. Chunky pink frames, dark lenses with a shine.
"""

import math

from lowpoly import Model, add, face_out, flat, lathe, ridge, unit, write_glb, write_preview

FRAME = ("#FF8FC8", "#F06AAE", "#C94C8C")
LENS = ("#3B2D5C", "#2C2148", "#1F1735")
SHINE = flat("#FFFFFF")

SPREAD = math.radians(24)
EYE_Z = 0.88
LENS_R = 0.4
SIDES = 10


def lens_centre(side):
    """In front of each eye (the eyes sit 0.9 out from the head's axis)."""
    return (side * math.sin(SPREAD) * 1.02, -math.cos(SPREAD) * 1.02 - 0.08, EYE_Z)


def build():
    model = Model("sunglasses")
    for side in (-1, 1):
        c = lens_centre(side)
        look = unit((side * math.sin(SPREAD) * 0.6, -1.0, 0.0))
        right = unit((-look[1], look[0], 0.0))
        up = (0.0, 0.0, 1.0)

        def on_lens(r, a, depth=0.0):
            return add(c, add(add(tuple(right[i] * r * math.cos(a) for i in range(3)),
                                  tuple(up[i] * r * math.sin(a) for i in range(3))),
                              tuple(look[i] * depth for i in range(3))))

        # The lens: a flat disc, a little domed outward.
        rim = [on_lens(LENS_R, 2 * math.pi * j / SIDES) for j in range(SIDES)]
        centre = on_lens(0.0, 0.0, 0.05)
        verts = rim + [centre]
        faces = [(j, (j + 1) % SIDES, SIDES) for j in range(SIDES)]
        model.add(*face_out(verts, faces, add(c, tuple(-look[i] for i in range(3)))), LENS)

        # The frame: a thick ring around the lens.
        outer = [on_lens(LENS_R + 0.1, 2 * math.pi * j / SIDES, 0.02) for j in range(SIDES)]
        inner = [on_lens(LENS_R - 0.01, 2 * math.pi * j / SIDES, 0.04) for j in range(SIDES)]
        back = [on_lens(LENS_R + 0.06, 2 * math.pi * j / SIDES, -0.06) for j in range(SIDES)]
        verts, faces = lathe([inner, outer, back])
        model.add(verts, faces + [tuple(reversed(f)) for f in faces], FRAME)

        # A shine on the lens, top left.
        s0 = on_lens(LENS_R * 0.55, math.radians(125), 0.06)
        s1 = on_lens(LENS_R * 0.25, math.radians(150), 0.07)
        s2 = on_lens(LENS_R * 0.5, math.radians(165), 0.06)
        model.add([s0, s1, s2], [(0, 1, 2), (2, 1, 0)], SHINE)

        # The arm: from the outer edge of the frame back over the ear.
        start = on_lens(LENS_R + 0.08, 0.0 if side > 0 else math.pi)
        path = [start, (side * 0.95, -0.2, EYE_Z + 0.08), (side * 0.9, 0.35, EYE_Z + 0.05)]
        for v, f in ridge(path, (0.0, 0.0, 1.0), (0.05, 0.05, 0.04), tip_length=0.05)[0]:
            model.add(v, f, FRAME)

    # The bridge between the lenses, over the nose.
    a = lens_centre(-1)
    b = lens_centre(1)
    path = [(a[0] + LENS_R * 0.95, a[1], EYE_Z + 0.12), (0.0, a[1] - 0.06, EYE_Z + 0.2), (b[0] - LENS_R * 0.95, b[1], EYE_Z + 0.12)]
    for v, f in ridge(path, (0.0, -1.0, 0.0), (0.06, 0.06, 0.06), tip_length=0.01)[0]:
        model.add(v, f, FRAME)
    return model


if __name__ == "__main__":
    glasses = build()
    glasses.check()
    write_glb(glasses)
    write_preview(glasses, scale=90, lift=-0.4)
