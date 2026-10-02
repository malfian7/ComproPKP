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
assets/css/style.css  Semua tampilan
assets/js/main.js     Semua interaksi + pengaturan email form kontak
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

1. **Email form kontak** — saat ini dikirim ke `alfian.ma18@gmail.com` lewat FormSubmit. Ubah di baris paling atas `assets/js/main.js` (`PKP_CONTACT`). Kiriman pertama dari website yang sudah online akan memicu email aktivasi ke alamat tersebut — klik *Activate* sekali, setelah itu pesan masuk normal. (Form tidak bisa dikirim kalau file dibuka langsung dari komputer / `file://`.)
2. **Domain** — canonical URL, `sitemap.xml`, `robots.txt`, dan gambar share memakai `https://www.pkp.co.id`. Jika domain berbeda, cari-ganti `https://www.pkp.co.id` di semua file `.html`, `sitemap.xml`, dan `robots.txt`.
3. **Foto dummy** — foto di halaman Karir, Training, dan Blog masih dari Unsplash (cari `images.unsplash.com`). Ganti dengan foto asli, simpan di `assets/img/`.
4. **Konten contoh** — lowongan kerja, jadwal training, isi artikel blog, dan sertifikat ISO (`tentang.html`, blok `.cert`) masih placeholder. Semeru ERP masih berupa mockup.

## SEO yang sudah diterapkan
- Judul (`<title>`) dan meta description unik per halaman, berisi kata kunci produk/layanan (50–60 dan ±150 karakter).
- Canonical URL, Open Graph, Twitter Card, dan gambar share 1200×630.
- Structured data (JSON-LD): Organization + WebSite di Beranda, BreadcrumbList di setiap halaman, BlogPosting di detail artikel, ContactPage di Hubungi Kami.
- `sitemap.xml`, `robots.txt`, halaman 404 `noindex`, satu `<h1>` per halaman dengan urutan heading yang benar, alt text pada gambar.
- Performa (Core Web Vitals): font dimuat tanpa memblokir render, gambar utama dimuat prioritas, gambar lain lazy-load, CLS 0. Skor Lighthouse lokal: SEO 100, Performance 99–100.
- Layar transisi logogram PKP saat pindah halaman tidak memengaruhi SEO: tautan tetap `<a href>` biasa, kunjungan pertama dari Google tidak menampilkannya, dan halaman tujuan di-*prefetch* saat kursor menyentuh menu.
- Untuk mengubah judul/description: edit `<title>`, `<meta name="description">`, dan `og:title`/`og:description` di bagian `<head>` tiap halaman.

## Setelah online
- Daftarkan domain di **Google Search Console**, lalu kirim `https://www.pkp.co.id/sitemap.xml`.
- Cek tampilan share di WhatsApp/LinkedIn (memakai `assets/img/og-image.jpg`).

## Mengedit
Semua halaman bisa diedit langsung di file `.html` masing-masing. Header, menu, dan footer ada di setiap halaman, jadi perubahan menu perlu diterapkan di semua file (atau gunakan generator di paket source `pkp-company-profile.zip` → `_source/build.py`).
