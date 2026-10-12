"""Vektorisasi logogram PKP (lingkaran biru + bentuk putih + chevron kuning) -> SVG ringan."""
import numpy as np, potrace
from PIL import Image
SRC = "/root/.claude/uploads/63eb11c8-768b-57c4-8a6f-a0f68fc9a87a/74ad1c07-image.png"
im = Image.open(SRC).convert("RGBA")
N = 600
im = im.resize((N, N), Image.LANCZOS)
a = np.asarray(im).astype(int)
r, g, b, al = a[..., 0], a[..., 1], a[..., 2], a[..., 3]
white = (r > 225) & (g > 225) & (b > 225) & (al > 200)
yellow = (r > 200) & (g > 150) & (g < 220) & (b < 90) & (al > 200)
blue = (b > 150) & (r < 120) & (al > 128)
ys, xs = np.nonzero(blue | white | yellow)
cx, cy = (xs.min() + xs.max()) / 2, (ys.min() + ys.max()) / 2
rad = max(xs.max() - xs.min(), ys.max() - ys.min()) / 2
def trace(mask):
    bm = potrace.Bitmap(~mask)   # potracer: False = foreground
    path = bm.trace(turdsize=20, alphamax=1.0, opticurve=True, opttolerance=0.4)
    d = []
    for c in path:
        s = c.start_point; d.append(f"M{s.x:.1f} {s.y:.1f}")
        for seg in c.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f} {seg.c.y:.1f}L{seg.end_point.x:.1f} {seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}")
        d.append("Z")
    return "".join(d)
w, y = trace(white), trace(yellow)
svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}">'
       f'<circle class="lg-ring" cx="{cx:.1f}" cy="{cy:.1f}" r="{rad:.1f}" fill="#2A9FDB"/>'
       f'<path class="lg-white" fill="#fff" d="{w}"/><path class="lg-gold" fill="#FBBC17" d="{y}"/></svg>')
open("assets/logogram.svg", "w").write(svg)
print(len(svg), "bytes; center", cx, cy, rad)
