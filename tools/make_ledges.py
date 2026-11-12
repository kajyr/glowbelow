"""Three rock ledges for Twilight's side walls.

    python3 tools/make_ledges.py

Writes models/ledge-1.glb … models/ledge-3.glb. Built in world units for the
left wall: the ledge's root sits in the wall at x = 0 and it sticks out to the
right (+x); the game mirrors it for the right wall. Each is a rough slab, wide
at the wall and narrowing toward its tip, about 3 to 5.5 units long. Their
colliders (a chain of circles along the middle) are in src/levels/pieces.ts.
"""

from lowpoly import Model, centroid, face_out, write_glb
from midnight import TWILIGHT_ROCK, TWILIGHT_ROCK_ALT, seeded

DEPTH = 1.3

# name: (seed, length, thickness at the wall, tip thickness, droop, palette)
VARIANTS = {
    "ledge-1": (3, 3.0, 1.3, 0.6, 0.2, TWILIGHT_ROCK),
    "ledge-2": (8, 4.2, 1.6, 0.7, 0.4, TWILIGHT_ROCK_ALT),
    "ledge-3": (15, 5.4, 1.2, 0.5, -0.2, TWILIGHT_ROCK),
}

STATIONS = 9


def build(name, seed, length, thick, tip, droop, palette):
    rng = seeded(seed)
    model = Model(name)
    sections = []
    for i in range(STATIONS + 1):
        t = i / STATIONS
        x = -0.6 + (length + 0.6) * t
        h = thick + (tip - thick) * t
        mid = -droop * t * t
        top = mid + h / 2 + rng.uniform(-0.2, 0.28)
        bottom = mid - h / 2 + rng.uniform(-0.3, 0.15)
        d = DEPTH * (1 - 0.35 * t) * (1 + rng.uniform(-0.2, 0.2))
        # Lumpy like the rocks: each corner pushed in or out a little.
        j = lambda: rng.uniform(-0.15, 0.15)
        # front-bottom, front-top, back-top, back-bottom
        sections.append([
            (x + j(), -d, bottom),
            (x + j(), -d * (0.75 + rng.uniform(0, 0.2)), top),
            (x + j(), d * (0.75 + rng.uniform(0, 0.2)), top + rng.uniform(-0.1, 0.1)),
            (x + j(), d, bottom),
        ])
    for k in range(STATIONS):
        a, b = sections[k], sections[k + 1]
        verts = a + b
        middle = centroid(verts)
        faces = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i) for i in range(4)]
        model.add(*face_out(verts, faces, middle), palette)
    # Blunt tip and the end inside the wall.
    for cap, inside in ((sections[-1], (length - 1.0, 0.0, 0.0)), (sections[0], (1.0, 0.0, 0.0))):
        model.add(*face_out(cap, [(0, 1, 2, 3)], inside), palette)
    return model


if __name__ == "__main__":
    for name, args in VARIANTS.items():
        ledge = build(name, *args)
        ledge.check()
        write_glb(ledge)
