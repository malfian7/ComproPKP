#!/usr/bin/env python3
"""Siapkan foto & screenshot produk: bingkai seragam (gaya tablet putih), simpan WebP."""
import pathlib
from PIL import Image, ImageDraw, ImageFilter

U = pathlib.Path("/root/.claude/uploads/63eb11c8-768b-57c4-8a6f-a0f68fc9a87a")
OUT = pathlib.Path(__file__).parent / "assets" / "media"; OUT.mkdir(parents=True, exist_ok=True)
W, H = 1100, 802                                   # kanvas sama dengan mockup KlinikCare/Harmony/E-Meterai
FRAME = (120, 60, 980, 710); RADIUS = 44; PAD = 46

def framed(src):
    """Taruh screenshot tanpa bingkai ke dalam bingkai tablet putih + bayangan lembut."""
    shot = Image.open(src).convert("RGBA")
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sh = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    x0, y0, x1, y1 = FRAME
    d.rounded_rectangle((x0 + 10, y0 + 40, x1 - 10, y1 + 30), RADIUS, fill=(10, 30, 50, 70))
    sh = sh.filter(ImageFilter.GaussianBlur(34)); canvas.alpha_composite(sh)
    fr = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ImageDraw.Draw(fr).rounded_rectangle(FRAME, RADIUS, fill=(255, 255, 255, 255))
    canvas.alpha_composite(fr)
    iw, ih = x1 - x0 - 2 * PAD, y1 - y0 - 2 * PAD
    s = min(iw / shot.width, ih / shot.height)
    shot = shot.resize((round(shot.width * s), round(shot.height * s)), Image.LANCZOS)
    canvas.alpha_composite(shot, (x0 + PAD + (iw - shot.width) // 2, y0 + PAD + (ih - shot.height) // 2))
    return canvas

items = {
    "about-building": (Image.open(U / "aa4c0363-image.png").convert("RGBA"), 80),
    "prod-fincore":   (framed(U / "38bd7b78-image.png"), 80),
    "prod-icolls":    (framed(U / "8bcaae9b-image.png"), 80),
    "prod-klinikcare": (Image.open(U / "4d179d3a-image.png").convert("RGBA"), 78),
    "prod-harmony":   (Image.open(U / "1bdcc460-image.png").convert("RGBA"), 78),
    "prod-beezap":    (Image.open(U / "11cea0d6-image.png").convert("RGBA"), 80),
    "prod-callcenter": (framed(U / "592db43f-image.png"), 80),
    "prod-emeterai":  (Image.open(U / "75f2811e-image.png").convert("RGBA"), 78),
}
total = 0
def feather(im, px=36):
    """Pudarkan alpha di tepi kanvas agar bayangan tidak terpotong tajam saat diratakan."""
    import numpy as np
    a = np.asarray(im).astype(float)
    h, w = a.shape[:2]
    ys = np.minimum(np.arange(h), np.arange(h)[::-1]) / px
    xs = np.minimum(np.arange(w), np.arange(w)[::-1]) / px
    m = np.clip(np.minimum.outer(ys, xs), 0, 1)
    a[..., 3] *= m
    return Image.fromarray(a.astype("uint8"), "RGBA")

SCALE = 0.8   # tampil maks ±560px -> 880px cukup tajam untuk layar retina
for name, (im, q) in items.items():
    if name.startswith("prod-"):
        im = feather(im)
        sc = 880 / im.width if im.width != W else SCALE      # samakan lebar file = 880px
        im = im.resize((round(im.width * sc), round(im.height * sc)), Image.LANCZOS)
    # Diratakan ke warna latar section (putih / navy) -> tanpa kanal alpha, ukuran file ±3x lebih kecil
    dark = name in ("about-building", "prod-beezap", "prod-callcenter")      # section gelap (navy)
    bg = Image.new("RGBA", im.size, (14, 22, 38, 255) if dark else (255, 255, 255, 255))
    bg.alpha_composite(im)
    bg.convert("RGB").save(OUT / f"{name}.webp", "WEBP", quality=q, method=6)
    n = (OUT / f"{name}.webp").stat().st_size; total += n
    print(f"{name:16} {im.size}  {n} B")
print("total", total)
