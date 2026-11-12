"""Midnight home palette and small helpers shared by the environment scripts.

Environment pieces are modelled in world units (the squid is about 1.3 units
tall in the game), with the same axes as the creatures: +Z up, the camera on
-Y, and the play plane at y = 0.
"""

import math
import random

# (light, mid, dark) tones: navy and violet, dark enough that the zone reads
# as night, light enough that outlines stay visible.
ROCK = ("#4F4A8E", "#3A3874", "#272756")
ROCK_ALT = ("#5A4A8C", "#433872", "#2E2754")
SEABED = ("#3E4A86", "#2E386C", "#20284F")
SEABED_EDGE = ("#2A3266", "#1F2650", "#161B3B")
CAVE_INSIDE = ("#16163A", "#10102C", "#0A0A1F")
CAVE_BACK = ("#0C0C22", "#0A0A1C", "#080816")
STEM = ("#3E7C8C", "#2F6271", "#224955")
BUD = ("#6E5AA8", "#58468E", "#433574")
PETAL = ("#9C84E0", "#7E66C6", "#634EA6")
PETAL_GLOW = ("#B8F4FF", "#8EE6F8", "#8EE6F8")
SPARKLE = ("#FFF6C9", "#FFE89A", "#FFE89A")


def lumpy_ring(rng, n, rx, ry, z, jitter, offset=0.0):
    """A ring of n points on an ellipse, each pushed in or out a little."""
    points = []
    for j in range(n):
        a = offset + 2 * math.pi * j / n
        k = 1.0 + rng.uniform(-jitter, jitter)
        points.append((rx * k * math.cos(a), ry * k * math.sin(a), z))
    return points


def seeded(seed):
    return random.Random(seed)

# Twilight: blue-grey rock that reads against blue-to-lavender water.
TWILIGHT_ROCK = ("#6F80BC", "#56679E", "#3E4C7C")
TWILIGHT_ROCK_ALT = ("#7C7FC0", "#6265A2", "#474A80")
