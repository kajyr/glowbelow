"""Low-poly dumbo octopus, the squid's best friend.

    python3 tools/make_dumbo_octopus.py

Writes models/dumbo-octopus.glb and artwork/dumbo-octopus-model-preview.svg.
Built at about two thirds of the squid's size.
Parts (one node each, for animation in the game): body, skirt, arms,
ear-l, ear-r, eye-l, eye-r. Skirt and arms pivot at the neck.
"""

import math

from lowpoly import (
    FRONT, Model, add_eye, add_smile, circle, dome, flat, lathe, placed,
    ridge, unit, write_glb, write_preview,
)

BODY = ("#F5B13D", "#EF9F27", "#D98A1C")
EAR = ("#FAC775", "#F5B13D", "#EF9F27")
SKIRT = ("#D98A1C", "#BF7716", "#9E600F")
ARM = ("#EF9F27", "#D98A1C", "#BF7716")
LINING = ("#FBEBD0", "#F7DDB0", "#F2C98A")
EYE = ("#FFFFFF", "#FAEEDA", "#F2E2C4")
PUPIL = ("#633806", "#412402", "#412402")
SHINE = flat("#FFFFFF")
MOUTH = flat("#854F0B")
BLUSH = flat("#F4A9A0")

ARMS = 8
SKIRT_POINTS = ARMS * 2
SKIRT_STEPS = (0.0, 0.5, 1.0)


def skirt_point(k, t):
    """Short umbrella: even k is an arm, odd k is the web between two arms."""
    angle = FRONT + 2 * math.pi * (k + 1) / SKIRT_POINTS
    is_arm = k % 2 == 0
    reach = 0.85 if is_arm else 0.68
    drop = 1.0 if is_arm else 0.78
    r = 0.9 + reach * t ** 0.9
    z = -drop * t ** 1.5
    return (r * math.cos(angle), r * math.sin(angle), z)


def build():
    model = Model("dumbo-octopus")

    # Body: squat round dome.
    body = [
        [(0.0, 0.0, 1.5)],
        circle(10, 0.55, 1.38),
        circle(10, 0.95, 1.05),
        circle(10, 1.1, 0.6),
        circle(10, 1.05, 0.2),
        circle(10, 0.9, -0.05),
    ]
    model.add(*lathe(body), BODY, part="body")

    # Skirt with a pale lining.
    rings = [[skirt_point(k, t) for k in range(SKIRT_POINTS)] for t in SKIRT_STEPS]
    verts, faces = lathe(rings)
    model.add(verts, faces, SKIRT, part="skirt")
    inner = [(x * 0.97, y * 0.97, z - 0.03) for x, y, z in verts]
    model.add(inner, [tuple(reversed(f)) for f in faces], LINING, part="skirt")

    # Stubby arms along the skirt.
    for k in range(0, SKIRT_POINTS, 2):
        angle = FRONT + 2 * math.pi * (k + 1) / SKIRT_POINTS
        side = (-math.sin(angle), math.cos(angle), 0.0)
        path = [skirt_point(k, t) for t in SKIRT_STEPS]
        parts, _tip = ridge(path, side, (0.16, 0.13, 0.09), tip_length=0.14)
        for verts, faces in parts:
            model.add(verts, faces, ARM, part="arms")

    for side in (-1, 1):
        # Big paddle ears: a dome squashed flat, pointing out and up.
        ear_v, ear_f = dome(0.52, 0.43, segments=6)
        ear_at = (side * 0.9, 0.0, 0.85)
        ear = placed(ear_v, ear_at, (side * 0.95, 0.0, 0.3))
        ear = [(x, y * 0.3, z) for x, y, z in ear]
        name = "ear-l" if side < 0 else "ear-r"
        model.add(ear, ear_f, EAR, part=name)
        model.pivot(name, ear_at)

        spread = math.radians(30)
        out = (side * math.sin(spread), -math.cos(spread))
        look = unit((out[0], out[1], 0.03))
        add_eye(model, (out[0] * 1.0, out[1] * 1.0, 0.68), look, side,
                0.24, EYE, PUPIL, SHINE, pupil_size=0.62,
                part="eye-l" if side < 0 else "eye-r")

        # Rosy cheeks.
        cheek = math.radians(44)
        cheek_out = (side * math.sin(cheek), -math.cos(cheek))
        blush_v, blush_f = dome(0.13, 0.03, segments=6)
        blush_at = (cheek_out[0] * 1.04, cheek_out[1] * 1.04, 0.36)
        model.add(placed(blush_v, blush_at, (cheek_out[0], cheek_out[1], 0.0)), blush_f, BLUSH,
                  part="body")

    add_smile(model, y=-1.035, z=0.34, half_width=0.13, palette=MOUTH, thickness=0.04,
              part="body")
    return model


if __name__ == "__main__":
    dumbo = build()
    dumbo.check()
    write_glb(dumbo)
    write_preview(dumbo, scale=70, lift=0.3)
