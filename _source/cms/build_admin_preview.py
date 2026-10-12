#!/usr/bin/env python3
"""Buat SATU file HTML pratinjau SuperAdmin (hanya tampilan, tanpa menyimpan apa pun).
Semua kode admin, data konten awal, halaman website, CSS, ikon, dan gambar ditanam di dalam file,
sehingga bisa dibuka langsung (klik dua kali) untuk meninjau desain & konten.

    python3 _source/cms/build_admin_preview.py [folder-website] [file-keluaran]
"""
import base64, json, mimetypes, pathlib, re, sys

SITE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else pathlib.Path(__file__).resolve().parent.parent.parent
OUT = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else SITE / "pkp-superadmin-preview.html"
ADMIN = SITE / "admin"

def data_uri(path):
    mt = mimetypes.guess_type(str(path))[0] or ("image/webp" if path.suffix == ".webp" else "application/octet-stream")
    return f"data:{mt};base64,{base64.b64encode(path.read_bytes()).decode()}"

import re as _re
js_safe = lambda s: _re.sub(r"</(script)", r"<\\/\1", s, flags=_re.I).replace("<!--", "<\\!--")   # aman di dalam <script>

# ---------------------------------------------------------------- halaman & aset website
PAGES = ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "blog-detail", "kontak", "404"]
pages = {p: (SITE / f"{p}.html").read_text() for p in PAGES}
seed = json.loads((ADMIN / "seed-content.json").read_text())
css_href = re.search(r'<link rel="stylesheet" href="(assets/css/[^"?]+)', pages["index"]).group(1)
css = (SITE / css_href).read_text()
css = css.replace('url("../img/logo-pkp.webp")', f'url("{data_uri(SITE / "assets/img/logo-pkp.webp")}")')
sprite = re.search(r'<svg width="0" height="0"[\s\S]*?</svg>', pages["index"]).group(0)

paths = set()
for h in pages.values():
    paths |= set(re.findall(r'(assets/img/[^"\'\s)?]+)', h))
paths |= set(re.findall(r'(assets/img/[^"\'\s)?]+)', json.dumps(seed)))
paths.add("assets/img/favicon.png")
assets = {p: data_uri(SITE / p) for p in sorted(paths) if (SITE / p).exists()}

# ---------------------------------------------------------------- kode admin
css_admin = (ADMIN / "assets/admin.css").read_text()
scripts = [(ADMIN / "assets" / f).read_text() for f in ["cms-render.js", "core.js", "ui.js", "views-content.js", "views-system.js", "app.js"]]
logogram = data_uri(ADMIN / "assets/logogram.svg")
login_src = (ADMIN / "login.html").read_text()
auth_side = re.search(r'<aside class="auth-side"[\s\S]*?</aside>', login_src).group(0).replace('src="assets/logogram.svg"', f'src="{logogram}"')

site_blob = {"css": css, "sprite": sprite, "pages": pages, "assets": assets}

STANDALONE = r"""
window.PKP_STANDALONE = true;
window.PKP_BANNER = '<b style="display:inline">Versi tampilan saja.</b> Untuk meninjau desain &amp; konten SuperAdmin: semua menu, daftar, dan formulir bisa dibuka (termasuk pratinjau langsung), tetapi tidak ada yang disimpan atau dipublikasikan. <a href="#" data-show-login>Lihat halaman login</a>';
(function () {
  var A = PKPAdmin, mem = {}, MSG = "Versi tampilan: perubahan tidak disimpan. Gunakan SuperAdmin di hosting untuk mengubah konten website.";
  var authSide = document.getElementById("auth-side-tpl").innerHTML;   /* diambil sebelum kerangka admin mengganti isi body */
  var cp = function (v) { return v == null ? v : JSON.parse(JSON.stringify(v)); };
  /* penyimpanan di memori saja — tidak menyentuh localStorage */
  A.demo.get = function (k, d) { return Object.prototype.hasOwnProperty.call(mem, k) ? cp(mem[k]) : d; };
  A.demo.set = function (k, v) { mem[k] = cp(v); return true; };
  mem.session = "u-demo";
  /* versi "tayang" dibuat sedikit berbeda agar penanda perubahan belum dipublikasikan ikut terlihat */
  var pub = cp(window.PKP_SEED); pub.apps = pub.apps.slice().reverse();
  mem.published = pub;
  mem.pubmeta = { at: new Date(Date.now() - 3 * 864e5).toISOString(), user: "Admin Demo", version: 0 };
  A.api.base = "data:text/plain,";       /* jangan menghubungi server mana pun */
  var call = A.api.call, RO = /^(content|publish|upload|users\/save|users\/delete|account|backups\/restore|messages\/delete)$/;
  A.api.call = function (route, data) {
    if (RO.test(route) && data && (route !== "content" || data.content)) return Promise.reject(new Error(MSG));
    return call.apply(this, arguments);
  };
  A.buildPublish = function () { return Promise.reject(new Error(MSG)); };
  A.siteRoot = function () { return "https://www.pkp.co.id/"; };
  function showLogin() {
    var ic = A.ui.icon;
    document.title = "Masuk — PKP SuperAdmin (versi tampilan)";
    document.body.innerHTML = '<main class="auth"><section class="auth-form"><div class="auth-card"><div class="brand"><img src="__LOGO__" alt=""><div><b>PKP SuperAdmin</b><small>PT. Prawathiya Karsa Pradiptha</small></div></div>' +
      '<h1>Masuk</h1><p>Kelola konten website company profile PKP.</p>' +
      '<form class="form" novalidate><div class="field"><label for="email">Email</label><input class="input" id="email" type="email" value="superadmin@pkp.co.id"></div>' +
      '<div class="field"><label for="password">Kata sandi</label><div class="pw"><input class="input" id="password" type="password" value="demo12345"><button type="button" aria-label="Tampilkan kata sandi">' + ic("eye", "icon--sm") + '</button></div></div>' +
      '<button type="submit" class="btn btn--primary">Masuk</button></form><p class="hint" style="margin-top:24px">Versi tampilan: tombol Masuk kembali ke dasbor. Kunjungan pertama di hosting menampilkan formulir “Buat akun SuperAdmin”.</p></div></section>' +
      authSide + "</main>";
    document.querySelectorAll("[data-ic]").forEach(function (s) { s.innerHTML = ic(s.dataset.ic); });
    var pw = document.querySelector(".pw button"), inp = document.getElementById("password");
    pw.onclick = function () { inp.type = inp.type === "password" ? "text" : "password"; };
    document.querySelector("form").onsubmit = function (e) { e.preventDefault(); location.hash = "#/"; location.reload(); };
  }
  window.PKP_ONLOGOUT = showLogin;
  document.addEventListener("click", function (e) { var l = e.target.closest("[data-show-login]"); if (l) { e.preventDefault(); showLogin(); } });
})();
PKPAdmin.boot();
""".replace("__LOGO__", logogram)

html = f"""<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>PKP SuperAdmin — versi tampilan</title>
<link rel="icon" href="{logogram}">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:opsz,wght@14..32,400..800&display=swap">
<!--
  PKP SuperAdmin — FILE PRATINJAU (hanya tampilan)
  Dibuat dari folder admin/ oleh _source/cms/build_admin_preview.py.
  Tidak ada data yang disimpan; untuk mengelola website sungguhan gunakan admin/ di hosting ber-PHP.
-->
<style>
{css_admin.replace('url("', 'url("').replace("assets/logogram.svg", logogram)}
</style>
</head>
<body>
<div class="boot" role="status" aria-label="Memuat SuperAdmin"><img src="{logogram}" alt=""></div>
<template id="auth-side-tpl">{auth_side}</template>
<script>window.PKP_SEED = {js_safe(json.dumps(seed, ensure_ascii=False))};
window.PKP_SITE = {js_safe(json.dumps(site_blob, ensure_ascii=False))};</script>
""" + "\n".join(f"<script>\n{js_safe(s)}\n</script>" for s in scripts) + f"""
<script>{js_safe(STANDALONE)}</script>
</body>
</html>
"""
# logogram dipakai di kerangka admin lewat src="assets/logogram.svg"
html = html.replace('src="assets/logogram.svg"', f'src="{logogram}"')
OUT.write_text(html)
print("tulis", OUT, f"{len(html) / 1024:.0f} KB", f"({len(assets)} gambar tertanam)")
