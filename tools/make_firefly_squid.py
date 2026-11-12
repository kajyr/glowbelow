"""Low-poly firefly squid. One small model, repeated many times as a swarm.

    python3 tools/make_firefly_squid.py

Writes models/firefly-squid.glb and artwork/firefly-squid-model-preview.svg.
Built at full size for easy viewing; the game scales it down to about a
quarter of the vampire squid.

Parts (one node each, for animation in the game): body (mantle, glow spots
and eyes), fins, arms (with their glowing tips).
"""

import math

from lowpoly import (
    FRONT, Model, add_eye, circle, dome, flat, gem, lathe, placed, pyramid,
    ridge, unit, write_glb, write_preview,
)

MANTLE = ("#85B7EB", "#4F9BE3", "#2F7FD0")
FIN = ("#B5D4F4", "#85B7EB", "#4F9BE3")
ARM = ("#4F9BE3", "#2F7FD0", "#185FA5")
EYE = ("#FFFFFF", "#E6F1FB", "#CFE3F8")
PUPIL = ("#0C447C", "#042C53", "#042C53")
SHINE = flat("#FFFFFF")
GLOW = ("#C9F5E6", "#9FE1CB", "#5DCAA5")

SIDES = 6
ARMS = 8


def build():
    model = Model("firefly-squid")

    # Torpedo mantle with the head below it; one flat face points forward.
    body = [
        [(0.0, 0.0, 1.5)],
        circle(SIDES, 0.28, 1.25),
        circle(SIDES, 0.52, 0.8),
        circle(SIDES, 0.56, 0.32),
        circle(SIDES, 0.44, 0.0),
        circle(SIDES, 0.52, -0.25),
        circle(SIDES, 0.34, -0.52),
        [(0.0, 0.0, -0.58)],
    ]
    model.add(*lathe(body), MANTLE, part="body")

    # Two thin triangular fins near the tip of the mantle.
    for side in (-1, 1):
        fin_base = [
            (side * 0.25, -0.05, 1.35),
            (side * 0.5, -0.05, 0.85),
            (side * 0.5, 0.05, 0.85),
            (side * 0.25, 0.05, 1.35),
        ]
        model.add(*pyramid(fin_base, (side * 1.0, 0.0, 1.0)), FIN, part="fins")
    model.pivot("fins", (0.0, 0.0, 1.1))

    # Eight short arms; the two side ones are longer tentacles.
    for k in range(ARMS):
        angle = FRONT + 2 * math.pi * (k + 0.5) / ARMS
        c, s = math.cos(angle), math.sin(angle)
        across = (-s, c, 0.0)
        long_arm = abs(c) > 0.9
        length = 1.15 if long_arm else 0.7
        path = [
            (0.24 * c, 0.24 * s, -0.5),
            (0.44 * c, 0.44 * s, -0.5 - length * 0.55),
            (0.42 * c, 0.42 * s, -0.5 - length),
        ]
        parts, tip = ridge(path, across, (0.075, 0.06, 0.04), tip_length=0.08)
        for verts, faces in parts:
            model.add(verts, faces, ARM, part="arms")
        model.add(*gem(tip, 0.1 if long_arm else 0.08), GLOW, glow=True, part="arms")
    model.pivot("arms", (0.0, 0.0, -0.5))

    # Glowing spots down the front of the mantle.
    for z, radius in ((1.0, 0.37), (0.6, 0.475), (0.25, 0.47)):
        spot_v, spot_f = dome(0.09, 0.04, segments=4)
        model.add(placed(spot_v, (0.0, -radius, z), (0.0, -1.0, 0.0)), spot_f, GLOW, glow=True, part="body")

    # Big eyes on the head.
    for side in (-1, 1):
        spread = math.radians(42)
        out = (side * math.sin(spread), -math.cos(spread))
        look = unit((out[0], out[1], 0.0))
        add_eye(model, (out[0] * 0.42, out[1] * 0.42, -0.2), look, side,
                0.24, EYE, PUPIL, SHINE, pupil_size=0.6, part="body")

    return model


if __name__ == "__main__":
    firefly = build()
    firefly.check()
    write_glb(firefly, glow_color=GLOW[2])
    write_preview(firefly, scale=70, lift=0.2)
