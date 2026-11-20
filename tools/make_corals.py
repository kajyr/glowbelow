"""Corals for the Sunlit reef: five shapes, each in a small and a large size.

    python3 tools/make_corals.py

Writes models/coral-<shape>-1.glb (small) and models/coral-<shape>-2.glb
(large) for branch, fan, brain, tube and mushroom, plus
artwork/coral-<shape>-2-model-preview.svg.

Every coral is built in a pale neutral colour (light, mid and dark tones of
near-white). The game multiplies it by a per-coral colour, so one model shows
any colour of the reef's cycle. Corals stand on z = 0 (sunk a little below
it), in world units: small ones about 1 unit tall, large ones about 1.8.
Their colliders are in src/levels/pieces.ts.
"""

import math

from lowpoly import Model, add, circle, face_out, gem, lathe, ridge, unit, write_glb, write_preview
from midnight import lumpy_ring, seeded

# Pale and neutral: the game's tint gives the colour, these give the shading.
BASE = ("#FFFFFF", "#E2E0EA", "#B9B6C8")
# Tips and rims a touch lighter still, so they catch the sun.
TIP = ("#FFFFFF", "#F2F1F7", "#D3D1E0")


def branch(model, rng, size):
    """A little tree: a trunk splitting into upward-curving branches with knobby tips."""
    h = 1.0 * size
    trunk = [(0.0, 0.0, -0.15), (0.02, 0.0, 0.25 * h), (0.0, 0.0, 0.42 * h)]
    for v, f in ridge(trunk, (1.0, 0.0, 0.0), (0.16 * size, 0.14 * size, 0.12 * size), tip_length=0.02)[0]:
        model.add(v, f, BASE)
    count = 3 if size < 1.5 else 5
    for k in range(count):
        a = math.pi * (0.15 + 0.7 * (k + rng.uniform(0.2, 0.8)) / count)
        out = (math.cos(a), rng.uniform(-0.25, 0.25), 0.0)
        reach = rng.uniform(0.32, 0.5) * size
        top = rng.uniform(0.8, 1.0) * h
        p0 = (out[0] * 0.05, 0.0, 0.4 * h)
        p1 = (out[0] * reach * 0.6, out[1] * reach * 0.6, 0.62 * top)
        p2 = (out[0] * reach, out[1] * reach, top)
        side = unit((-math.sin(a), 0.0, math.cos(a)))
        parts, tip = ridge([p0, p1, p2], side, (0.1 * size, 0.08 * size, 0.06 * size), tip_length=0.05 * size)
        for v, f in parts:
            model.add(v, f, BASE)
        model.add(*gem(tip, 0.07 * size), TIP)


def fan(model, rng, size):
    """A sea fan: a flat, wavy half-disc facing the camera on a short stalk."""
    r = 0.75 * size
    stalk = [(0.0, 0.0, -0.15), (0.0, 0.0, 0.18 * size)]
    for v, f in ridge(stalk, (1.0, 0.0, 0.0), (0.09 * size, 0.07 * size), tip_length=0.02)[0]:
        model.add(v, f, BASE)
    centre = (0.0, 0.0, 0.18 * size)
    spokes = 7 if size < 1.5 else 9
    rings = (0.45, 1.0)
    pts = [[centre]]
    for k in rings:
        ring = []
        for j in range(spokes + 1):
            a = math.pi * (0.08 + 0.84 * j / spokes)
            wave = rng.uniform(-0.08, 0.08) * size
            rr = r * k * rng.uniform(0.9, 1.05)
            ring.append((rr * math.cos(a), wave, 0.18 * size + rr * math.sin(a)))
        pts.append(ring)
    verts = [centre] + pts[1] + pts[2]
    n = spokes + 1
    faces = []
    for j in range(spokes):
        faces.append((0, 1 + j, 2 + j))
        faces.append((1 + j, 1 + n + j, 2 + n + j, 2 + j))
    # Both sides show: the fan is thin.
    model.add(verts, faces, BASE)
    model.add(verts, [tuple(reversed(f)) for f in faces], BASE)
    for p in pts[2][1:-1:2]:
        model.add(*gem(p, 0.06 * size), TIP)


def brain(model, rng, size):
    """A brain coral: a lumpy, squashed dome."""
    rx = 0.55 * size
    h = 0.55 * size
    segments = 9 if size < 1.5 else 11
    rings = [[(0.0, 0.0, h)]]
    for frac, zfrac in ((0.45, 0.92), (0.8, 0.68), (1.0, 0.32), (0.95, -0.05), (0.8, -0.2)):
        rings.append(lumpy_ring(rng, segments, rx * frac, rx * frac * 0.85, zfrac * h, 0.1, offset=rng.uniform(0, 1)))
    verts, faces = lathe(rings)
    model.add(verts, faces, BASE)
    # Ridges: little bumps scattered over the top.
    for _ in range(4 if size < 1.5 else 7):
        a = rng.uniform(0, 2 * math.pi)
        d = rng.uniform(0.2, 0.7) * rx
        z = h * math.sqrt(max(0.0, 1 - (d / rx) ** 2)) * 0.92
        model.add(*gem((d * math.cos(a), d * math.sin(a) * 0.85, z), 0.08 * size), TIP)


def tube(model, rng, size):
    """A cluster of open tubes of different heights, each with a pale rim."""
    count = 3 if size < 1.5 else 5
    for k in range(count):
        x = (k - (count - 1) / 2) * 0.27 * size + rng.uniform(-0.04, 0.04)
        y = rng.uniform(-0.12, 0.12) * size
        h = rng.uniform(0.55, 1.0) * size
        r = rng.uniform(0.11, 0.15) * size
        lean = (k - (count - 1) / 2) * 0.08 * size + rng.uniform(-0.05, 0.05) * size
        top = (x + lean, y, h)
        sides = 6
        rings = [
            [(top[0] + c[0], top[1] + c[1], h) for c in circle(sides, r * 1.25, 0.0)],
            [(x + lean * 0.5 + c[0], y + c[1], h * 0.55) for c in circle(sides, r, 0.0)],
            [(x + c[0], y + c[1], -0.15) for c in circle(sides, r * 1.1, 0.0)],
        ]
        verts, faces = lathe(rings)
        model.add(*face_out(verts, faces, (x + lean * 0.5, y, h * 0.5)), BASE)
        # The open mouth: a dark disc just inside the rim.
        mouth = [(top[0] + c[0], top[1] + c[1], h - 0.04) for c in circle(sides, r * 1.05, 0.0)]
        hole = (top[0], top[1], h - 0.06)
        model.add(mouth + [hole], [(j, (j + 1) % sides, sides) for j in range(sides)], ("#9C98B0", "#9C98B0", "#9C98B0"))


def mushroom(model, rng, size):
    """A mushroom coral: a short stalk under a wide, wavy, tilted cap."""
    h = 0.38 * size
    r = 0.6 * size
    stalk = [(0.0, 0.0, -0.15), (0.03, 0.0, h * 0.5), (0.0, 0.0, h)]
    for v, f in ridge(stalk, (1.0, 0.0, 0.0), (0.12 * size, 0.1 * size, 0.1 * size), tip_length=0.02)[0]:
        model.add(v, f, BASE)
    segments = 9 if size < 1.5 else 12
    tilt = rng.uniform(-0.12, 0.12)
    rim = []
    for j in range(segments):
        a = 2 * math.pi * j / segments
        wave = (0.07 if j % 2 == 0 else -0.05) * size
        rim.append((r * math.cos(a), r * math.sin(a) * 0.8, h + wave + tilt * r * math.cos(a)))
    top = (0.0, 0.0, h + 0.12 * size)
    under = (0.0, 0.0, h - 0.04 * size)
    verts, faces = lathe([[top], rim, [under]])
    model.add(*face_out(verts, faces, (0.0, 0.0, h)), BASE)
    model.add(*gem(add(top, (0.0, 0.0, 0.02)), 0.07 * size), TIP)


SHAPES = {"branch": branch, "fan": fan, "brain": brain, "tube": tube, "mushroom": mushroom}
SIZES = {1: 1.0, 2: 1.8}


def build(shape, n):
    model = Model(f"coral-{shape}-{n}")
    SHAPES[shape](model, seeded(sum(map(ord, shape)) * 7 + n), SIZES[n])
    return model


if __name__ == "__main__":
    for shape in SHAPES:
        for n in SIZES:
            coral = build(shape, n)
            coral.check()
            write_glb(coral)
            if n == 2:
                write_preview(coral, scale=70, lift=0.5)
