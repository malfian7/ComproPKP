#!/usr/bin/env python3
"""Optimasi logo partner & klien: hapus latar putih, trim, samakan bobot visual, simpan WebP @2x."""
import json, math, pathlib
from PIL import Image, ImageFilter

U = pathlib.Path("/root/.claude/uploads/63eb11c8-768b-57c4-8a6f-a0f68fc9a87a")
BASE = pathlib.Path(__file__).parent / "assets"

# slug, nama, file, hapus_latar_putih
PARTNERS = [
    ("telkom", "Telkom Indonesia", "853aefcd", False),
    ("telkomsigma", "Telkomsigma", "3d9414df", False),
    ("finnet", "Finnet", "72cab6dc", False),
    ("xl", "XL Axiata", "e65e1a63", False),
    ("hpe", "Hewlett Packard Enterprise", "4d0448dd", True),
    ("veeam", "Veeam", "2ce32598", False),
    ("indosat", "Indosat Ooredoo", "3ebffecd", True),
    ("eset", "ESET", "3563564a", True),
    ("smartfren", "Smartfren", "8db841b5", False),
    ("1engage", "1Engage", "5ca91e0d", True),
    ("tencent", "Tencent Cloud", "b9cc5489", True),
    ("biznet", "Biznet", "72c541a5", False),
    ("faspay", "Faspay", "986e0050", False),
    ("tri", "Tri", "a0c1d2fc", False),
    ("pactindo", "Sarana Pactindo", "2a5c7096", True),
    ("doitpay", "Doitpay", "7e555d40", False),
    ("dpscloud", "DPS Cloud", "cb3ac5a6", False),
]

# Logo klien (sebagian hasil scan/JPEG -> latar dibersihkan & di-upscale halus)
CLIENTS = [
    ("fifgroup", "FIFGROUP", "e4ae554a", True),
    ("simgroup", "SIMGROUP", "c4b7c217", True),
    ("sehati", "Sehati", "8c816339", True),
    ("dika", "Dika Sinar Sejahtera", "8d06747b", True),
    ("morena", "Morena Rent", "43a34f19", True),
    ("indomobil", "Indomobil Finance", "87ed15c1", True),
    ("astrapay", "AstraPay", "e2cd3166", True),
    ("nusaprima", "Nusa Prima Motor", "df3055e1", True),
    ("nusaperkasa", "Nusa Perkasa Makmur", "f31217e0", True),
    ("kspmas", "KSP MAS", "fdcf5815", True),
    ("sinarmentari", "Sinar Mentari Makmur", "b7b71232", True, (0, 0.12, 1, 0.84)),  # fokus ke emblem
    ("dayakaruniamakmur", "Daya Karunia Makmur", "c71a9536", True),
    ("dayakaruniamandiri", "Daya Karunia Mandiri", "4ec49228", True),
    ("apjapi", "APJAPI", "4ce9a543", True),
    ("ska", "SKA", "29dc3be4", True),
    ("bintangindah", "Bintang Indah Gemerlap", "2b4886de", True),
    ("pengenumroh", "Pengen Umroh", "d06e9cc4", True),
    ("mncfinance", "MNC Finance", "eda7f0da", True),
    ("kas", "KAS", "d0c4df7b", True),
    ("cma", "CMA", "61b29bfa", "key"),            # latar kekuningan -> di-key dari warna sudut
    ("mncguna", "MNC Guna Usaha Indonesia", "02956172", True),
    ("ima", "Indonesia Marketing Association", "cd5b1873", "key"),  # latar kebiruan
    ("megacapital", "Mega Capital Sekuritas", "9b0a5e55", True),
    ("mcf", "MCF", "1eb5f631", True),
    ("kiss", "Kiss", "d1aca6c8", True),
    ("sehatisyariah", "Koperasi Sehati Syariah", "736a11f7", True),
    ("woori", "Woori Finance Indonesia", "adef9248", True),
    ("big", "BIG", "a56e561a", True),
    ("prime", "Prime Travelindo", "c628b15d", True),
    ("tobadihon", "Tobadihon Mandiri", "deca90f7", "clean", (0.05, 0, 0.97, 1)),  # buang coretan di tepi kiri
    ("kusuma8", "Kusuma 8", "498673de", True),
    ("petra", "Petra Sukses Utama", "b67220ed", True, (0, 0, 1, 0.9)),   # buang titik kecil di bawah teks
    ("bintangorbit", "Bintang Orbit Semesta", "dbcf66a5", True),
    ("ganesha", "Ganesha Bina Utama", "48391f75", True),
]

AREA = 4300          # luas tampilan target (px²) agar bobot visual seimbang
MAX_W, MAX_H = 140, 50
SCALE = 2            # simpan @2x untuk layar retina

def white_to_alpha(im, cut=0.02):
    """'Color to alpha' untuk putih: menjaga anti-aliasing tepi."""
    px = im.load()
    for y in range(im.height):
        for x in range(im.width):
            r, g, b, a = px[x, y]
            m = min(r, g, b)
            na = (255 - m) / 255.0          # seberapa jauh dari putih
            if na <= cut:
                px[x, y] = (255, 255, 255, 0); continue
            nr = int(round((r - 255 * (1 - na)) / na)); ng = int(round((g - 255 * (1 - na)) / na)); nb = int(round((b - 255 * (1 - na)) / na))
            px[x, y] = (max(0, min(255, nr)), max(0, min(255, ng)), max(0, min(255, nb)), int(round(a * na)))
    return im

def key_background(im, tol0=18, tol1=60):
    """Buat transparan warna latar (diambil dari rata-rata 4 sudut) dengan tepi lembut."""
    px = im.load(); W, H = im.size
    cs = [px[0, 0], px[W - 1, 0], px[0, H - 1], px[W - 1, H - 1]]
    bg = tuple(sum(c[i] for c in cs) / 4 for i in range(3))
    for y in range(H):
        for x in range(W):
            r, g, b, a = px[x, y]
            d = ((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2) ** 0.5
            k = 0 if d <= tol0 else (1 if d >= tol1 else (d - tol0) / (tol1 - tol0))
            px[x, y] = (r, g, b, int(a * k))
    return im

def drop_faint(im, min_alpha=90):
    """Hapus noda tipis/semi transparan di luar logo."""
    r, g, b, a = im.split()
    a = a.point(lambda v: 0 if v < min_alpha else v)
    return Image.merge("RGBA", (r, g, b, a))

def process(group, logos, cut=0.02, upscale=False, quality=80, scale=SCALE):
    out = BASE / group; out.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for slug, name, fid, strip, *crop in logos:
        im = Image.open(U / f"{fid}-image.png").convert("RGBA")
        if crop:
            x0, y0, x1, y1 = crop[0]
            im = im.crop((round(x0 * im.width), round(y0 * im.height), round(x1 * im.width), round(y1 * im.height)))
        if strip == "key":
            im = key_background(im)
        elif strip == "clean":
            im = drop_faint(im)
        elif strip:
            im = white_to_alpha(im, cut)
        bbox = im.split()[-1].point(lambda v: 255 if v > 10 else 0).getbbox()
        im = im.crop(bbox)
        r = im.width / im.height
        h = math.sqrt(AREA / r); w = h * r
        if h > MAX_H: h, w = MAX_H, MAX_H * r
        if w > MAX_W: w, h = MAX_W, MAX_W / r
        w, h = round(w), round(h)
        th = round(h * scale) if upscale else min(im.height, round(h * scale))
        tw = round(th * r)
        if (tw, th) != im.size:
            if upscale and th > im.height:
                # upscale bertahap agar tepi tetap halus, lalu tajamkan
                while im.height * 1.5 < th:
                    im = im.resize((round(im.width * 1.5), round(im.height * 1.5)), Image.LANCZOS)
            im = im.resize((tw, th), Image.LANCZOS)
            im = im.filter(ImageFilter.UnsharpMask(radius=0.8 if upscale else 0.6, percent=80 if upscale else 60, threshold=2))
        im.save(out / f"{slug}.webp", "WEBP", quality=quality, method=6)
        manifest[slug] = {"name": name, "w": w, "h": h, "src_px": list(im.size), "bytes": (out / f"{slug}.webp").stat().st_size}
    (out / "manifest.json").write_text(json.dumps(manifest, indent=1))
    print(f"== {group}: {len(manifest)} logo, {sum(v['bytes'] for v in manifest.values())} B")
    for k, v in manifest.items():
        print(f"  {k:20} tampil {v['w']}x{v['h']}  file {v['src_px']}  {v['bytes']} B")

process("partners", PARTNERS)
process("clients", CLIENTS, cut=0.07, upscale=True, quality=76, scale=1.6)
