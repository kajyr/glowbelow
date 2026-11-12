"""Giant phantom jelly (Stygiomedusa gigantea) for Midnight home.

    python3 tools/make_phantom_jelly.py

Writes models/phantom-jelly.glb. Built at twice its game size (the game
scales it by 0.5): a wide, low, pink bell about 3.2 units across with a softly glowing rim, and four
long, flat, wavy ribbon arms (about 5.5 units) hanging from under it.

Parts (one node each, for animation in the game):
- bell: pivot at the centre of the bell's opening, so it can pulse
- arm-1 … arm-4: pivot where each arm joins the bell, so they can sway
"""

import math

from lowpoly import Model, circle, face_out, lathe, write_glb

BELL = ("#E07A9C", "#C45A80", "#9A4064")
BELL_INSIDE = ("#7A2E4A", "#62233C", "#4A1A2E")
RIM = ("#FFB0CC", "#FF8FB8", "#FF8FB8")
ARM = ("#D06A90", "#B05078", "#8A3A5E")

SEGMENTS = 12
ARM_LENGTH = 5.5
ARM_STEPS = 9


def build():
    model = Model("phantom-jelly")

    # Bell: low dome, open underneath, top to bottom.
    outer = [
        [(0.0, 0.0, 1.2)],
        circle(SEGMENTS, 0.75, 1.1),
        circle(SEGMENTS, 1.25, 0.8),
        circle(SEGMENTS, 1.55, 0.35),
        circle(SEGMENTS, 1.6, 0.0),
    ]
    verts, faces = lathe(outer)
    model.add(*face_out(verts, faces, (0.0, 0.0, 0.3)), BELL, part="bell")

    # Inside of the bell: a dark hollow you see when it pulses.
    inner = [
        [(0.0, 0.0, 0.85)],
        circle(SEGMENTS, 0.9, 0.7),
        circle(SEGMENTS, 1.45, 0.05),
    ]
    verts, faces = lathe(inner)
    model.add(*face_out(verts, faces, (0.0, 0.0, -1.0)), BELL_INSIDE, part="bell")

    # Softly glowing rim: a thin band around the opening.
    top = circle(SEGMENTS, 1.62, 0.05)
    bottom = circle(SEGMENTS, 1.5, -0.12)
    rim = top + bottom
    rim_faces = [(j, (j + 1) % SEGMENTS, SEGMENTS + (j + 1) % SEGMENTS, SEGMENTS + j) for j in range(SEGMENTS)]
    model.add(*face_out(rim, rim_faces, (0.0, 0.0, 0.6)), RIM, glow=True, part="bell")
    model.pivot("bell", (0.0, 0.0, 0.0))

    # Four ribbon arms: flat wavy strips, spread across the front so they
    # read from the side-on camera, a little in front of and behind the bell.
    for k, (ax, ay, phase) in enumerate(((-0.9, -0.25, 0.0), (-0.3, 0.3, 1.6), (0.35, -0.3, 3.1), (0.95, 0.25, 4.4))):
        name = f"arm-{k + 1}"
        top_at = (ax, ay, -0.1)
        left, right = [], []
        for i in range(ARM_STEPS + 1):
            t = i / ARM_STEPS
            z = top_at[2] - ARM_LENGTH * t
            sway = 0.55 * math.sin(phase + t * 4.0) * t
            x = ax * (1 + 0.4 * t) + sway
            width = 0.42 * (1 - 0.35 * t) + 0.06
            left.append((x - width, ay, z))
            right.append((x + width, ay, z))
        verts = left + right
        n = ARM_STEPS + 1
        front = [(i, i + 1, n + i + 1, n + i) for i in range(ARM_STEPS)]
        back = [tuple(reversed(f)) for f in front]
        model.add(verts, front + back, ARM, part=name)
        model.pivot(name, top_at)
    return model


if __name__ == "__main__":
    jelly = build()
    jelly.check()
    write_glb(jelly, glow_color=RIM[1])
