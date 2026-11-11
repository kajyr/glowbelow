"""Shared helpers for the low-poly creature scripts in this folder.

Modelling axes: +Z is up, creatures face -Y, origin at the neck.
Exported .glb files use glTF axes: +Y up, facing +Z.
"""

import json
import math
import os
import struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FRONT = -math.pi / 2  # angle of -Y


def add(a, b):
    return (a[0] + b[0], a[1] + b[1], a[2] + b[2])


def sub(a, b):
    return (a[0] - b[0], a[1] - b[1], a[2] - b[2])


def mul(a, k):
    return (a[0] * k, a[1] * k, a[2] * k)


def dot(a, b):
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]


def cross(a, b):
    return (
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0],
    )


def unit(v):
    length = math.sqrt(dot(v, v)) or 1.0
    return (v[0] / length, v[1] / length, v[2] / length)


def lerp(a, b, t):
    return a + (b - a) * t


def centroid(points):
    n = len(points)
    return (
        sum(p[0] for p in points) / n,
        sum(p[1] for p in points) / n,
        sum(p[2] for p in points) / n,
    )


def face_normal(points):
    """Newell's method; works for triangles and quads."""
    nx = ny = nz = 0.0
    for i, a in enumerate(points):
        b = points[(i + 1) % len(points)]
        nx += (a[1] - b[1]) * (a[2] + b[2])
        ny += (a[2] - b[2]) * (a[0] + b[0])
        nz += (a[0] - b[0]) * (a[1] + b[1])
    return unit((nx, ny, nz))


LIGHT = unit((-0.45, -0.6, 0.66))


def shade(normal, palette):
    """Pick the light, mid or dark tone of a palette from the face angle."""
    d = dot(normal, LIGHT)
    if d > 0.4:
        return palette[0]
    if d > -0.15:
        return palette[1]
    return palette[2]


def flat(hex_color):
    return (hex_color, hex_color, hex_color)


class Model:
    def __init__(self, name):
        self.name = name
        self.verts = []
        self.faces = []  # (vertex indices, hex color, is_glow)

    def add(self, verts, faces, palette, glow=False):
        base = len(self.verts)
        self.verts.extend(verts)
        for face in faces:
            idx = tuple(base + i for i in face)
            normal = face_normal([self.verts[i] for i in idx])
            self.faces.append((idx, shade(normal, palette), glow))

    def check(self):
        count = len(self.verts)
        for idx, _color, _glow in self.faces:
            assert len(idx) in (3, 4), idx
            assert len(set(idx)) == len(idx), idx
            assert all(0 <= i < count for i in idx), idx
        tris = sum(len(idx) - 2 for idx, _c, _g in self.faces)
        print(f"{self.name}: {count} vertices, {len(self.faces)} faces, {tris} triangles")


# ---------------------------------------------------------------- shapes

def lathe(rings):
    """Join rings of points, listed top to bottom. A one-point ring is an apex."""
    verts, faces, starts = [], [], []
    for ring in rings:
        starts.append(len(verts))
        verts.extend(ring)
    for k in range(len(rings) - 1):
        a, b = rings[k], rings[k + 1]
        sa, sb = starts[k], starts[k + 1]
        n = max(len(a), len(b))
        for j in range(n):
            j1 = (j + 1) % n
            if len(a) == 1:
                faces.append((sa, sb + j, sb + j1))
            elif len(b) == 1:
                faces.append((sa + j, sb, sa + j1))
            else:
                faces.append((sa + j, sb + j, sb + j1, sa + j1))
    return verts, faces


def circle(n, radius, z, offset=0.0):
    return [
        (
            radius * math.cos(offset + 2 * math.pi * j / n),
            radius * math.sin(offset + 2 * math.pi * j / n),
            z,
        )
        for j in range(n)
    ]


def face_out(verts, faces, inside):
    """Flip any face that points toward the given inside point."""
    fixed = []
    for face in faces:
        pts = [verts[i] for i in face]
        if dot(face_normal(pts), sub(centroid(pts), inside)) < 0:
            face = tuple(reversed(face))
        fixed.append(face)
    return verts, fixed


def placed(verts, origin, direction):
    """Move shapes built around +Z so that +Z points along `direction`."""
    w = unit(direction)
    u = unit(cross((0.0, 0.0, 1.0), w))
    v = cross(w, u)
    return [add(origin, add(add(mul(u, x), mul(v, y)), mul(w, z))) for x, y, z in verts]


def dome(radius, height, segments=8):
    rings = [
        [(0.0, 0.0, height)],
        circle(segments, radius * 0.5, height * 0.88),
        circle(segments, radius * 0.85, height * 0.55),
        circle(segments, radius, 0.0),
    ]
    return lathe(rings)


def gem(center, radius):
    rings = [
        [(0.0, 0.0, radius * 1.3)],
        circle(4, radius, 0.0),
        [(0.0, 0.0, -radius * 1.3)],
    ]
    verts, faces = lathe(rings)
    return [add(center, v) for v in verts], faces


def pyramid(base, apex):
    verts = list(base) + [apex]
    n = len(base)
    faces = [(i, (i + 1) % n, n) for i in range(n)]
    faces.append(tuple(range(n)))
    return face_out(verts, faces, centroid(verts))


def ridge(path, side, radii, tip_length=0.12):
    """Tapered four-sided limb along a path. `side` is the direction across
    the limb. Returns (list of (verts, faces) parts, tip point)."""
    rings = []
    for i, point in enumerate(path):
        ahead = path[min(i + 1, len(path) - 1)]
        behind = path[max(i - 1, 0)]
        along = unit(sub(ahead, behind))
        out = unit(cross(side, along))
        r = radii[i]
        rings.append([
            add(point, mul(side, r)),
            add(point, mul(out, r * 0.8)),
            add(point, mul(side, -r)),
            add(point, mul(out, -r * 0.8)),
        ])
    tip = add(path[-1], mul(unit(sub(path[-1], path[-2])), tip_length))

    parts = []
    for i in range(len(rings) - 1):
        middle = centroid([path[i], path[i + 1]])
        parts.append(face_out(*lathe([rings[i], rings[i + 1]]), middle))
    parts.append(face_out(*lathe([rings[-1], [tip]]), path[-1]))
    return parts, tip


def add_eye(model, at, look, side, radius, eye, pupil, shine, pupil_size=0.52):
    """Pale dome set into the head, dark pupil, small highlight.
    `side` is -1 or 1 and nudges the pupil toward the nose."""
    s = radius / 0.33
    eye_v, eye_f = dome(radius, 0.2 * s)
    model.add(placed(eye_v, at, look), eye_f, eye)

    pupil_at = add(at, add(mul(look, 0.13 * s), (-side * 0.04 * s, 0.0, 0.0)))
    pupil_v, pupil_f = dome(radius * pupil_size, 0.11 * s, segments=6)
    model.add(placed(pupil_v, pupil_at, look), pupil_f, pupil)

    shine_at = add(pupil_at, add(mul(look, 0.085 * s), (-0.06 * s, 0.0, 0.07 * s)))
    shine_v, shine_f = dome(0.05 * s, 0.04 * s, segments=4)
    model.add(placed(shine_v, shine_at, look), shine_f, shine)


def add_smile(model, y, z, half_width, palette, thickness=0.045):
    """Small curved strip on a front face at depth y, centered at height z."""
    xs = [half_width * k / 2 for k in (-2, -1, 0, 1, 2)]
    top = [(x, y, z + (x / half_width) ** 2 * half_width * 0.45) for x in xs]
    bottom = [(x, y + 0.005, pz - thickness) for x, _y, pz in top]
    faces = [(i, i + 1, len(xs) + i + 1, len(xs) + i) for i in range(len(xs) - 1)]
    model.add(*face_out(top + bottom, faces, (0.0, 0.0, z)), palette)


# ------------------------------------------------------------------- glb

def srgb_to_linear(hex_color):
    channels = []
    for i in (1, 3, 5):
        c = int(hex_color[i:i + 2], 16) / 255
        channels.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return tuple(channels)


def to_gltf_axes(v):
    return (v[0], v[2], -v[1])


def write_glb(model, glow_color="#5DCAA5"):
    """Write models/<name>.glb. Unindexed triangles, so every face keeps its
    own flat normal and color. Glowing faces get their own emissive material."""
    groups = {False: ([], [], []), True: ([], [], [])}
    for idx, hex_color, glow in model.faces:
        pts = [to_gltf_axes(model.verts[i]) for i in idx]
        normal = face_normal(pts)
        color = srgb_to_linear(hex_color)
        positions, normals, colors = groups[glow]
        for i in range(1, len(pts) - 1):
            for p in (pts[0], pts[i], pts[i + 1]):
                positions.append(p)
                normals.append(normal)
                colors.append(color)

    blob = bytearray()
    views, accessors, primitives, materials = [], [], [], []

    def push(rows, with_bounds=False):
        offset = len(blob)
        for row in rows:
            blob.extend(struct.pack("<3f", *row))
        views.append({"buffer": 0, "byteOffset": offset,
                      "byteLength": len(rows) * 12, "target": 34962})
        accessor = {"bufferView": len(views) - 1, "componentType": 5126,
                    "count": len(rows), "type": "VEC3"}
        if with_bounds:
            accessor["min"] = [min(r[i] for r in rows) for i in range(3)]
            accessor["max"] = [max(r[i] for r in rows) for i in range(3)]
        accessors.append(accessor)
        return len(accessors) - 1

    surface = {"baseColorFactor": [1, 1, 1, 1], "metallicFactor": 0.0, "roughnessFactor": 0.9}
    for glow in (False, True):
        positions, normals, colors = groups[glow]
        if not positions:
            continue
        material = {"name": "Glow" if glow else "Body", "pbrMetallicRoughness": surface}
        if glow:
            material["emissiveFactor"] = list(srgb_to_linear(glow_color))
        materials.append(material)
        primitives.append({
            "attributes": {
                "POSITION": push(positions, with_bounds=True),
                "NORMAL": push(normals),
                "COLOR_0": push(colors),
            },
            "material": len(materials) - 1,
        })

    doc = {
        "asset": {"version": "2.0", "generator": "tools/lowpoly.py"},
        "scene": 0,
        "scenes": [{"nodes": [0]}],
        "nodes": [{"name": model.name, "mesh": 0}],
        "meshes": [{"name": model.name, "primitives": primitives}],
        "materials": materials,
        "accessors": accessors,
        "bufferViews": views,
        "buffers": [{"byteLength": len(blob)}],
    }

    text = json.dumps(doc, separators=(",", ":")).encode()
    text += b" " * (-len(text) % 4)
    blob.extend(b"\0" * (-len(blob) % 4))

    path = os.path.join(ROOT, "models", f"{model.name}.glb")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as handle:
        handle.write(struct.pack("<4sII", b"glTF", 2, 12 + 8 + len(text) + 8 + len(blob)))
        handle.write(struct.pack("<I4s", len(text), b"JSON"))
        handle.write(text)
        handle.write(struct.pack("<I4s", len(blob), b"BIN\0"))
        handle.write(blob)
    print("wrote", os.path.relpath(path, ROOT))


# ---------------------------------------------------------------- preview

def rotate(point, yaw, pitch):
    x, y, z = point
    cy, sy = math.cos(yaw), math.sin(yaw)
    x, y = x * cy - y * sy, x * sy + y * cy
    cp, sp = math.cos(pitch), math.sin(pitch)
    y, z = y * cp - z * sp, y * sp + z * cp
    return (x, y, z)


def write_preview(model, scale=46, lift=0.0):
    """Write artwork/<name>-model-preview.svg: a flat painter's-algorithm
    drawing of three views, camera on -Y."""
    views = [
        ("Front", 0.0, 0.0),
        ("Three-quarter", math.radians(40), math.radians(-12)),
        ("Side", math.radians(90), 0.0),
    ]
    size = 300
    out = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size * len(views)} {size}" '
        f'role="img" aria-label="Preview of the generated {model.name} model from three angles">',
        f'<rect width="{size * len(views)}" height="{size}" fill="#042C53"/>',
    ]
    for n, (label, yaw, pitch) in enumerate(views):
        verts = [rotate(v, yaw, pitch) for v in model.verts]
        drawn = []
        for idx, color, _glow in model.faces:
            pts = [verts[i] for i in idx]
            if face_normal(pts)[1] >= 0:
                continue
            drawn.append((centroid(pts)[1], pts, color))
        drawn.sort(key=lambda item: -item[0])
        ox, oy = size * n + size / 2, size * 0.48 + lift * scale
        for _depth, pts, color in drawn:
            coords = " ".join(
                f"{ox + p[0] * scale:.1f},{oy - p[2] * scale:.1f}" for p in pts
            )
            out.append(
                f'<polygon points="{coords}" fill="{color}" stroke="{color}" stroke-width="0.6"/>'
            )
        out.append(
            f'<text x="{size * n + 12}" y="22" font-family="sans-serif" font-size="14" '
            f'fill="#B5D4F4">{label}</text>'
        )
    out.append("</svg>")
    path = os.path.join(ROOT, "artwork", f"{model.name}-model-preview.svg")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as handle:
        handle.write("\n".join(out) + "\n")
    print("wrote", os.path.relpath(path, ROOT))
