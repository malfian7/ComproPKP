# PKP SuperAdmin — panduan singkat

SuperAdmin adalah panel pengelola konten website company profile PKP. Alamatnya: `https://www.pkp.co.id/admin/`.

## Apa yang bisa diatur

| Menu | Mengubah bagian website |
| --- | --- |
| Dasbor | Skor kesehatan konten, perubahan yang menunggu publikasi, pesan terbaru, aktivitas |
| Beranda | Hero (judul, kalimat pembuka, tombol, angka), susunan portofolio, tab produk unggulan, kartu layanan (Beranda selalu menampilkan 3 artikel terbaru) |
| Produk | 6 produk software, Messaging & Call Center, judul bagian Mobile Application & E-KYC (urutan, gambar, fitur, tombol, ringkasan di Beranda) |
| Aplikasi Mobile | Kartu aplikasi di halaman Produk |
| Layanan | Kartu layanan, kelompok Infrastructure & Services, solusi per industri |
| Partner & Klien | Logo partner dan klien (unggah, urutkan dengan seret, sembunyikan), angka ringkasan kemitraan |
| Blog | Artikel (editor teks, sampul, kategori, SEO per artikel). Artikel tayang yang punya isi lengkap mendapat halaman sendiri `blog-<judul>.html` dan masuk `sitemap.xml` |
| Karir | Lowongan dan divisi |
| Training | Program pelatihan dan jadwal public class |
| Tentang & ISO | Sertifikat ISO (nomor, masa berlaku, gambar) dan angka perusahaan |
| Kontak & Sosial | Telepon, email, Social Media Instagram, alamat, jam operasional, peta, email penerima form |
| Kotak Masuk | Pesan dari form Hubungi Kami (status baru/dibalas/arsip, catatan internal) |
| Pengguna | Admin lain dengan peran SuperAdmin atau Editor |
| Riwayat & Cadangan | Log aktivitas dan pemulihan konten dari cadangan otomatis |

Judul & deskripsi SEO tiap halaman serta GA4/Search Console tidak diatur dari SuperAdmin; nilainya mengikuti `_source/build.py` dan file halaman.

## Cara kerja: Simpan → Publikasikan

1. Setiap perubahan disimpan sebagai **draf** (pengunjung belum melihatnya). Panel kanan editor menampilkan pratinjau langsung dengan tampilan asli website.
2. Penanda emas di kanan atas menunjukkan jumlah bagian yang belum tayang.
3. Klik **Publikasikan** → tinjau daftar halaman yang berubah (bisa dipratinjau satu per satu) → **Publikasikan sekarang**. SuperAdmin menyusun ulang halaman HTML yang terdampak dan menimpanya di server. Versi lama dicadangkan otomatis.

Halaman tetap berupa HTML statis — tidak ada database dan tidak ada pemuatan konten lewat JavaScript, sehingga kecepatan dan SEO website tidak berubah.

## Pemasangan di hosting

**Syarat:** hosting dengan PHP 7.4 atau lebih baru (cPanel umumnya sudah ada). Tidak perlu database.

1. Upload seluruh isi paket website (termasuk folder `admin/`) ke `public_html`.
2. Pastikan folder ini bisa ditulis oleh PHP (izin 755 atau 775):
   - folder utama website (agar halaman bisa diperbarui),
   - `admin/data/`,
   - `assets/img/` (untuk unggahan gambar ke `assets/img/uploads/`).
3. Buka `https://domain-anda/admin/`. Kunjungan pertama meminta Anda **membuat akun SuperAdmin** (minimal 10 karakter kata sandi).
4. Lakukan **Publikasikan** pertama kali. Isi halaman akan disusun dari data SuperAdmin (tampilannya sama dengan sebelumnya).

**Keamanan bawaan:** kata sandi di-hash (bcrypt), sesi HttpOnly + SameSite, token CSRF di setiap perubahan, batas percobaan login, dan file data `admin/data/*.php` tidak dapat dibuka dari browser (dilindungi `.htaccess` dan baris pelindung PHP — tetap aman di server Nginx). `admin/` juga dikecualikan di `robots.txt` dan bertanda `noindex`. Disarankan memakai HTTPS.

## Mode demo (tanpa PHP)

Jika PHP tidak tersedia — misalnya di GitHub Pages atau saat dibuka dari komputer — SuperAdmin otomatis berjalan dalam **mode demo**:
- Masuk dengan `superadmin@pkp.co.id` / `demo12345`.
- Perubahan tersimpan di browser itu saja.
- **Publikasikan** menghasilkan paket ZIP berisi halaman yang diperbarui; unggah isinya ke hosting secara manual.
- Kotak Masuk berisi pesan contoh.

Agar pratinjau dan publikasi berfungsi di mode demo, buka lewat server lokal (mis. `python3 -m http.server` di folder website), bukan dengan klik dua kali file.

## Form kontak & Kotak Masuk

Pesan dari form Hubungi Kami dikirim ke email penerima (lewat FormSubmit) **dan** disimpan ke Kotak Masuk SuperAdmin. Jika pengiriman email gagal tetapi pesan sudah masuk Kotak Masuk, pengunjung tetap melihat konfirmasi terkirim.

## Untuk developer

- `assets/cms-render.js` — renderer bersama yang mengubah data menjadi markup website (dipakai untuk pratinjau dan publikasi). Region yang dikelola ditandai atribut `data-cms="…"` di halaman.
- `api/index.php` — API JSON (login, konten, publikasi, unggah, pesan, pengguna, riwayat).
- `data/` — `content.php` (draf), `published/` (versi tayang + cadangan halaman), `backups/`, `users.php`, `messages.php`, `audit.php`.
- `seed-content.json` — data awal yang diekstrak dari website (`_source/cms/extract_seed.py`).
- `_source/build.py` tetap boleh dijalankan untuk perubahan desain/struktur: bila SuperAdmin sudah pernah mempublikasikan, isi region `data-cms`, judul & deskripsi SEO, serta pengaturan GA/Search Console dipertahankan dari halaman yang sudah tayang.
