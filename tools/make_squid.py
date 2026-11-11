"""Low-poly vampire squid (the "Caped" design).

    python3 tools/make_squid.py

Writes models/squid.glb and artwork/squid-model-preview.svg.
"""

import math

from lowpoly import (
    FRONT, Model, add_eye, add_smile, circle, flat, gem, lathe, lerp,
    pyramid, ridge, unit, write_glb, write_preview,
)

# (light, mid, dark) tones, picked per face from its angle to the light.
BODY = ("#E24B4A", "#C63B3B", "#A32D2D")
EAR = ("#F09595", "#E24B4A", "#C63B3B")
CAPE = ("#8A2424", "#751D1D", "#5C1616")
ARM = ("#C63B3B", "#A32D2D", "#791F1F")
LINING = ("#F5B49B", "#F0997B", "#E57A54")
COLLAR = ("#A32D2D", "#8A2424", "#6B1A1A")
EYE = ("#E6F1FB", "#B5D4F4", "#9CC4EE")
PUPIL = ("#0C447C", "#042C53", "#042C53")
SHINE = ("#FFFFFF", "#FFFFFF", "#E6F1FB")
MOUTH = flat("#501313")
GLOW = ("#9FE1CB", "#5DCAA5", "#5DCAA5")

ARMS = 8
CAPE_POINTS = ARMS * 2
CAPE_STEPS = (0.0, 0.3, 0.65, 1.0)


def cape_point(k, t):
    """Point on the cape for hem position k (even = arm, odd = web) at
    distance t from the neck (0) to the hem (1). The cape is short at the
    front so the lining of the back shows when the squid faces the camera."""
    angle = FRONT + 2 * math.pi * k / CAPE_POINTS
    is_arm = k % 2 == 0
    opening = max(0.0, math.cos(angle - FRONT)) ** 2

    reach = 1.85 if is_arm else 1.1
    drop = 2.45 if is_arm else 1.3
    r = 0.85 + reach * t ** 0.85
    z = -drop * t ** 1.7
    if not is_arm:
        # Pull the web in between the arms to make folds.
        r -= 0.12 * math.sin(math.pi * t)

    r = lerp(r, 0.85 + 0.3 * t, opening)
    z = lerp(z, -0.4 * t, opening)
    return (r * math.cos(angle), r * math.sin(angle), z)


def build():
    model = Model("squid")

    # Head: tall dome, one flat face pointing forward.
    head = [
        [(0.0, 0.0, 2.0)],
        circle(10, 0.5, 1.86),
        circle(10, 0.86, 1.5),
        circle(10, 1.0, 1.0),
        circle(10, 1.0, 0.5),
        circle(10, 0.85, -0.05),
    ]
    model.add(*lathe(head), BODY)

    # Cape: dark outside, coral lining inside.
    rings = [[cape_point(k, t) for k in range(CAPE_POINTS)] for t in CAPE_STEPS]
    verts, faces = lathe(rings)
    model.add(verts, faces, CAPE)
    inner = [(x * 0.975, y * 0.975, z - 0.03) for x, y, z in verts]
    model.add(inner, [tuple(reversed(f)) for f in faces], LINING)

    # Arms with glowing tips.
    for k in range(0, CAPE_POINTS, 2):
        angle = FRONT + 2 * math.pi * k / CAPE_POINTS
        side = (-math.sin(angle), math.cos(angle), 0.0)
        path = [cape_point(k, t) for t in CAPE_STEPS]
        parts, tip = ridge(path, side, (0.15, 0.13, 0.1, 0.06))
        for verts, faces in parts:
            model.add(verts, faces, ARM)
        model.add(*gem(tip, 0.13), GLOW, glow=True)

    for side in (-1, 1):
        # Small ear fins.
        ear_base = [
            (side * 0.35, -0.14, 1.85),
            (side * 0.75, -0.14, 1.45),
            (side * 0.75, 0.14, 1.45),
            (side * 0.35, 0.14, 1.85),
        ]
        model.add(*pyramid(ear_base, (side * 1.05, 0.0, 2.2)), EAR)

        # Cape collar points.
        collar_base = [
            (side * 0.8, -0.35, 0.0),
            (side * 0.8, 0.35, 0.0),
            (side * 0.95, 0.3, 0.4),
            (side * 0.95, -0.3, 0.4),
        ]
        model.add(*pyramid(collar_base, (side * 1.4, 0.0, 0.8)), COLLAR)

        spread = math.radians(24)
        look = unit((side * math.sin(spread), -math.cos(spread), 0.04))
        eye_at = (side * math.sin(spread) * 0.9, -math.cos(spread) * 0.9, 0.85)
        add_eye(model, eye_at, look, side, 0.33, EYE, PUPIL, SHINE)

    add_smile(model, y=-0.945, z=0.37, half_width=0.16, palette=MOUTH)
    return model


if __name__ == "__main__":
    squid = build()
    squid.check()
    write_glb(squid, glow_color=GLOW[1])
    write_preview(squid)
