"""Small rock cave for Midnight home, where dumbo hides.

    python3 tools/make_cave.py

Writes models/cave.glb. Seen from the front the cave is a thick rock dome
whose front is open, so the camera looks straight into its dark interior.
On the play plane the rock wall runs from the left foot over the roof and
stops on the right side, leaving an entrance from the floor up to about
2.5 units. The interior is about 6.8 units wide and 3 units tall. Its
collider (circles along the wall) is in src/levels/pieces.ts.
"""

import math

from lowpoly import Model, centroid, face_out, write_glb
from midnight import CAVE_BACK, CAVE_INSIDE, ROCK_ALT, seeded

INNER = (3.4, 3.0)
OUTER = (4.6, 4.3)
FRONT = -1.0
BACK = 2.6
BACK_WALL = 2.6
START = math.radians(50)   # the wall stops here on the right: the entrance
STATIONS = 10


def arc_point(radii, a, bulge=1.0):
    return (radii[0] * bulge * math.cos(a), radii[1] * bulge * math.sin(a))


def build():
    rng = seeded(3)
    model = Model("cave")
    sections = []
    for k in range(STATIONS + 1):
        a = START + (math.pi - START) * k / STATIONS
        bulge = 1.0 + rng.uniform(-0.05, 0.1)
        ix, iz = arc_point(INNER, a)
        ox, oz = arc_point(OUTER, a, bulge)
        if k == STATIONS:
            iz = oz = -0.3
        sections.append([
            (ix, FRONT, iz),
            (ox, FRONT * 1.15, oz),
            (ox * 1.02, BACK_WALL + 0.4, oz),
            (ix, BACK, iz),
        ])

    for k in range(STATIONS):
        a, b = sections[k], sections[k + 1]
        verts = a + b
        middle = centroid(verts)
        for i in range(4):
            face = [(i, (i + 1) % 4, 4 + (i + 1) % 4, 4 + i)]
            palette = CAVE_INSIDE if i == 3 else ROCK_ALT
            model.add(*face_out(verts, face, middle), palette)

    # Rounded end on the entrance side and a cap under the left foot.
    model.add(*face_out(sections[0], [(0, 1, 2, 3)], (-1.0, 0.0, 1.0)), ROCK_ALT)
    model.add(*face_out(sections[-1], [(0, 1, 2, 3)], (0.0, 0.0, 1.0)), ROCK_ALT)

    # Dark back wall: a half-disc behind the interior, plus the recess
    # between the wall's back edge and it.
    n = 14
    rim = [(INNER[0] * math.cos(math.pi * j / n), BACK_WALL, INNER[1] * math.sin(math.pi * j / n))
           for j in range(n + 1)]
    verts = rim + [(0.0, BACK_WALL, -0.2)]
    faces = [(j, j + 1, n + 1) for j in range(n)]
    model.add(*face_out(verts, faces, (0.0, BACK_WALL + 1.0, 1.0)), CAVE_BACK)

    # Dark floor inside, just above the seabed.
    floor = [(-INNER[0], FRONT, 0.03), (INNER[0], FRONT, 0.03),
             (INNER[0], BACK_WALL, 0.03), (-INNER[0], BACK_WALL, 0.03)]
    model.add(*face_out(floor, [(0, 1, 2, 3)], (0.0, 0.0, -1.0)), CAVE_INSIDE)
    return model


if __name__ == "__main__":
    cave = build()
    cave.check()
    write_glb(cave)
