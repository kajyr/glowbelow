"""Whale skeleton for Whale fall: the zone's big, friendly landmark.

    python3 tools/make_whale_skeleton.py

Writes models/whale-skeleton.glb. In world units, seabed at z = 0, the head
toward +X, seen from the front (camera on -Y). The whale lies belly down:
the spine runs high along the top, seven ribs hang from it (room to swim
under their tips, between them and over the spine), the rounded skull rests
on the seabed at the head end and the tail slopes down behind the play plane
to a flat fluke.

Parts: `bones` (skull, spine, tail) and `rib-0` ... `rib-6`, tail to head,
each pivoted where it meets the spine, so the game can light each rib on its
own and use it as a note. The numbers match src/levels/skeleton.ts, which
holds the colliders; change both together.
"""

import math

from lowpoly import Model, circle, face_out, lathe, pyramid, ridge, write_glb

# Bone white with a soft blue shade, so it reads as gentle in the blue water.
BONE = ("#EEF0EA", "#CDD5DA", "#9FAEC0")
BONE_SOFT = ("#E2E6E4", "#BCC6D0", "#8E9DB2")
SOCKET = ("#5D6E92", "#4A5A80", "#3A4868")

RIB_COUNT = 7
RIB_X0 = -13.5
RIB_SPACING = 4.5
SPINE_Y = 8.4
RIB_TIP_Y = 5.2
RIB_LEAN = 0.4
RIB_BOW = 0.3


def rib_point(i, t, depth=0.0):
    x = RIB_X0 + i * RIB_SPACING
    return (x - RIB_BOW * math.sin(math.pi * t) + RIB_LEAN * t, depth, SPINE_Y - (SPINE_Y - RIB_TIP_Y) * t)


def vertebra(model, at, size, part="bones", palette=BONE):
    """A chunky, rounded bead with a small blunt bump on top (nothing pointy)."""
    x, y, z = at
    rings = [
        [(0.0, 0.0, size * 0.75)],
        circle(6, size * 0.7, size * 0.35, math.pi / 6),
        circle(6, size * 0.8, -size * 0.25, math.pi / 6),
        [(0.0, 0.0, -size * 0.7)],
    ]
    verts, faces = lathe(rings)
    model.add([(x + vx, y + vy * 0.8, z + vz) for vx, vy, vz in verts], faces, palette, part=part)
    base = [(x - size * 0.35, y - size * 0.3, z + size * 0.5), (x + size * 0.35, y - size * 0.3, z + size * 0.5),
            (x + size * 0.35, y + size * 0.3, z + size * 0.5), (x - size * 0.35, y + size * 0.3, z + size * 0.5)]
    model.add(*pyramid(base, (x - size * 0.15, y, z + size * 1.15)), palette, part=part)


def skull(model):
    """A long rounded dome on the seabed, with a lower jaw and a soft dark socket."""
    stations = [(18.4, 1.2), (19.4, 2.6), (21.0, 3.1), (23.0, 2.7), (25.0, 2.1), (26.7, 1.4), (27.8, 0.5)]
    sides = 7
    rings = []
    for x, h in stations:
        ring = []
        for j in range(sides):
            a = 2 * math.pi * j / sides - math.pi / 2
            depth = h * 0.75 * math.cos(a)
            z = h * 0.9 + h * math.sin(a)
            ring.append((x, depth, max(-0.15, z)))
        rings.append(ring)
    verts, faces = lathe([[(18.1, 0.0, 1.2)]] + rings + [[(28.2, 0.0, 0.3)]])
    model.add(*face_out(verts, faces, (23.0, 0.0, 2.0)), BONE, part="bones")
    # Lower jaw along the seabed.
    parts, _tip = ridge([(19.2, -0.4, 0.4), (23.0, -0.6, 0.35), (27.0, -0.5, 0.3)], (0.0, 0.0, 1.0), (0.4, 0.35, 0.25), tip_length=0.9)
    for v, f in parts:
        model.add(v, f, BONE_SOFT, part="bones")
    # A soft round socket on the camera side: friendly, not spooky.
    cx, cz, r = 22.0, 3.3, 0.7
    y = -2.2
    ring = [(cx + r * math.cos(a), y, cz + r * 0.8 * math.sin(a)) for a in (2 * math.pi * k / 6 for k in range(6))]
    model.add(*face_out(ring + [(cx, y + 0.1, cz)], [(k, (k + 1) % 6, 6) for k in range(6)], (cx, 0.0, cz)), SOCKET, part="bones")


def build():
    model = Model("whale-skeleton")

    # Spine: vertebrae along the top, dipping into the back of the skull.
    x = -15.0
    while x <= 15.0:
        vertebra(model, (x, 0.0, SPINE_Y), 0.55)
        x += 1.5
    for k in range(1, 6):
        vertebra(model, (15 + 0.92 * k, 0.0, SPINE_Y - 0.44 * k), 0.5)
    # A big vertebra where the dip starts (it fills a corner, see skeleton.ts).
    vertebra(model, (14.9, 0.0, SPINE_Y - 0.8), 0.8)

    # Tail: smaller and smaller vertebrae sloping down behind the play plane, then a flat fluke.
    for k in range(1, 9):
        t = k / 8
        vertebra(model, (-15 - 9 * t, 0.4 + 0.5 * t, SPINE_Y - (SPINE_Y - 1.0) * t), 0.5 - 0.25 * t, palette=BONE_SOFT)
    fluke = [(-24.0, 0.2, 0.6), (-27.5, -1.2, 0.35), (-26.4, 0.9, 0.5), (-27.5, 2.4, 0.35)]
    model.add(*face_out(fluke + [(-25.6, 0.9, 0.95)], [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4), (0, 3, 2, 1)], (-25.8, 0.9, 0.6)), BONE_SOFT, part="bones")

    skull(model)

    # Ribs: each a tapered bone hanging from the spine, its own part.
    for i in range(RIB_COUNT):
        name = f"rib-{i}"
        path = [rib_point(i, t, depth=-0.1) for t in (0.0, 0.25, 0.5, 0.75, 1.0)]
        parts, _tip = ridge(path, (0.0, 1.0, 0.0), (0.36, 0.35, 0.33, 0.3, 0.26), tip_length=0.25)
        for v, f in parts:
            model.add(v, f, BONE, part=name)
        model.pivot(name, rib_point(i, 0.0))

    return model


if __name__ == "__main__":
    skeleton = build()
    skeleton.check()
    write_glb(skeleton)
