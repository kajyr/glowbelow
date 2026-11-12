"""App icons: the vampire squid's front view on a full-bleed deep-blue square.

    python3 tools/make_icons.py

Reads artwork/squid-front.svg and writes public/icons/icon-192.png,
icon-512.png and apple-touch-icon.png (180). The squid is shrunk into the
middle 80% so the same picture works as a maskable icon (Android crops it
to a circle or squircle; iOS rounds the corners itself).

Plain Python, no image libraries: only the shapes the squid art uses
(rect, polygon, circle, and one stroked quadratic path) are understood.
Shapes are filled by scanlines at 4x and averaged down for smooth edges.
"""

import math
import re
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "artwork" / "squid-front.svg"
OUT = ROOT / "public" / "icons"
SIZES = {"icon-192.png": 192, "icon-512.png": 512, "apple-touch-icon.png": 180}

BACKGROUND = "#042C53"
SAFE = 0.8  # the squid fits the maskable safe circle
SS = 4  # supersampling


def attrs(tag):
    return dict(re.findall(r'([\w-]+)="([^"]*)"', tag))


def circle(cx, cy, r, n=48):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def stroke(points, width):
    """A thick polyline as one quad per segment plus round joints/caps."""
    h = width / 2
    shapes = [circle(x, y, h, 16) for x, y in points]
    for (x0, y0), (x1, y1) in zip(points, points[1:]):
        dx, dy = x1 - x0, y1 - y0
        k = h / (math.hypot(dx, dy) or 1)
        nx, ny = -dy * k, dx * k
        shapes.append([(x0 + nx, y0 + ny), (x1 + nx, y1 + ny), (x1 - nx, y1 - ny), (x0 - nx, y0 - ny)])
    return shapes


def quad_path(d):
    """'M x,y Q cx,cy x,y' sampled into points."""
    n = [float(v) for v in re.findall(r"-?\d+(?:\.\d+)?", d)]
    (x0, y0), (cx, cy), (x1, y1) = n[0:2], n[2:4], n[4:6]
    pts = []
    for i in range(13):
        t = i / 12
        a, b, c = (1 - t) ** 2, 2 * (1 - t) * t, t * t
        pts.append((a * x0 + b * cx + c * x1, a * y0 + b * cy + c * y1))
    return pts


def read_shapes():
    """(colour, polygon) pairs in painting order, in SVG units, background card skipped."""
    svg = SOURCE.read_text()
    vb = [float(v) for v in re.search(r'viewBox="([^"]+)"', svg).group(1).split()]
    shapes = []
    for tag in re.findall(r"<(?:polygon|circle|path)\b[^>]*>", svg):
        a = attrs(tag)
        if tag.startswith("<polygon"):
            n = [float(v) for v in re.split(r"[\s,]+", a["points"].strip())]
            shapes.append((a["fill"], list(zip(n[0::2], n[1::2]))))
        elif tag.startswith("<circle"):
            shapes.append((a["fill"], circle(float(a["cx"]), float(a["cy"]), float(a["r"]))))
        else:
            for poly in stroke(quad_path(a["d"]), float(a["stroke-width"])):
                shapes.append((a["stroke"], poly))
    return vb, shapes


def rgb(hex_colour):
    return tuple(int(hex_colour[i : i + 2], 16) for i in (1, 3, 5))


def fill(buf, w, poly, colour):
    """Even-odd scanline fill of one polygon into an RGB bytearray of width w."""
    ys = [y for _, y in poly]
    px = bytes(colour)
    for row in range(max(0, int(min(ys))), min(w, int(math.ceil(max(ys))))):
        y = row + 0.5
        xs = []
        for (x0, y0), (x1, y1) in zip(poly, poly[1:] + poly[:1]):
            if (y0 <= y < y1) or (y1 <= y < y0):
                xs.append(x0 + (y - y0) * (x1 - x0) / (y1 - y0))
        xs.sort()
        for a, b in zip(xs[0::2], xs[1::2]):
            s, e = max(0, int(a + 0.5)), min(w, int(b + 0.5))
            if e > s:
                buf[(row * w + s) * 3 : (row * w + e) * 3] = px * (e - s)


def render(size, vb, shapes):
    w = size * SS
    buf = bytearray(bytes(rgb(BACKGROUND)) * (w * w))
    x0, y0, vw, vh = vb
    scale = w / vw * SAFE
    cx, cy = x0 + vw / 2, y0 + vh / 2
    for colour, poly in shapes:
        fill(buf, w, [((x - cx) * scale + w / 2, (y - cy) * scale + w / 2) for x, y in poly], rgb(colour))
    # Average each SS x SS block down to one pixel.
    out = bytearray()
    n = SS * SS
    for row in range(size):
        out.append(0)  # PNG filter: none
        rows = [buf[((row * SS + k) * w) * 3 : ((row * SS + k + 1) * w) * 3] for k in range(SS)]
        for col in range(size):
            for ch in range(3):
                t = 0
                for r in rows:
                    t += sum(r[(col * SS + j) * 3 + ch] for j in range(SS))
                out.append((t + n // 2) // n)
    return bytes(out)


def png(size, raw):
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)

    return (
        b"\x89PNG\r\n\x1a\n"
        + chunk(b"IHDR", struct.pack(">IIBBBBB", size, size, 8, 2, 0, 0, 0))
        + chunk(b"IDAT", zlib.compress(raw, 9))
        + chunk(b"IEND", b"")
    )


def main():
    vb, shapes = read_shapes()
    OUT.mkdir(parents=True, exist_ok=True)
    for name, size in SIZES.items():
        (OUT / name).write_bytes(png(size, render(size, vb, shapes)))
        print(f"wrote public/icons/{name}")


if __name__ == "__main__":
    main()
