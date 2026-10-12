<?php
/**
 * PKP SuperAdmin — API (PHP 7.4+ / 8.x, tanpa database).
 * Data disimpan sebagai file JSON di admin/data/ (dilindungi .htaccess).
 *
 *   GET  ?r=status              status sesi + token CSRF
 *   POST ?r=setup               buat SuperAdmin pertama (hanya jika belum ada user)
 *   POST ?r=login | logout
 *   GET  ?r=content             draf konten        POST ?r=content   simpan draf
 *   POST ?r=publish             tulis halaman HTML hasil render ke root website
 *   POST ?r=upload              unggah gambar (webp/png/jpg/gif, maks 5 MB)
 *   POST ?r=messages/submit     (publik) pesan dari form Hubungi Kami
 *   GET  ?r=messages            POST ?r=messages/update | messages/delete
 *   GET  ?r=users               POST ?r=users/save | users/delete | account
 *   GET  ?r=audit               GET  ?r=backups    POST ?r=backups/restore
 */
declare(strict_types=1);

const MAX_UPLOAD = 5 * 1024 * 1024;
const MAX_PAGE = 3 * 1024 * 1024;
const KEEP_BACKUPS = 40;

$ADMIN = dirname(__DIR__);
$SITE = dirname($ADMIN);
$DATA = $ADMIN . '/data';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

session_name('pkp_admin');
session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'httponly' => true, 'samesite' => 'Strict',
                           'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')]);
session_start();

/* ------------------------------------------------------------------ util */
function out($data, int $code = 200): void { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); exit; }
function fail(string $msg, int $code = 400, array $extra = []): void { out(['ok' => false, 'error' => $msg] + $extra, $code); }
function body(): array {
    static $b = null;
    if ($b === null) { $raw = file_get_contents('php://input') ?: ''; $b = json_decode($raw, true); if (!is_array($b)) $b = $_POST ?: []; }
    return $b;
}
function ensure_data(): void {
    global $DATA;
    foreach ([$DATA, "$DATA/backups", "$DATA/published"] as $d) if (!is_dir($d)) @mkdir($d, 0775, true);
    if (!file_exists("$DATA/.htaccess")) file_put_contents("$DATA/.htaccess", "Require all denied\nDeny from all\n");
    if (!file_exists("$DATA/index.html")) file_put_contents("$DATA/index.html", '');
}
function jread(string $file, $default) {
    if (!is_file($file)) return $default;
    $fp = fopen($file, 'r'); flock($fp, LOCK_SH); $s = (string)stream_get_contents($fp); flock($fp, LOCK_UN); fclose($fp);
    if (strncmp($s, '<?php', 5) === 0) $s = (string)substr($s, strpos($s, "\n") + 1);   // baris pelindung
    $v = json_decode($s, true); return $v === null ? $default : $v;
}
function jwrite(string $file, $data): void {
    $tmp = $file . '.tmp' . bin2hex(random_bytes(3));
    // Diawali baris PHP "exit" agar file tidak bisa dibaca langsung lewat browser, walau .htaccess tidak aktif (mis. Nginx)
    file_put_contents($tmp, "<?php http_response_code(404); exit; ?>\n" . json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT), LOCK_EX);
    rename($tmp, $file);
}
function now(): string { return date('c'); }
function client_ip(): string { return $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0'; }
function clean_text($s, int $max = 2000): string { return mb_substr(trim(strip_tags((string)$s)), 0, $max); }

function users(): array { global $DATA; return jread("$DATA/users.php", []); }
function save_users(array $u): void { global $DATA; jwrite("$DATA/users.php", array_values($u)); }
function public_user(array $u): array { return ['id' => $u['id'], 'name' => $u['name'], 'email' => $u['email'], 'role' => $u['role'],
                                              'lastLogin' => $u['lastLogin'] ?? null, 'createdAt' => $u['createdAt'] ?? null, 'active' => $u['active'] ?? true]; }
function me(): ?array {
    if (empty($_SESSION['uid'])) return null;
    foreach (users() as $u) if ($u['id'] === $_SESSION['uid'] && ($u['active'] ?? true)) return $u;
    return null;
}
function require_user(?string $role = null): array {
    $u = me();
    if (!$u) fail('Sesi berakhir. Silakan masuk kembali.', 401);
    if ($role && $u['role'] !== $role) fail('Hanya SuperAdmin yang dapat melakukan tindakan ini.', 403);
    return $u;
}
function csrf(): void {
    $t = $_SERVER['HTTP_X_CSRF'] ?? '';
    if (empty($_SESSION['csrf']) || !hash_equals($_SESSION['csrf'], $t)) fail('Token keamanan tidak valid. Muat ulang halaman.', 419);
}
function audit(string $action, string $detail = ''): void {
    global $DATA; $u = me();
    $log = jread("$DATA/audit.php", []);
    array_unshift($log, ['at' => now(), 'user' => $u ? $u['name'] : 'Sistem', 'action' => $action, 'detail' => $detail]);
    jwrite("$DATA/audit.php", array_slice($log, 0, 300));
}
function rate_limit(string $key, int $max, int $window): void {
    global $DATA; $f = "$DATA/ratelimit.php"; $all = jread($f, []); $t = time(); $k = $key . ':' . client_ip();
    $hits = array_values(array_filter($all[$k] ?? [], fn($x) => $x > $t - $window));
    if (count($hits) >= $max) fail('Terlalu banyak percobaan. Coba lagi dalam beberapa menit.', 429);
    $hits[] = $t; $all[$k] = $hits;
    foreach ($all as $kk => $v) if (!array_filter($v, fn($x) => $x > $t - 86400)) unset($all[$kk]);
    jwrite($f, $all);
}
function content_file(): string { global $DATA; return "$DATA/content.php"; }
function load_content(): array {
    global $ADMIN;
    $c = jread(content_file(), null);
    if ($c === null) $c = jread("$ADMIN/seed-content.json", []);
    return $c;
}
function backup_content(array $c, string $reason): void {
    global $DATA;
    $id = date('Ymd-His') . '-' . bin2hex(random_bytes(2));
    jwrite("$DATA/backups/$id.php", ['id' => $id, 'at' => now(), 'reason' => $reason, 'user' => (me()['name'] ?? ''), 'content' => $c]);
    $files = glob("$DATA/backups/*.php"); rsort($files);
    foreach (array_slice($files, KEEP_BACKUPS) as $old) @unlink($old);
}

ensure_data();
$r = $_GET['r'] ?? 'status';
$method = $_SERVER['REQUEST_METHOD'];
if ($method === 'POST' && !in_array($r, ['login', 'setup', 'messages/submit'], true)) csrf();

/* ------------------------------------------------------------------ rute */
switch ($r) {

case 'status':
    if (empty($_SESSION['csrf'])) $_SESSION['csrf'] = bin2hex(random_bytes(24));
    $u = me();
    out(['ok' => true, 'mode' => 'server', 'needsSetup' => count(users()) === 0, 'user' => $u ? public_user($u) : null,
         'csrf' => $_SESSION['csrf'], 'php' => PHP_VERSION]);

case 'setup':
    if (count(users()) > 0) fail('SuperAdmin sudah dibuat.', 409);
    $b = body();
    $email = strtolower(trim((string)($b['email'] ?? ''))); $name = clean_text($b['name'] ?? '', 80); $pw = (string)($b['password'] ?? '');
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Format email belum benar.');
    if ($name === '') fail('Nama wajib diisi.');
    if (strlen($pw) < 10) fail('Kata sandi minimal 10 karakter.');
    $u = ['id' => 'u' . bin2hex(random_bytes(4)), 'name' => $name, 'email' => $email, 'role' => 'superadmin',
          'hash' => password_hash($pw, PASSWORD_DEFAULT), 'createdAt' => now(), 'lastLogin' => now(), 'active' => true];
    save_users([$u]);
    session_regenerate_id(true); $_SESSION['uid'] = $u['id']; $_SESSION['csrf'] = bin2hex(random_bytes(24));
    audit('Membuat akun SuperAdmin pertama', $email);
    out(['ok' => true, 'user' => public_user($u), 'csrf' => $_SESSION['csrf']]);

case 'login':
    rate_limit('login', 8, 900);
    $b = body(); $email = strtolower(trim((string)($b['email'] ?? ''))); $pw = (string)($b['password'] ?? '');
    $all = users();
    foreach ($all as $i => $u) {
        if ($u['email'] === $email && ($u['active'] ?? true) && password_verify($pw, $u['hash'])) {
            session_regenerate_id(true); $_SESSION['uid'] = $u['id']; $_SESSION['csrf'] = bin2hex(random_bytes(24));
            $all[$i]['lastLogin'] = now(); save_users($all);
            audit('Masuk', $email);
            out(['ok' => true, 'user' => public_user($all[$i]), 'csrf' => $_SESSION['csrf']]);
        }
    }
    usleep(400000);
    fail('Email atau kata sandi salah.', 401);

case 'logout':
    audit('Keluar'); $_SESSION = []; session_destroy(); out(['ok' => true]);

case 'content':
    $u = require_user();
    if ($method === 'GET') {
        $pub = jread("$DATA/published/meta.php", []);
        out(['ok' => true, 'content' => load_content(), 'published' => jread("$DATA/published/content.php", null),
             'publishedAt' => $pub['at'] ?? null, 'publishedBy' => $pub['user'] ?? null,
             'publishedVersion' => $pub['version'] ?? null]);
    }
    $b = body(); $new = $b['content'] ?? null;
    if (!is_array($new)) fail('Data konten tidak valid.');
    $cur = load_content();
    if (isset($b['baseVersion']) && (int)($cur['version'] ?? 0) !== (int)$b['baseVersion'])
        fail('Konten sudah diubah admin lain sejak Anda membukanya. Muat ulang untuk melihat versi terbaru.', 409, ['latest' => $cur]);
    if ($u['role'] !== 'superadmin' && json_encode($new['settings'] ?? null) !== json_encode($cur['settings'] ?? null))
        fail('Hanya SuperAdmin yang dapat mengubah Pengaturan & Integrasi.', 403);
    backup_content($cur, 'Sebelum disimpan: ' . clean_text($b['note'] ?? 'perubahan konten', 120));
    $new['version'] = (int)($cur['version'] ?? 0) + 1; $new['updatedAt'] = now(); $new['updatedBy'] = $u['name'];
    jwrite(content_file(), $new);
    audit('Menyimpan draf', clean_text($b['note'] ?? '', 160));
    out(['ok' => true, 'version' => $new['version'], 'updatedAt' => $new['updatedAt']]);

case 'publish':
    $u = require_user();
    $b = body(); $files = $b['files'] ?? []; $delete = $b['delete'] ?? [];
    if (!is_array($files) || !$files) fail('Tidak ada halaman untuk dipublikasikan.');
    $written = [];
    $stamp = date('Ymd-His');
    @mkdir("$DATA/published/pages-$stamp", 0775, true);
    foreach ($files as $name => $html) {
        $name = (string)$name; $html = (string)$html;
        if (!preg_match('/^[a-z0-9][a-z0-9-]*\.html$/', $name) && $name !== 'sitemap.xml') fail("Nama file tidak diizinkan: $name");
        if (strlen($html) > MAX_PAGE) fail("Ukuran $name terlalu besar.");
        if ($name !== 'sitemap.xml' && stripos(substr($html, 0, 200), '<!doctype html') === false) fail("Isi $name bukan dokumen HTML lengkap.");
        if ($name !== 'sitemap.xml' && preg_match('/<script[^>]*>[^<]*(document\.cookie|eval\()/i', $html)) fail("Isi $name mengandung skrip yang tidak diizinkan.");
        $path = "$SITE/$name";
        if (is_file($path)) @copy($path, "$DATA/published/pages-$stamp/$name");
        $tmp = "$path.tmp" . bin2hex(random_bytes(3));
        if (file_put_contents($tmp, $html, LOCK_EX) === false || !rename($tmp, $path)) fail("Gagal menulis $name. Periksa izin folder website (chmod 755/775).", 500);
        $written[] = $name;
    }
    $removed = [];
    foreach ((array)$delete as $name) {
        if (preg_match('/^blog-[a-z0-9-]+\.html$/', (string)$name) && $name !== 'blog-detail.html' && is_file("$SITE/$name")) {
            @copy("$SITE/$name", "$DATA/published/pages-$stamp/$name"); @unlink("$SITE/$name"); $removed[] = $name;
        }
    }
    foreach (array_slice(array_reverse(glob("$DATA/published/pages-*", GLOB_ONLYDIR)), 10) as $old) {
        array_map('unlink', glob("$old/*") ?: []); @rmdir($old);
    }
    $content = load_content();
    jwrite("$DATA/published/content.php", $content);
    jwrite("$DATA/published/meta.php", ['at' => now(), 'user' => $u['name'], 'version' => $content['version'] ?? 0, 'files' => $written]);
    audit('Mempublikasikan website', count($written) . ' file' . ($removed ? ', hapus ' . implode(', ', $removed) : ''));
    out(['ok' => true, 'written' => $written, 'removed' => $removed, 'publishedAt' => now()]);

case 'upload':
    require_user();
    if (empty($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) fail('File tidak terunggah. Ukuran maksimal ' . (MAX_UPLOAD / 1048576) . ' MB.');
    $f = $_FILES['file'];
    if ($f['size'] > MAX_UPLOAD) fail('Ukuran file melebihi 5 MB.');
    $info = @getimagesize($f['tmp_name']);
    $ext = [IMAGETYPE_WEBP => 'webp', IMAGETYPE_PNG => 'png', IMAGETYPE_JPEG => 'jpg', IMAGETYPE_GIF => 'gif'][$info[2] ?? 0] ?? null;
    if (!$info || !$ext) fail('Format gambar harus WebP, PNG, JPG, atau GIF.');
    $folder = preg_replace('/[^a-z]/', '', strtolower((string)($_POST['folder'] ?? 'media'))) ?: 'media';
    if (!in_array($folder, ['media', 'partners', 'clients', 'blog', 'apps', 'training', 'iso'], true)) $folder = 'media';
    $base = preg_replace('/[^a-z0-9]+/', '-', strtolower(pathinfo((string)($_POST['name'] ?? $f['name']), PATHINFO_FILENAME)));
    $base = trim(substr($base, 0, 50), '-') ?: 'gambar';
    $dir = "$SITE/assets/img/uploads/$folder";
    if (!is_dir($dir) && !@mkdir($dir, 0775, true)) fail('Folder unggahan tidak dapat dibuat. Periksa izin folder assets/img.', 500);
    $name = "$base-" . bin2hex(random_bytes(3)) . ".$ext";
    if (!move_uploaded_file($f['tmp_name'], "$dir/$name")) fail('Gagal menyimpan file.', 500);
    audit('Mengunggah gambar', "uploads/$folder/$name");
    out(['ok' => true, 'src' => "assets/img/uploads/$folder/$name", 'w' => $info[0], 'h' => $info[1], 'bytes' => $f['size']]);

case 'messages/submit':
    if ($method !== 'POST') fail('Metode tidak diizinkan.', 405);
    rate_limit('msg', 6, 3600);
    $b = body();
    if (!empty($b['_honey'])) out(['ok' => true]);
    $email = trim((string)($b['email'] ?? ''));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Email tidak valid.');
    $msg = ['id' => 'm' . date('ymdHis') . bin2hex(random_bytes(2)), 'at' => now(), 'status' => 'new',
            'name' => clean_text($b['name'] ?? '', 120), 'company' => clean_text($b['company'] ?? '', 160), 'email' => $email,
            'phone' => clean_text($b['phone'] ?? '', 40), 'topic' => clean_text($b['topic'] ?? '', 80), 'message' => clean_text($b['message'] ?? '', 5000),
            'page' => clean_text($b['page'] ?? '', 200), 'ip' => hash('sha256', client_ip() . 'pkp'), 'notes' => ''];
    if ($msg['name'] === '' || $msg['message'] === '') fail('Nama dan pesan wajib diisi.');
    $all = jread("$DATA/messages.php", []); array_unshift($all, $msg); jwrite("$DATA/messages.php", array_slice($all, 0, 5000));
    out(['ok' => true]);

case 'messages':
    require_user(); out(['ok' => true, 'messages' => jread("$DATA/messages.php", [])]);

case 'messages/update':
    require_user(); $b = body(); $all = jread("$DATA/messages.php", []); $found = false;
    foreach ($all as &$m) if ($m['id'] === ($b['id'] ?? '')) {
        if (isset($b['status']) && in_array($b['status'], ['new', 'read', 'replied', 'archived'], true)) $m['status'] = $b['status'];
        if (isset($b['notes'])) $m['notes'] = clean_text($b['notes'], 2000);
        $m['updatedAt'] = now(); $found = true;
    }
    unset($m);
    if (!$found) fail('Pesan tidak ditemukan.', 404);
    jwrite("$DATA/messages.php", $all); out(['ok' => true]);

case 'messages/delete':
    require_user(); $b = body(); $ids = (array)($b['ids'] ?? []);
    $all = array_values(array_filter(jread("$DATA/messages.php", []), fn($m) => !in_array($m['id'], $ids, true)));
    jwrite("$DATA/messages.php", $all); audit('Menghapus pesan', count($ids) . ' pesan'); out(['ok' => true]);

case 'users':
    require_user('superadmin'); out(['ok' => true, 'users' => array_map('public_user', users())]);

case 'users/save':
    $me = require_user('superadmin'); $b = body(); $all = users();
    $email = strtolower(trim((string)($b['email'] ?? ''))); $name = clean_text($b['name'] ?? '', 80);
    $role = in_array($b['role'] ?? '', ['superadmin', 'editor'], true) ? $b['role'] : 'editor';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) fail('Format email belum benar.');
    if ($name === '') fail('Nama wajib diisi.');
    foreach ($all as $u) if ($u['email'] === $email && $u['id'] !== ($b['id'] ?? '')) fail('Email sudah dipakai admin lain.', 409);
    $pw = (string)($b['password'] ?? '');
    if ($pw !== '' && strlen($pw) < 10) fail('Kata sandi minimal 10 karakter.');
    if (!empty($b['id'])) {
        $hit = false;
        foreach ($all as &$u) if ($u['id'] === $b['id']) {
            if ($u['id'] === $me['id'] && $role !== 'superadmin') fail('Anda tidak dapat menurunkan peran akun sendiri.');
            $u['name'] = $name; $u['email'] = $email; $u['role'] = $role; $u['active'] = (bool)($b['active'] ?? true);
            if ($u['id'] === $me['id']) $u['active'] = true;
            if ($pw !== '') $u['hash'] = password_hash($pw, PASSWORD_DEFAULT);
            $hit = true;
        }
        unset($u);
        if (!$hit) fail('Admin tidak ditemukan.', 404);
        audit('Mengubah admin', $email);
    } else {
        if ($pw === '') fail('Kata sandi awal wajib diisi untuk admin baru.');
        $all[] = ['id' => 'u' . bin2hex(random_bytes(4)), 'name' => $name, 'email' => $email, 'role' => $role,
                  'hash' => password_hash($pw, PASSWORD_DEFAULT), 'createdAt' => now(), 'lastLogin' => null, 'active' => true];
        audit('Menambah admin', "$email ($role)");
    }
    save_users($all); out(['ok' => true, 'users' => array_map('public_user', users())]);

case 'users/delete':
    $me = require_user('superadmin'); $b = body(); $id = (string)($b['id'] ?? '');
    if ($id === $me['id']) fail('Anda tidak dapat menghapus akun sendiri.');
    $all = users(); $left = array_values(array_filter($all, fn($u) => $u['id'] !== $id));
    if (count(array_filter($left, fn($u) => $u['role'] === 'superadmin')) === 0) fail('Minimal harus ada satu SuperAdmin.');
    save_users($left); audit('Menghapus admin', $id); out(['ok' => true, 'users' => array_map('public_user', $left)]);

case 'account':
    $me = require_user(); $b = body(); $all = users();
    foreach ($all as &$u) if ($u['id'] === $me['id']) {
        if (!password_verify((string)($b['current'] ?? ''), $u['hash'])) fail('Kata sandi saat ini salah.');
        if (strlen((string)($b['password'] ?? '')) < 10) fail('Kata sandi baru minimal 10 karakter.');
        $u['hash'] = password_hash((string)$b['password'], PASSWORD_DEFAULT);
        if (!empty($b['name'])) $u['name'] = clean_text($b['name'], 80);
    }
    unset($u);
    save_users($all); audit('Mengganti kata sandi'); out(['ok' => true]);

case 'audit':
    require_user(); out(['ok' => true, 'audit' => array_slice(jread("$DATA/audit.php", []), 0, 100)]);

case 'backups':
    require_user();
    $list = [];
    foreach (array_slice(array_reverse(glob("$DATA/backups/*.php") ?: []), 0, KEEP_BACKUPS) as $f) {
        $j = jread($f, []); $list[] = ['id' => $j['id'] ?? basename($f, '.php'), 'at' => $j['at'] ?? '', 'reason' => $j['reason'] ?? '', 'user' => $j['user'] ?? ''];
    }
    out(['ok' => true, 'backups' => $list]);

case 'backups/restore':
    require_user('superadmin'); $b = body(); $id = preg_replace('/[^0-9a-z-]/', '', (string)($b['id'] ?? ''));
    $j = jread("$DATA/backups/$id.php", null);
    if (!$j) fail('Cadangan tidak ditemukan.', 404);
    $cur = load_content(); backup_content($cur, 'Sebelum memulihkan cadangan ' . $id);
    $c = $j['content']; $c['version'] = (int)($cur['version'] ?? 0) + 1; $c['updatedAt'] = now();
    jwrite(content_file(), $c); audit('Memulihkan cadangan', $id);
    out(['ok' => true, 'content' => $c]);

default:
    fail('Rute tidak dikenal.', 404);
}
