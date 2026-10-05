# Website Company Profile — PT. Prawathiya Karsa Pradiptha (PKP)

Website statis multi-halaman (HTML + CSS + JavaScript murni). Tidak perlu Node, PHP, database, atau proses build — cukup upload semua isi folder ini ke hosting.

## Isi folder

```
index.html            Beranda
tentang.html          Tentang Kami, Visi & Misi, Core Value, ISO
produk.html           Produk, aplikasi mobile, BeeZap, Call Center, E-KYC
layanan.html          Layanan & solusi per industri
partner.html          Partner dan klien
karir.html            Karir (tombol Lamar → karir.pkp.co.id)
training.html         Training (card → training.pkp.co.id)
blog.html             Media & Informasi
blog-detail.html      Template detail artikel
kontak.html           Form kontak + peta
404.html              Halaman "tidak ditemukan"
assets/css/style.min.css  Semua tampilan (versi minify)
assets/js/main.min.js     Semua interaksi + pengaturan email form kontak (versi minify)
assets/img/           Logo, favicon, gambar produk, logo partner & klien, gambar share (og-image.jpg)
robots.txt            Izin crawler mesin pencari
sitemap.xml           Daftar halaman untuk Google Search Console
site.webmanifest      Info ikon untuk perangkat mobile
.htaccess             Pengaturan hosting Apache/cPanel (cache, kompresi, halaman 404)
.nojekyll             Agar GitHub Pages menyajikan file apa adanya
```

> `.htaccess` dan `.nojekyll` adalah file tersembunyi. Pastikan ikut ter-upload (di Mac tekan `Cmd + Shift + .` untuk menampilkannya).

## Cara upload

### A. GitHub Pages (gratis)
1. Buat repository baru di GitHub, mis. `pkp-website`.
2. Klik **Add file → Upload files**, lalu drag **seluruh isi** folder ini (bukan foldernya) sehingga `index.html` berada di root repository. Klik **Commit changes**.
3. Buka **Settings → Pages**. Pada *Source* pilih **Deploy from a branch**, branch `main`, folder `/ (root)`, lalu **Save**.
4. Tunggu 1–2 menit. Website tampil di `https://<username>.github.io/pkp-website/`.
5. Domain sendiri (mis. www.pkp.co.id): isi kolom **Custom domain** di halaman yang sama, lalu buat record DNS `CNAME www → <username>.github.io` di pengelola domain. Centang **Enforce HTTPS** setelah aktif.

### B. Hosting cPanel / Apache
1. Buka **File Manager → public_html**.
2. Upload file ZIP, klik kanan → **Extract**. Pastikan `index.html` langsung berada di dalam `public_html` (bukan di subfolder).
3. Setelah SSL aktif, buka `.htaccess` dan hapus tanda `#` pada 3 baris "Paksa HTTPS".

### C. Netlify / Vercel / Cloudflare Pages
Drag folder ini ke halaman deploy (Netlify: app.netlify.com/drop), atau hubungkan ke repository GitHub. Tidak ada build command; output directory = root.

## Wajib dicek sebelum go-live

1. **Email form kontak** — saat ini dikirim ke `alfian.ma18@gmail.com` lewat FormSubmit. Ubah `PKP_CONTACT` di `main.js` (paket source) lalu jalankan `build.py`, atau cari-ganti alamat email itu langsung di `assets/js/main.min.js`. Kiriman pertama dari website yang sudah online akan memicu email aktivasi ke alamat tersebut — klik *Activate* sekali, setelah itu pesan masuk normal. (Form tidak bisa dikirim kalau file dibuka langsung dari komputer / `file://`.)
2. **Domain** — canonical URL, `sitemap.xml`, `robots.txt`, dan gambar share memakai `https://www.pkp.co.id`. Jika domain berbeda, cari-ganti `https://www.pkp.co.id` di semua file `.html`, `sitemap.xml`, dan `robots.txt`.
3. **Foto dummy** — foto di halaman Karir, Training, dan Blog masih dari Unsplash (cari `images.unsplash.com`). Ganti dengan foto asli, simpan di `assets/img/`.
4. **Konten contoh** — lowongan kerja, jadwal training, dan isi artikel blog masih placeholder. Semeru ERP masih berupa mockup.

## SEO yang sudah diterapkan
- Judul (`<title>`) unik per halaman (≤60 karakter) dan meta description tepat 145 karakter, berisi kata kunci produk/layanan. H2 Beranda memuat kata kunci produk (software core finance, collection, HRIS, layanan IT).
- Canonical URL, Open Graph, Twitter Card, dan gambar share 1200×630.
- Structured data (JSON-LD): Organization + WebSite di Beranda, BreadcrumbList di setiap halaman, BlogPosting di detail artikel, ContactPage di Hubungi Kami.
- `sitemap.xml`, `robots.txt`, halaman 404 `noindex`, satu `<h1>` per halaman dengan urutan heading yang benar, alt text pada gambar.
- Performa (Core Web Vitals): font dimuat tanpa memblokir render, gambar utama dimuat prioritas, gambar lain lazy-load, CLS 0. Skor Lighthouse lokal: SEO 100, Performance 99–100.
- Layar transisi logogram PKP saat pindah halaman tidak memengaruhi SEO: tautan tetap `<a href>` biasa, kunjungan pertama dari Google tidak menampilkannya, dan halaman tujuan di-*prefetch* saat kursor menyentuh menu.
- Untuk mengubah judul/description: edit `<title>`, `<meta name="description">`, dan `og:title`/`og:description` di bagian `<head>` tiap halaman.

## Sertifikat ISO
Sertifikat asli ada di `assets/img/media/cert-iso-9001.webp` (tampilan) dan `cert-iso-9001-full.webp` (ukuran penuh, dibuka di tab baru). Sertifikat yang terpasang (SSI-QMS-081) **berlaku sampai 30 Agustus 2026** — saat sertifikat perpanjangan terbit, timpa kedua file tersebut dan perbarui nomor sertifikat di `tentang.html` (blok `.iso-meta`).

## Google Analytics 4
Tag GA4 `G-JJ6KE69XJN` sudah terpasang di `<head>` semua halaman (tepat setelah `<head>`, sesuai anjuran Google). Pengiriman form kontak yang berhasil dicatat sebagai event **`generate_lead`** — tandai sebagai *Key event* di GA4 (Admin → Events) agar terhitung sebagai konversi. Klik link keluar, scroll, dan page view tercatat otomatis lewat *Enhanced measurement*.

## Google Search Console (verifikasi)
1. Pastikan website sudah online di domainnya, dan `robots.txt` + `sitemap.xml` ada di root (bisa dibuka di `https://www.pkp.co.id/robots.txt` dan `/sitemap.xml`).
2. Buka search.google.com/search-console → **Add property** → pilih **URL prefix** → isi `https://www.pkp.co.id/`.
3. Pilih salah satu metode verifikasi:
   - **Google Analytics** (paling mudah): karena tag GA4 sudah ada di `<head>`, cukup klik *Verify* — syaratnya akun Google yang dipakai punya akses *Editor* di properti GA4 tersebut.
   - **HTML tag**: salin kode di `content="..."`, isi `GSC_VERIFICATION` di `_source/build.py`, lalu jalankan `python3 _source/build.py` dan upload ulang `index.html`. Atau tempel tag `<meta name="google-site-verification" ...>` langsung di `<head>` `index.html`.
   - **Domain (DNS)**: tambahkan record TXT dari Google di pengelola domain pkp.co.id — mencakup semua subdomain (karir., training.).
4. Setelah terverifikasi: menu **Sitemaps** → kirim `sitemap.xml`. Lalu **URL Inspection** → *Request indexing* untuk Beranda.

## Setelah online
- Cek tampilan share di WhatsApp/LinkedIn (memakai `assets/img/og-image.jpg`).
- **Konten blog**: Google lebih cepat menaikkan situs yang rutin terbit artikel asli. Target realistis 2–4 artikel per bulan (studi kasus klien, tips produk, regulasi OJK/keuangan, rilis fitur). Duplikat `blog-detail.html` untuk tiap artikel (mis. `blog-core-finance-modular.html`), ganti judul, description, isi, dan tanggal, lalu tambahkan URL-nya ke `sitemap.xml`. Artikel contoh yang ada sekarang sebaiknya diganti/dihapus sebelum go-live.

## Mengedit
**CSS & JS sudah di-minify** (`style.min.css` 85→72 KB, `main.min.js` 26→19 KB; yang dibuang hanya spasi & komentar, tampilan dan animasi identik). File yang mudah dibaca (`style.css`, `main.js`) ada di paket source `pkp-company-profile.zip`. Alur edit: ubah `style.css`/`main.js` → jalankan `python3 _source/build.py` (perlu sekali `pip install rcssmin rjsmin`) → file `.min` dan nomor versi `?v=` di HTML diperbarui otomatis, sehingga pengunjung langsung mendapat versi terbaru.

Semua halaman bisa diedit langsung di file `.html` masing-masing. Header, menu, dan footer ada di setiap halaman, jadi perubahan menu perlu diterapkan di semua file (atau gunakan generator di paket source `pkp-company-profile.zip` → `_source/build.py`).
