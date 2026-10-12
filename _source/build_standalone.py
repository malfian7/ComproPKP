#!/usr/bin/env python3
"""Gabungkan seluruh website PKP menjadi SATU file HTML standalone.
Semua halaman tetap terpisah secara tampilan (router berbasis #/halaman),
tapi CSS, JS, ikon, logo, dan konten berada dalam satu file.
"""
import re, pathlib, html, urllib.parse, collections
import build as B

SITE = pathlib.Path("/home/claude/pkp-website")
OUT = pathlib.Path("/mnt/user-data/outputs/pkp-company-profile.html")

ORDER = ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "blog-detail", "kontak"]
key_of = lambda stem: "home" if stem == "index" else stem

import base64
ASSETS = B.ROOT / "assets"
b64 = lambda f: base64.b64encode((ASSETS / f).read_bytes()).decode()
LOGO_URI = f"data:image/webp;base64,{b64('logo-pkp.webp')}"      # logo lengkap (untuk latar gelap)
FAVICON = f"data:image/png;base64,{b64('favicon-64.png')}"       # logogram saja

def rewrite_links(s):
    def rep(m):
        stem, query, anchor = m.group(1), m.group(2) or "", m.group(3) or ""
        k = key_of(stem)
        path = "#/" if k == "home" else f"#/{k}"
        if anchor:
            path += ("" if path.endswith("/") else "/") + anchor[1:]
        return f'href="{path}{query}"'
    return re.sub(r'href="([a-z][\w-]*)\.html(\?[^"#]*)?(#[^"]*)?"', rep, s)

# ---------------------------------------------------------------- pages
pages = []
defs = {}
for stem in ORDER:
    raw = (B.ROOT / "pages" / f"{stem}.html").read_text()
    first, _, body = raw.partition("\n")
    meta = dict(kv.split("=", 1) for kv in re.split(r"\|(?=[a-z]+=)", re.match(r"<!--\s*(.*?)\s*-->", first).group(1)))
    body = B.expand(body)
    # pindahkan <defs> gradient ke sprite global (gradient di elemen tersembunyi tidak dirender)
    def grab(m):
        gid = re.search(r'id="([^"]+)"', m.group(0)).group(1)
        defs[gid] = m.group(1)
        return ""
    body = re.sub(r"<defs>(<linearGradient.*?</linearGradient>)</defs>", grab, body, flags=re.S)
    pages.append({"stem": stem, "key": key_of(stem), "meta": meta, "body": body})

# ---------------------------------------------------------------- id unik lintas halaman
count = collections.Counter()
for p in pages:
    for i in set(re.findall(r'\sid="([^"]+)"', p["body"])):
        count[i] += 1
dupes = {i for i, n in count.items() if n > 1}
for p in pages:
    b, pre = p["body"], p["key"]
    for i in dupes:
        new = f"{pre}-{i}"
        b = re.sub(rf'(\s(?:id|for)=")({re.escape(i)})"', rf'\1{new}"', b)
        b = re.sub(rf'(\saria-(?:labelledby|controls|describedby)="[^"]*?)\b{re.escape(i)}\b', rf'\1{new}', b)
        b = b.replace(f'href="#{i}"', f'href="#{new}"')
    # anchor lokal (#fincore) -> #/produk/fincore
    b = re.sub(r'(<a\b[^>]*?\shref=")#(?!/|main")([\w-]+)"', lambda m: f'{m.group(1)}#/{p["key"]}/{m.group(2)}"', b)
    b = re.sub(r'<img (?![^>]*decoding=)', '<img decoding="async" ', b)
    p["body"] = rewrite_links(b)

# ---------------------------------------------------------------- shell
header = rewrite_links(B.header(""))
footer = rewrite_links(B.footer())
cta = rewrite_links(B.cta_band()).replace('<section class="cta-band"', '<section class="cta-band" id="cta-band"')

css = (SITE / "assets/css/style.css").read_text()
css = css.replace('--logo-pkp: url("../img/logo-pkp.webp");', f'--logo-pkp: url("{LOGO_URI}");')
assert LOGO_URI in css
css += """
/* ---------- Standalone: router halaman ---------- */
.page[hidden] { display: none !important; }
.page.page-enter { animation: pageIn 420ms var(--ease-out); }
@keyframes pageIn { from { opacity: 0; } to { opacity: 1; } }
.page h1:focus { outline: none; }
"""

js = (SITE / "assets/js/main.js").read_text()
js = js.replace('document.getElementById(a.getAttribute("href").slice(1))', 'document.getElementById(a.getAttribute("href").split("/").pop())')
old_prefill = js[js.index("  /* ---------- Prefill form dari URL"):js.index("  /* ---------- Salin tautan artikel")]
new_prefill = '''  /* ---------- Prefill form kontak dari tautan (#/kontak?kebutuhan=... / ?produk=...) ---------- */
  function prefill(qs) {
    var sel = $("#f-kebutuhan"); if (!sel || !qs) return;
    var keb = qs.get("kebutuhan"), prod = qs.get("produk");
    if (keb && $('option[value="' + keb + '"]', sel)) sel.value = keb;
    if (prod) {
      sel.value = "produk";
      var names = { klinikcare: "KlinikCare", beezap: "BeeZap (WhatsApp Business)" };
      var msg = $("#f-pesan"); if (msg && !msg.value) msg.value = "Saya tertarik dengan " + (names[prod] || prod) + ". Mohon info demo dan penawarannya.";
    }
  }

'''
js = js.replace(old_prefill, new_prefill)
router = '''  /* ---------- Router: satu file, banyak halaman (#/tentang, #/produk/fincore, ...) ---------- */
  var pageEls = $$(".page"), pageMap = {}, currentPage = null, cta = $("#cta-band"), metaDesc = $('meta[name="description"]');
  pageEls.forEach(function (p) { pageMap[p.getAttribute("data-page")] = p; });
  function parse() {
    var h = location.hash, q = "";
    if (h.indexOf("#/") !== 0) return null;
    var qi = h.indexOf("?"); if (qi > -1) { q = h.slice(qi + 1); h = h.slice(0, qi); }
    var parts = h.slice(2).split("/");
    return { page: parts[0] || "home", anchor: parts[1] || "", query: window.URLSearchParams ? new URLSearchParams(q) : null };
  }
  function scrollToAnchor(id, smooth) {
    var el = id && document.getElementById(id);
    if (el) requestAnimationFrame(function () { el.scrollIntoView({ behavior: smooth && !reduceMotion ? "smooth" : "instant", block: "start" }); });
    return !!el;
  }
  function applyRoute(r, initial) {
    var pg = pageMap[r.page], changed = currentPage !== r.page;
    if (changed) {
      pageEls.forEach(function (p) { p.hidden = p !== pg; });
      pg.classList.remove("page-enter"); void pg.offsetWidth; if (!initial) pg.classList.add("page-enter");
      document.title = pg.getAttribute("data-title");
      if (metaDesc) metaDesc.setAttribute("content", pg.getAttribute("data-desc"));
      var nav = pg.getAttribute("data-nav");
      $$(".nav-link, .nav-cta, .drawer-nav > a").forEach(function (a) {
        var m = (a.getAttribute("href") || "").match(/^#\\/([^\\/?]*)/), k = m ? (m[1] || "home") : null;
        if (k === nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
      });
      moveIndicator(initial);
      if (cta) cta.hidden = pg.getAttribute("data-cta") === "no";
      if (!initial) armCounters(pg);      // ulangi animasi hitung angka di halaman ini
      currentPage = r.page;
    }
    if (r.page === "kontak") prefill(r.query);
    if (!scrollToAnchor(r.anchor, !changed) && changed) window.scrollTo({ top: 0, behavior: "instant" });
    if (changed && !initial && !r.anchor) { var h1 = $("h1", pg); if (h1) { h1.setAttribute("tabindex", "-1"); h1.focus({ preventScroll: true }); } }
    updateProgress();
  }

  /* ---------- Transisi pindah halaman: layar loading logogram PKP ----------
     Hanya saat berpindah halaman di dalam website (bukan saat pertama dibuka),
     durasi total ±0,85 detik, dan dilewati bila pengguna memilih "kurangi animasi". */
  var loader = $("#route-loader"), loaderPath = loader && $(".rl-path", loader), tIn = null, tOut = null;
  var lastPoint = null;
  document.addEventListener("pointerdown", function (e) { lastPoint = { x: e.clientX, y: e.clientY }; }, { passive: true });
  function transition(r) {
    clearTimeout(tIn); clearTimeout(tOut);
    var p = lastPoint || { x: window.innerWidth / 2, y: window.innerHeight / 2 }; lastPoint = null;
    loader.style.setProperty("--cx", p.x + "px"); loader.style.setProperty("--cy", p.y + "px");
    if (loaderPath) loaderPath.textContent = "/" + (r.page === "home" ? "beranda" : r.page);
    loader.classList.remove("is-out", "is-active"); void loader.offsetWidth;
    loader.classList.add("is-active");
    tIn = setTimeout(function () {
      applyRoute(r, false);
      loader.classList.add("is-out");
      tOut = setTimeout(function () { loader.classList.remove("is-active", "is-out"); }, 360);
    }, 520);
  }
  function route(initial) {
    var r = parse();
    if (!r) { if (currentPage) return; r = { page: "home", anchor: "", query: null }; }
    if (!pageMap[r.page]) r.page = "home";
    var changed = currentPage !== r.page;
    if (changed && !initial && loader && !reduceMotion) transition(r);
    else applyRoute(r, initial);
  }
  window.addEventListener("hashchange", function () { route(false); });
  // klik tautan ke halaman yang sedang dibuka: gulir ke atas / ke anchor
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#/"]');
    if (a && a.getAttribute("href") === location.hash) {
      e.preventDefault(); var r = parse();
      if (!scrollToAnchor(r && r.anchor, true)) window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }
  });
  route(true);

'''
js = js.replace("  /* ---------- Tahun footer ---------- */", router + "  /* ---------- Tahun footer ---------- */")

def page_block(p):
    m = p["meta"]
    title = m.get("seo") or ("PKP — Partner Terpercaya Transformasi Digital Bisnis Anda" if p["key"] == "home" else f"{m['title']} — PT. Prawathiya Karsa Pradiptha")
    nav = m.get("nav", p["key"])
    label = "BERANDA" if p["key"] == "home" else m["title"].upper()
    return f'''
<!-- =====================================================================
     HALAMAN: {label}   (buka dengan #/{"" if p["key"] == "home" else p["key"]})
     ===================================================================== -->
<div class="page" data-page="{p["key"]}" data-nav="{nav}" data-title="{html.escape(title)}" data-desc="{html.escape(m.get("desc", ""))}" data-cta="{m.get("cta", "yes")}"{"" if p["key"] == "home" else " hidden"}>
{p["body"].strip()}
</div>'''

home = pages[0]
doc = f'''<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{html.escape(home["meta"].get("seo", "PKP"))}</title>
<meta name="description" content="{html.escape(home["meta"]["desc"])}">
<meta name="theme-color" content="#0A2C46">
<link rel="icon" href="{FAVICON}" type="image/png">
<link rel="preconnect" href="https://images.unsplash.com">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Font dimuat tanpa memblokir render (teks tampil dulu dengan font sistem) -->
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap"></noscript>
<!--
  PKP Company Profile — FILE STANDALONE (satu file untuk semua halaman)
  Cara navigasi : setiap halaman ada di blok <div class="page" data-page="..."> di bawah.
                  URL memakai hash: #/ (Beranda), #/tentang, #/produk, #/produk/fincore, #/kontak?kebutuhan=training
  Cari cepat    : Ctrl+F "HALAMAN:" untuk lompat antar halaman, "1. Tokens" untuk warna/typo.
  Header/Footer : hanya ada SATU kali (lihat <header class="site-header"> dan <footer class="site-footer">).
  Logo          : variabel CSS --logo-pkp di bagian "1. Tokens" — ganti sekali (mis. url('logo.png')), berubah di header, menu mobile & footer.
  Favicon       : <link rel="icon"> di atas.
  Form kontak   : Ctrl+F "PKP_CONTACT" (di awal <script>) untuk mengubah email penerima.
-->
<style>
{css}
</style>
</head>
<body>
@@SPRITE@@
@@LOADER@@
{header}
<main id="main">
{"".join(page_block(p) for p in pages)}

<!-- ===== CTA bersama (disembunyikan otomatis di halaman Kontak) ===== -->
{cta}
</main>
{footer}
@@PARTNER_CSS@@
<script>
{js}
</script>
</body>
</html>
'''
# ---- logo partner: gambar disimpan SEKALI sebagai class CSS, markup cukup memanggil class-nya
used_logos = {}
def logo_span(m):
    group, slug, name, w, h = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    cls = ("pl-" if group == "partners" else "cl-") + slug
    used_logos[cls] = (group, slug, name)
    return f'<span class="partner-logo {cls}" role="img" aria-label="{name}" style="width:{w}px;height:{h}px;--ar:{w}/{h}"></span>'
def media_span(m):
    cls, name, alt, w, h = m.group(1), m.group(2), m.group(3), m.group(4), m.group(5)
    used_logos["md-" + name] = ("media", name, alt)
    return f'<span class="media-img {cls} md-{name}" role="img" aria-label="{alt}" style="--ar:{w}/{h}"></span>'
# sertifikat ISO: di file standalone tidak ada file gambar terpisah untuk ukuran penuh, jadi tautannya dilepas
doc = re.sub(r'<a class="cert-photo"[^>]*>(.*?)<span class="cert-zoom">.*?</span></span>\s*</a>', r'<div class="cert-photo">\1</div>', doc, flags=re.S)
doc = re.sub(r'<img class="(shot app-shot|shot|photo|cert-img)" src="assets/img/media/([\w-]+)\.webp" alt="([^"]*)" width="(\d+)" height="(\d+)"[^>]*>', media_span, doc)
doc = re.sub(r'<img class="partner-logo" src="assets/img/(partners|clients)/([\w-]+)\.webp" alt="([^"]*)" width="(\d+)" height="(\d+)"[^>]*>', logo_span, doc)
pcss = "\n".join(f'.{c} {{ --img: url("data:image/webp;base64,{b64(g + "/" + s + ".webp")}"); }} /* {n} */'
                 for c, (g, s, n) in sorted(used_logos.items(), key=lambda kv: kv[1][0] != "partners"))
doc = doc.replace("@@PARTNER_CSS@@", f"""<!-- ===== GAMBAR: LOGO PARTNER (.pl-*), KLIEN (.cl-*), FOTO & SCREENSHOT PRODUK (.md-*) — sengaja di akhir <body> agar tidak menahan tampilan awal (SEO/LCP) =====
     Setiap logo = satu baris class. Ganti isi url(...) untuk memperbarui logo
     (bisa juga url('logo/veeam.png') bila file disimpan terpisah). -->
<style id="partner-logos">
{pcss}
</style>""")
used = sorted(set(re.findall(r"#i-([a-z0-9-]+)", doc)) & set(B.ICONS))
sprite = ('<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>'
          + "".join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{B.ICONS[k]}</symbol>' for k in used)
          + "".join(defs.values()) + "</defs></svg>")
logogram = (B.ROOT / "assets" / "logogram.svg").read_text().replace('xmlns="http://www.w3.org/2000/svg" ', '')
loader_html = f"""<!-- ===== LAYAR TRANSISI (muncul singkat saat pindah halaman) ===== -->
<div class="route-loader" id="route-loader" aria-hidden="true">
  <div class="rl-grid"></div>
  <div class="rl-core">
    <svg class="rl-orbit" viewBox="0 0 200 200">
      <circle class="rl-track" cx="100" cy="100" r="92"/>
      <circle class="rl-arc" cx="100" cy="100" r="92"/>
      <circle class="rl-arc rl-arc--in" cx="100" cy="100" r="80"/>
      <g class="rl-nodes"><circle cx="100" cy="8" r="3.2"/><circle cx="192" cy="100" r="2.4"/><circle cx="35" cy="165" r="2.4"/></g>
    </svg>
    {logogram.replace('<svg ', '<svg class="rl-logo" ', 1)}
  </div>
  <div class="rl-caption"><span class="rl-prompt">&gt;_</span> memuat <span class="rl-path">/</span><span class="rl-caret"></span></div>
  <div class="rl-bar"><i></i></div>
</div>"""
doc = doc.replace("@@LOADER@@", loader_html)
doc = doc.replace("@@SPRITE@@", sprite)
OUT.write_text(doc)
print("icons used:", len(used), "of", len(B.ICONS), "| partner logos:", len(used_logos))
print("wrote", OUT, f"{len(doc)/1024:.0f} KB", "dupes renamed:", sorted(dupes))
