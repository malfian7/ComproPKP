# Deploy: GitHub → Hosting cPanel

Panduan ini agar **website dan SuperAdmin berfungsi penuh**: login admin, simpan & publikasikan konten, unggah gambar, dan form kontak masuk ke Kotak Masuk.

```
Laptop ──git push──▶ GitHub (repo PRIVATE) ──Update from Remote──▶ cPanel ──Deploy──▶ public_html
                                                                                 └─ PHP menjalankan /admin/
```

> **Kenapa tidak cukup GitHub Pages?** GitHub Pages hanya menyajikan file statis, tanpa PHP. Website tetap tampil, tetapi SuperAdmin hanya berjalan dalam *mode demo* (tidak bisa menyimpan ke server). Untuk SuperAdmin sungguhan dibutuhkan hosting dengan **PHP 7.4+** (cPanel umumnya sudah ada). Database tidak diperlukan.

---

## 1. Siapkan repository GitHub (sekali saja)

1. Di GitHub klik **New repository** → nama mis. `pkp-website` → pilih **Private** → **Create repository**.
   Repo harus *private*: berisi alamat email penerima form dan kode panel admin.
2. Masukkan isi folder ini (yang berisi `index.html`, `admin/`, `_source/`, `.gitignore`, `.cpanel.yml`, `deploy.sh`) ke repo.

   **Lewat Git (disarankan)** — buka terminal di folder ini:
   ```bash
   git init
   git add .
   git commit -m "Website company profile PKP + SuperAdmin"
   git branch -M main
   git remote add origin git@github.com:USERNAME/pkp-website.git
   git push -u origin main
   ```
   **Lewat browser** — *Add file → Upload files*, drag **isi** folder (bukan foldernya). File tersembunyi (`.gitignore`, `.cpanel.yml`, `.htaccess`) wajib ikut; di Mac tekan `Cmd + Shift + .` agar terlihat.

3. Cek di GitHub: folder `admin/data/` hanya berisi `.htaccess` dan `index.html`. `.gitignore` menjaga agar akun admin, pesan pengunjung, draf, dan cadangan **tidak pernah** masuk repo.

## 2. Hubungkan cPanel ke repo private (sekali saja)

cPanel perlu izin baca ke repo private. Pakai **Deploy key** (hanya-baca, khusus repo ini):

1. cPanel → **SSH Access** → **Manage SSH Keys** → **Generate a New Key**. Kosongkan passphrase → **Generate Key**.
2. Di daftar *Public Keys* klik **Manage** → **Authorize**. Lalu **View/Download** dan salin isi public key (diawali `ssh-rsa` / `ssh-ed25519`).
3. GitHub → repo → **Settings → Deploy keys → Add deploy key**. Judul: `cPanel PKP`, tempel key, **jangan** centang *Allow write access* → **Add key**.

> Hosting memblokir SSH ke luar (port 22)? Gunakan cara HTTPS: buat *fine-grained personal access token* di GitHub (akses **Contents: Read-only** untuk repo ini saja), lalu pakai URL `https://TOKEN@github.com/USERNAME/pkp-website.git` pada langkah 3.

## 3. Clone repo di cPanel (sekali saja)

1. cPanel → **Git™ Version Control** → **Create**.
2. Aktifkan **Clone a Repository**, isi:
   - **Clone URL:** `git@github.com:USERNAME/pkp-website.git`
   - **Repository Path:** `/home/USER_CPANEL/repositories/pkp-website` (**jangan** `public_html` — repo berisi file yang tidak boleh publik)
   - **Repository Name:** `pkp-website`
3. Klik **Create**. Jika muncul pertanyaan *host key* GitHub, setujui.

## 4. Atur tujuan deploy (sekali saja)

Buka file `.cpanel.yml` (di laptop), ganti `NAMA_USER_CPANEL` dengan username cPanel Anda (terlihat di pojok kanan atas cPanel atau di path *Home Directory*):

```yaml
- export DEPLOYPATH=/home/pkpcoid/public_html/
```

Website di subdomain/addon domain? Arahkan ke folder dokumennya, mis. `/home/pkpcoid/pkp.co.id/`.
Commit & push perubahan ini, lalu lanjut ke langkah 5.

## 5. Deploy pertama

1. cPanel → **Git™ Version Control** → **Manage** pada repo `pkp-website` → tab **Pull or Deploy**.
2. Klik **Update from Remote** (mengambil commit terbaru dari GitHub).
3. Klik **Deploy HEAD Commit**. `deploy.sh` menyalin website ke `public_html` dan menyiapkan folder yang perlu ditulis PHP (`admin/data/`, `assets/img/uploads/`).
4. Buka `https://www.pkp.co.id/` — website harus tampil.

> Tombol *Deploy* tidak aktif? Biasanya karena `.cpanel.yml` tidak ada di root repo, atau ada perubahan yang belum di-commit di repo cPanel.

## 6. Aktifkan SuperAdmin

1. Pastikan PHP ≥ 7.4: cPanel → **MultiPHP Manager** (atau *Select PHP Version*) untuk domain tersebut.
2. Aktifkan SSL: cPanel → **SSL/TLS Status** → **Run AutoSSL**. Setelah aktif, buka `public_html/.htaccess` lewat File Manager dan hapus tanda `#` pada 3 baris "Paksa HTTPS" (atau ubah di repo lalu deploy).
3. Buka `https://www.pkp.co.id/admin/` → muncul **Buat akun SuperAdmin** (hanya muncul sekali, saat belum ada akun). Isi nama, email, kata sandi minimal 10 karakter. **Lakukan segera setelah deploy** agar tidak didahului orang lain.
4. Klik **Publikasikan** sekali. Tampilan website tidak berubah, tetapi sejak itu halaman disusun dari data SuperAdmin.

**Cek cepat fungsi berjalan**

| Uji | Hasil yang benar |
| --- | --- |
| Ubah judul hero di menu Beranda → Simpan → Publikasikan | Beranda di browser (refresh) menampilkan judul baru |
| Unggah logo di Partner & Klien | File muncul di `public_html/assets/img/uploads/` |
| Kirim form di halaman Kontak | Pesan muncul di **Kotak Masuk** + email ke penerima (kiriman pertama FormSubmit meminta klik *Activate* di email) |
| Buka `https://www.pkp.co.id/admin/data/users.php` | Halaman kosong / 404 (data terlindungi) |

Gagal menyimpan atau publikasi? Pastikan izin folder `public_html`, `admin/data`, dan `assets/img` = **755** (File Manager → klik kanan → *Change Permissions*).

---

## Update selanjutnya

**Konten** (teks, produk, logo, artikel, kontak, lowongan) → cukup lewat **SuperAdmin**, tidak perlu GitHub.

**Kode / desain** (CSS, JS, file admin, struktur halaman):
1. Ubah di laptop → `git commit` → `git push`.
2. cPanel → Git™ Version Control → Manage → **Update from Remote** → **Deploy HEAD Commit**.

Yang **tidak pernah** disentuh deploy: akun admin, pesan Kotak Masuk, draf, cadangan, gambar unggahan, dan halaman artikel `blog-*.html` buatan SuperAdmin.

### Aturan penting: halaman HTML setelah SuperAdmin aktif

Setelah **Publikasikan** pertama, halaman `*.html` dan `sitemap.xml` di server adalah milik SuperAdmin — deploy **tidak menimpanya**, supaya konten yang diedit lewat admin tidak kembali ke versi lama di repo. Perubahan pada `assets/` dan `admin/` tetap ikut ter-deploy.

Jika Anda mengubah **struktur/desain halaman** (file di `_source/pages/`) dan ingin halaman di server ikut diperbarui:

1. Unduh `public_html/admin/data/published/content.php` dari File Manager, simpan ke folder yang sama di laptop (`admin/data/published/content.php` — tidak ikut Git).
2. Jalankan `python3 _source/build.py`. Konten dari SuperAdmin dipertahankan, desain baru diterapkan.
3. Buat file kosong `.deploy-pages` di root repo, commit & push, lalu **Update from Remote** → **Deploy HEAD Commit**.
4. Hapus lagi `.deploy-pages`, commit & push (agar deploy berikutnya kembali melindungi halaman).

> Selama langkah 1–3, jangan klik **Publikasikan** di SuperAdmin agar data yang Anda unduh tetap yang terbaru.

---

## Opsi lain

- **Tanpa Git di cPanel:** unggah `pkp-website-hosting.zip` lewat File Manager → Extract di `public_html`, lalu lanjut langkah 6. Untuk update berikutnya jangan menimpa folder `admin/data/` dan `assets/img/uploads/`.
- **Deploy otomatis saat push** (tanpa klik di cPanel) bisa ditambahkan nanti dengan GitHub Actions + FTP/SSH; aturan pengecualian di `deploy.sh` perlu ikut diterapkan.
