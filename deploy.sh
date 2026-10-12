#!/bin/bash
# =====================================================================
#  Salin website dari repo (clone cPanel) ke folder publik hosting.
#  Dipanggil oleh .cpanel.yml. Bisa juga manual:  bash deploy.sh /home/user/public_html/
#
#  Aman untuk SuperAdmin:
#   - data admin (akun, pesan, draf, cadangan), gambar unggahan, dan halaman artikel
#     di server TIDAK pernah dihapus atau ditimpa;
#   - setelah SuperAdmin pernah "Publikasikan", halaman HTML & sitemap di server
#     dianggap milik SuperAdmin dan tidak ditimpa deploy. Untuk memaksa (mis. setelah
#     perubahan desain halaman), buat file kosong ".deploy-pages" di repo — lihat DEPLOY.md.
# =====================================================================
set -euo pipefail
DEST="${1:?Tulis folder tujuan, mis. bash deploy.sh /home/user/public_html/}"
DEST="${DEST%/}/"
SRC="$(cd "$(dirname "$0")" && pwd)/"
mkdir -p "$DEST"

FILTERS=(
  --exclude='.git/' --exclude='.gitignore' --exclude='.cpanel.yml' --exclude='deploy.sh'
  --exclude='DEPLOY.md' --exclude='README.md' --exclude='.deploy-pages'
  --exclude='_source/' --exclude='assets/css/style.css' --exclude='assets/js/main.js'
  --include='admin/data/.htaccess' --include='admin/data/index.html' --exclude='admin/data/*'
  --exclude='assets/img/uploads/'
)
if [ -f "${DEST}admin/data/published/content.php" ] && [ ! -f "${SRC}.deploy-pages" ]; then
  echo "SuperAdmin aktif: halaman *.html dan sitemap.xml di server dipertahankan (tidak ditimpa)."
  FILTERS+=(--exclude='/*.html' --exclude='/sitemap.xml')
fi

if command -v rsync >/dev/null 2>&1; then
  rsync -a "${FILTERS[@]}" "$SRC" "$DEST"
else
  # Cadangan bila rsync tidak tersedia: salin lewat tar dengan aturan yang sama
  EXC=(--exclude='./.git' --exclude='./.gitignore' --exclude='./.cpanel.yml' --exclude='./deploy.sh' --exclude='./DEPLOY.md'
       --exclude='./README.md' --exclude='./.deploy-pages' --exclude='./_source' --exclude='./assets/css/style.css'
       --exclude='./assets/js/main.js' --exclude='./assets/img/uploads')
  if [ -f "${DEST}admin/data/published/content.php" ] && [ ! -f "${SRC}.deploy-pages" ]; then
    EXC+=(--exclude='./*.html' --exclude='./sitemap.xml')
  fi
  (cd "$SRC" && tar -cf - --no-wildcards-match-slash "${EXC[@]}" --exclude='./admin/data/*.php' --exclude='./admin/data/backups' --exclude='./admin/data/published' .) | (cd "$DEST" && tar -xf -)
fi

# Folder yang harus bisa ditulis PHP (SuperAdmin)
mkdir -p "${DEST}admin/data" "${DEST}assets/img/uploads"
chmod 755 "${DEST}admin/data" "${DEST}assets/img" "${DEST}assets/img/uploads" 2>/dev/null || true
echo "Deploy selesai → $DEST"
