#!/usr/bin/env python3
"""Screenshot aplikasi mobile -> WebP (dengan transparansi bingkai). Sehati (resolusi rendah) dibingkai ulang."""
import pathlib
from PIL import Image, ImageFilter
U = pathlib.Path("/root/.claude/uploads/63eb11c8-768b-57c4-8a6f-a0f68fc9a87a")
OUT = pathlib.Path(__file__).parent / "assets" / "media"; OUT.mkdir(parents=True, exist_ok=True)
APPS = [("app-mfincore", "b94a9772"), ("app-koperasi", "efa9b421"), ("app-membership", "02772db4"), ("app-beeatt", "01d4d324"),
        ("app-verification", "ac00ff8e"), ("app-collection", "2666f197"), ("app-recovery", "1c6bceee"), ("app-harmony", "228f5bd1")]
template = Image.open(U / "b94a9772-image.png").convert("RGBA")
inner_mask = template.split()[-1].point(lambda v: 255 if v == 255 else 0)   # area layar (opak) di dalam bingkai
bbox = inner_mask.getbbox()
total = 0
for name, fid in APPS:
    im = Image.open(U / f"{fid}-image.png").convert("RGBA")
    if im.size != template.size:               # Sehati: ambil isi layar, perbesar, tempel ke bingkai template
        scr = im.crop((3, 3, im.width - 3, im.height - 3))
        w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
        scr = scr.resize((w * 2, h * 2), Image.LANCZOS).resize((w, h), Image.LANCZOS).filter(ImageFilter.UnsharpMask(0.8, 70, 2))
        layer = Image.new("RGBA", template.size, (0, 0, 0, 0)); layer.paste(scr, bbox[:2])
        im = template.copy(); im.paste(layer, (0, 0), inner_mask)
    im.save(OUT / f"{name}.webp", "WEBP", quality=82, alpha_quality=80, method=6)
    n = (OUT / f"{name}.webp").stat().st_size; total += n
    print(f"{name:18} {im.size} {n} B")
print("total", total)
