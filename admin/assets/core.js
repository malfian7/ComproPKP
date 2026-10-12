/* PKP SuperAdmin — inti: API (server PHP / mode demo), penyimpanan state,
   utilitas, pengolahan gambar, sanitasi HTML, dan penyusun file publikasi. */
(function (global) {
  "use strict";
  var A = global.PKPAdmin = global.PKPAdmin || {};

  /* ---------------------------------------------------------------- utilitas */
  var esc = function (s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); };
  var clone = function (o) { return o == null ? o : JSON.parse(JSON.stringify(o)); };
  var uid = function (p) { return (p || "id") + Date.now().toString(36).slice(-4) + Math.random().toString(36).slice(2, 6); };
  var slugify = function (s) {
    return String(s || "").toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " dan ")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70) || "item";
  };
  var debounce = function (fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; };
  var same = function (a, b) { return JSON.stringify(a) === JSON.stringify(b); };
  var initials = function (n) { return String(n || "?").trim().split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase(); };
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var fmtDate = function (iso, withTime) {
    if (!iso) return "—";
    var d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    if (isNaN(d)) return iso;
    var s = d.getDate() + " " + MONTHS[d.getMonth()] + " " + d.getFullYear();
    return withTime ? s + ", " + String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0") : s;
  };
  var ago = function (iso) {
    if (!iso) return "belum pernah";
    var s = (Date.now() - new Date(iso).getTime()) / 1000;
    if (s < 60) return "baru saja";
    if (s < 3600) return Math.floor(s / 60) + " menit lalu";
    if (s < 86400) return Math.floor(s / 3600) + " jam lalu";
    if (s < 86400 * 7) return Math.floor(s / 86400) + " hari lalu";
    return fmtDate(iso);
  };
  var bytes = function (n) { return n > 1048576 ? (n / 1048576).toFixed(1).replace(".", ",") + " MB" : Math.max(1, Math.round(n / 1024)) + " KB"; };
  var today = function () { var d = new Date(); return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0"); };
  A.u = { esc: esc, clone: clone, uid: uid, slugify: slugify, debounce: debounce, same: same, initials: initials, fmtDate: fmtDate, ago: ago, bytes: bytes, today: today };

  /* ---------------------------------------------------------------- sanitasi HTML */
  var RICH = { P: 1, H2: 1, H3: 1, STRONG: 1, B: 1, EM: 1, I: 1, U: 1, UL: 1, OL: 1, LI: 1, BLOCKQUOTE: 1, A: 1, BR: 1 };
  var INLINE = { STRONG: 1, B: 1, EM: 1, I: 1, A: 1, BR: 1 };
  function sanitize(html, inline) {
    var allow = inline ? INLINE : RICH;
    var tpl = document.createElement("template"); tpl.innerHTML = String(html || "");
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) return;
        if (n.nodeType !== 1) { n.remove(); return; }
        walk(n);
        var tag = n.tagName === "DIV" && !inline ? "P" : n.tagName;
        if (!allow[tag]) { while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove(); return; }
        if (tag !== n.tagName) { var p = document.createElement(tag); while (n.firstChild) p.appendChild(n.firstChild); n.replaceWith(p); n = p; }
        var href = n.getAttribute && n.getAttribute("href");
        Array.prototype.slice.call(n.attributes).forEach(function (a) { n.removeAttribute(a.name); });
        if (tag === "A") {
          if (href && /^(https?:|mailto:|tel:|[a-z0-9-]+\.html|#)/i.test(href.trim())) {
            n.setAttribute("href", href.trim());
            if (/^https?:/i.test(href) && href.indexOf(location.host) < 0) { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener"); }
          } else { while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n); n.remove(); }
        }
      });
    })(tpl.content);
    return tpl.innerHTML.replace(/<p><\/p>/g, "").replace(/ /g, " ").trim();
  }
  A.sanitize = sanitize;

  /* ---------------------------------------------------------------- API */
  var DEMO_KEY = "pkp.demo.v1.";
  var demo = {
    get: function (k, d) { try { var v = localStorage.getItem(DEMO_KEY + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(DEMO_KEY + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  };
  var api = A.api = {
    mode: null, csrf: "", base: "api/index.php",
    detect: function () {
      return fetch(api.base + "?r=status", { credentials: "same-origin", cache: "no-store" }).then(function (r) {
        return r.headers.get("content-type") && r.headers.get("content-type").indexOf("json") >= 0 ? r.json() : null;
      }).then(function (j) {
        if (j && j.ok && j.mode === "server") { api.mode = "server"; api.csrf = j.csrf; return j; }
        throw new Error("no server");
      }).catch(function () { api.mode = "demo"; return demoStatus(); });
    },
    call: function (route, data, method) {
      if (api.mode === "demo") return demoCall(route, data || {});
      var opt = { method: method || (data ? "POST" : "GET"), credentials: "same-origin", headers: { "X-CSRF": api.csrf }, cache: "no-store" };
      if (data instanceof FormData) opt.body = data;
      else if (data) { opt.headers["Content-Type"] = "application/json"; opt.body = JSON.stringify(data); }
      return fetch(api.base + "?r=" + route, opt).then(function (r) {
        return r.json().catch(function () { return { ok: false, error: "Server mengirim respons yang tidak dikenali (" + r.status + ")." }; }).then(function (j) {
          if (j && j.csrf) api.csrf = j.csrf;
          if (r.status === 401 && route !== "login") { location.href = "login.html?expired=1"; }
          if (!j.ok) { var e = new Error(j.error || "Terjadi kesalahan."); e.status = r.status; e.data = j; throw e; }
          return j;
        });
      }, function () { throw new Error("Tidak dapat terhubung ke server. Periksa koneksi internet Anda."); });
    }
  };

  /* --- mode demo: semua data di browser ini (localStorage) --- */
  var DEMO_USER = { id: "u-demo", name: "Admin Demo", email: "superadmin@pkp.co.id", role: "superadmin", createdAt: "2026-10-01T09:00:00", active: true };
  function seedDemo() {
    if (demo.get("users")) return;
    demo.set("users", [DEMO_USER, { id: "u-demo2", name: "Rina Editor", email: "editor@pkp.co.id", role: "editor", createdAt: "2026-10-02T10:00:00", lastLogin: "2026-10-04T15:20:00", active: true }]);
    var d = function (h) { return new Date(Date.now() - h * 3600e3).toISOString(); };
    demo.set("messages", [
      { id: "m1", at: d(2), status: "new", name: "Andi Pratama", company: "PT Sinar Multifinance", email: "andi.pratama@sinarmf.co.id", phone: "0812-3456-7801", topic: "Produk", message: "Selamat siang, kami tertarik dengan Beyond Fincore+ untuk 12 cabang. Apakah bisa dijadwalkan demo minggu depan?", page: "kontak.html", notes: "" },
      { id: "m2", at: d(20), status: "new", name: "Sari Wulandari", company: "Koperasi Mitra Usaha", email: "sari@kopmitra.id", phone: "0857-1122-3344", topic: "Produk", message: "Mohon info harga dan modul Mobile Koperasi Syariah, serta apakah bisa integrasi dengan core banking kami.", page: "kontak.html", notes: "" },
      { id: "m3", at: d(52), status: "read", name: "Budi Santoso", company: "Klinik Sehat Bersama", email: "budi@kliniksehat.id", phone: "", topic: "Produk", message: "Apakah KlinikCare sudah bridging BPJS dan SATUSEHAT? Kami punya 3 klinik di Bekasi.", page: "kontak.html", notes: "Dijadwalkan call Kamis" },
      { id: "m4", at: d(140), status: "replied", name: "Maya Kusuma", company: "PT Logistik Nusantara", email: "maya.k@logistiknusa.co.id", phone: "021-555-0192", topic: "Layanan IT", message: "Butuh tenaga IT outsource 3 orang (QA dan DBA) untuk 6 bulan.", page: "kontak.html", notes: "" },
      { id: "m5", at: d(220), status: "archived", name: "Rizky Ramadhan", company: "", email: "rizky.r@gmail.com", phone: "", topic: "Karir", message: "Saya ingin melamar posisi Mobile Developer, CV terlampir via email.", page: "kontak.html", notes: "" }
    ]);
    demo.set("audit", [{ at: d(1), user: "Admin Demo", action: "Masuk", detail: "superadmin@pkp.co.id" }]);
  }
  function demoStatus() {
    seedDemo();
    var s = demo.get("session", null);
    return Promise.resolve({ ok: true, mode: "demo", needsSetup: false, user: s ? (demo.get("users", []).filter(function (u) { return u.id === s; })[0] || null) : null });
  }
  function demoAudit(action, detail) {
    var me = demo.get("users", []).filter(function (u) { return u.id === demo.get("session"); })[0];
    var log = demo.get("audit", []); log.unshift({ at: new Date().toISOString(), user: me ? me.name : "Sistem", action: action, detail: detail || "" });
    demo.set("audit", log.slice(0, 200));
  }
  function demoSeedContent() {
    if (global.PKP_SEED) return Promise.resolve(clone(global.PKP_SEED));
    return fetch("seed-content.json", { cache: "no-store" }).then(function (r) { return r.json(); }).catch(function () {
      /* dibuka langsung dari file (file://): fetch diblokir browser, muat versi skrip */
      return new Promise(function (res, rej) {
        var s = document.createElement("script"); s.src = "seed-content.js";
        s.onload = function () { res(clone(global.PKP_SEED)); }; s.onerror = function () { rej(new Error("Data awal tidak ditemukan.")); };
        document.head.appendChild(s);
      });
    });
  }
  function demoCall(route, b) {
    var ok = function (x) { return Promise.resolve(Object.assign({ ok: true }, x || {})); };
    var no = function (m) { return Promise.reject(new Error(m)); };
    var users = demo.get("users", []);
    switch (route) {
      case "login":
        var u = users.filter(function (x) { return x.email === String(b.email || "").toLowerCase().trim(); })[0];
        if (!u || String(b.password || "") !== "demo12345") return no("Email atau kata sandi salah. Mode demo: gunakan kata sandi demo12345.");
        demo.set("session", u.id); u.lastLogin = new Date().toISOString(); demo.set("users", users); demoAudit("Masuk", u.email);
        return ok({ user: u });
      case "logout": demoAudit("Keluar"); demo.set("session", null); return ok();
      case "content":
        if (b && b.content) {
          var cur = demo.get("content", null);
          var hist = demo.get("backups", []); if (cur) { hist.unshift({ id: "b" + Date.now(), at: new Date().toISOString(), reason: "Sebelum disimpan: " + (b.note || "perubahan konten"), user: "Admin Demo", content: cur }); }
          b.content.version = ((cur && cur.version) || 0) + 1; b.content.updatedAt = new Date().toISOString();
          if (!demo.set("content", b.content)) return no("Penyimpanan browser penuh. Di mode demo, gambar besar memakan ruang — hapus beberapa gambar unggahan atau gunakan versi server.");
          demo.set("backups", hist.slice(0, 8)); demoAudit("Menyimpan draf", b.note || "");
          return ok({ version: b.content.version, updatedAt: b.content.updatedAt });
        }
        var c = demo.get("content", null), meta = demo.get("pubmeta", {});
        return (c ? Promise.resolve(c) : demoSeedContent()).then(function (cc) {
          return ok({ content: cc, published: demo.get("published", null), publishedAt: meta.at || null, publishedBy: meta.user || null, publishedVersion: meta.version || null });
        });
      case "publish":
        var cc2 = demo.get("content", null);
        demo.set("published", cc2); demo.set("pubmeta", { at: new Date().toISOString(), user: "Admin Demo", version: cc2 && cc2.version });
        demoAudit("Mempublikasikan website (paket unduhan)", Object.keys(b.files || {}).length + " file");
        return ok({ written: Object.keys(b.files || {}), removed: b.delete || [], publishedAt: new Date().toISOString() });
      case "messages": return ok({ messages: demo.get("messages", []) });
      case "messages/update":
        var ms = demo.get("messages", []); ms.forEach(function (m) { if (m.id === b.id) { if (b.status) m.status = b.status; if (b.notes != null) m.notes = b.notes; } }); demo.set("messages", ms); return ok();
      case "messages/delete":
        demo.set("messages", demo.get("messages", []).filter(function (m) { return (b.ids || []).indexOf(m.id) < 0; })); return ok();
      case "users": return ok({ users: users });
      case "users/save":
        if (!b.name || !/^\S+@\S+\.\S+$/.test(b.email || "")) return no("Nama dan email wajib diisi dengan benar.");
        if (users.some(function (x) { return x.email === b.email.toLowerCase() && x.id !== b.id; })) return no("Email sudah dipakai admin lain.");
        if (b.id) users.forEach(function (x) { if (x.id === b.id) { x.name = b.name; x.email = b.email.toLowerCase(); x.role = b.role; x.active = b.active !== false; } });
        else { if (!b.password || b.password.length < 10) return no("Kata sandi awal minimal 10 karakter."); users.push({ id: uid("u"), name: b.name, email: b.email.toLowerCase(), role: b.role || "editor", createdAt: new Date().toISOString(), active: true }); }
        demo.set("users", users); demoAudit(b.id ? "Mengubah admin" : "Menambah admin", b.email); return ok({ users: users });
      case "users/delete":
        if (b.id === demo.get("session")) return no("Anda tidak dapat menghapus akun sendiri.");
        users = users.filter(function (x) { return x.id !== b.id; }); demo.set("users", users); demoAudit("Menghapus admin", b.id); return ok({ users: users });
      case "account": return no("Di mode demo, kata sandi tetap demo12345.");
      case "audit": return ok({ audit: demo.get("audit", []) });
      case "backups": return ok({ backups: demo.get("backups", []).map(function (x) { return { id: x.id, at: x.at, reason: x.reason, user: x.user }; }) });
      case "backups/restore":
        var bk = demo.get("backups", []).filter(function (x) { return x.id === b.id; })[0];
        if (!bk) return no("Cadangan tidak ditemukan.");
        demo.set("content", bk.content); demoAudit("Memulihkan cadangan", b.id); return ok({ content: bk.content });
      default: return no("Fitur ini membutuhkan server PHP.");
    }
  }
  A.demo = demo;

  /* ---------------------------------------------------------------- state */
  var listeners = [];
  var S = A.store = {
    user: null, content: null, published: null, publishedAt: null, publishedBy: null, messages: [], saving: false,
    on: function (fn) { listeners.push(fn); },
    emit: function (what) { listeners.forEach(function (fn) { try { fn(what); } catch (e) { console.error(e); } }); },
    load: function () {
      return api.call("content").then(function (j) {
        S.content = j.content; S.published = j.published || null; S.publishedAt = j.publishedAt; S.publishedBy = j.publishedBy;
        if (!S.published && api.mode === "server") S.published = null;
        S.emit("content");
      });
    },
    /* simpan draf ke server; mutator mengubah salinan konten */
    commit: function (mutator, note) {
      var next = clone(S.content);
      mutator(next);
      var base = S.content.version || 0;
      S.saving = true; S.emit("saving");
      return api.call("content", { content: next, baseVersion: base, note: note || "" }).then(function (j) {
        next.version = j.version; next.updatedAt = j.updatedAt; S.content = next; S.saving = false; S.emit("content"); return next;
      }, function (e) {
        S.saving = false; S.emit("saving");
        if (e.status === 409 && e.data && e.data.latest) { S.content = e.data.latest; S.emit("content"); }
        throw e;
      });
    },
    loadMessages: function () { return api.call("messages").then(function (j) { S.messages = j.messages || []; S.emit("messages"); return S.messages; }); }
  };

  /* ---------------------------------------------------------------- perubahan & halaman terdampak */
  var ALL = ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "blog-detail", "kontak", "404"];
  var LABEL = { index: "Beranda", tentang: "Tentang Kami", produk: "Produk", layanan: "Layanan", partner: "Partner & Klien", karir: "Karir", training: "Training",
    blog: "Blog", "blog-detail": "Template artikel", kontak: "Hubungi Kami", "404": "Halaman 404" };
  var SECTION = {
    hero: ["Beranda — hero & statistik", ["index"]], home: ["Beranda — susunan konten", ["index"]],
    products: ["Produk", ["index", "produk"]], apps: ["Aplikasi mobile", ["produk"]],
    services: ["Layanan", ["index", "layanan"]], infrastructure: ["Infrastructure & Services", ["layanan"]], industries: ["Solusi per industri", ["layanan"]],
    partners: ["Partner", ["index", "partner"]], clients: ["Klien", ["index", "partner"]], stats: ["Angka statistik", ["partner", "tentang"]],
    posts: ["Artikel blog", ["index", "blog", "*posts", "sitemap"]], categories: ["Kategori blog", ["index", "blog", "*posts"]],
    jobs: ["Lowongan", ["karir"]], departments: ["Divisi karir", ["karir"]], courses: ["Program training", ["training"]], schedule: ["Jadwal training", ["training"]],
    contact: ["Kontak & sosial media", ["*all", "*posts"]], iso: ["Sertifikat ISO", ["tentang"]], settings: ["Integrasi (GA4 / Search Console)", ["*all", "*posts"]]
  };
  A.PAGE_LABEL = LABEL;
  A.changes = function () {
    var c = S.content, p = S.published, out = [];
    if (!c) return out;
    if (!p) return [{ key: "*", label: "Publikasi pertama — semua halaman disusun dari data CMS", pages: ALL.concat(["*posts", "sitemap"]) }];
    Object.keys(SECTION).forEach(function (k) { if (!same(c[k], p[k])) out.push({ key: k, label: SECTION[k][0], pages: SECTION[k][1] }); });
    Object.keys(c.seo || {}).forEach(function (k) { if (!same((c.seo || {})[k], (p.seo || {})[k])) out.push({ key: "seo." + k, label: "SEO — " + (LABEL[k] || k), pages: [k] }); });
    return out;
  };
  A.affected = function (changes) {
    var set = {}, posts = false, sitemap = false;
    changes.forEach(function (ch) { ch.pages.forEach(function (pg) {
      if (pg === "*all") ALL.forEach(function (x) { set[x] = 1; });
      else if (pg === "*posts") posts = true; else if (pg === "sitemap") sitemap = true; else set[pg] = 1;
    }); });
    return { pages: ALL.filter(function (x) { return set[x]; }), posts: posts, sitemap: sitemap };
  };
  var postFiles = function (c) {
    return (c && c.posts || []).filter(function (p) { return p.status === "published" && p.body && String(p.body).trim(); }).map(function (p) { return "blog-" + p.slug + ".html"; });
  };

  /* ---------------------------------------------------------------- susun file publikasi */
  var siteRoot = function () { return new URL("../", location.href).href; };
  A.siteRoot = siteRoot;
  var fetchPage = function (name) {
    if (global.PKP_SITE && global.PKP_SITE.pages) {   /* versi standalone: halaman website tertanam */
      var h = global.PKP_SITE.pages[name];
      return h ? Promise.resolve(h) : Promise.reject(new Error("Halaman " + name + " tidak tersedia di versi tampilan."));
    }
    return fetch(siteRoot() + name + ".html?cms=" + Date.now(), { cache: "no-store" }).then(function (r) {
      if (!r.ok) throw new Error("Halaman " + name + ".html tidak dapat dibaca (" + r.status + ").");
      return r.text();
    });
  };
  var parse = function (html) { return new DOMParser().parseFromString(html, "text/html"); };
  var serialize = function (doc) { return "<!doctype html>\n" + doc.documentElement.outerHTML + "\n"; };
  A.renderPageHtml = function (name, content) {
    return fetchPage(name).then(function (html) { var d = parse(html); PKPRender.applyPage(d, content, name); return serialize(d); });
  };
  A.buildPublish = function (content) {
    var ch = A.changes(), aff = A.affected(ch), files = {}, tasks = [];
    aff.pages.forEach(function (name) {
      tasks.push(fetchPage(name).then(function (html) { var d = parse(html); PKPRender.applyPage(d, content, name); files[name + ".html"] = serialize(d); }));
    });
    var del = [];
    if (aff.posts) {
      tasks.push(fetchPage("blog-detail").then(function (tplHtml) {
        (content.posts || []).filter(function (p) { return p.status === "published" && p.body && String(p.body).trim(); }).forEach(function (p) {
          var d = parse(tplHtml); PKPRender.applyPage(d, content, null); PKPRender.renderPost(d, content, p);
          files["blog-" + p.slug + ".html"] = serialize(d);
        });
      }));
      var now = postFiles(content);
      del = postFiles(S.published).filter(function (f) { return now.indexOf(f) < 0; });
    }
    if (aff.sitemap || aff.posts) files["sitemap.xml"] = PKPRender.sitemap(content, today());
    return Promise.all(tasks).then(function () { return { files: files, delete: del, changes: ch, affected: aff }; });
  };
  A.previewPage = function (name, content, post) {
    var p = post ? fetchPage("blog-detail").then(function (h) { var d = parse(h); PKPRender.applyPage(d, content, null); PKPRender.renderPost(d, content, post); return d; })
                 : fetchPage(name).then(function (h) { var d = parse(h); PKPRender.applyPage(d, content, name); return d; });
    return p.then(function (d) {
      A.inlineAssets(d);
      var base = d.createElement("base"); base.href = siteRoot(); d.head.insertBefore(base, d.head.firstChild);
      Array.prototype.forEach.call(d.querySelectorAll('script[src*="googletagmanager"]'), function (s) { s.remove(); });
      var bar = d.createElement("div");
      bar.setAttribute("style", "position:fixed;z-index:9999;left:50%;bottom:16px;transform:translateX(-50%);padding:8px 14px;border-radius:999px;background:#0A2C46;color:#fff;font:600 13px/1.4 system-ui;box-shadow:0 10px 30px rgba(0,0,0,.25)");
      bar.textContent = "Pratinjau SuperAdmin — belum dipublikasikan";
      d.body.appendChild(bar);
      var url = URL.createObjectURL(new Blob([serialize(d)], { type: "text/html" }));
      window.open(url, "_blank", "noopener");
      setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    });
  };

  /* ---------------------------------------------------------------- ZIP (tanpa kompresi) untuk mode demo */
  var CRC = (function () { var t = [], c, n, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  var crc32 = function (u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  A.zip = function (files) {
    var enc = new TextEncoder(), parts = [], central = [], offset = 0;
    var le = function (n, b) { var a = []; for (var i = 0; i < b; i++) a.push((n >>> (8 * i)) & 0xFF); return a; };
    Object.keys(files).forEach(function (name) {
      var data = files[name] instanceof Uint8Array ? files[name] : enc.encode(files[name]), nm = enc.encode(name), crc = crc32(data);
      var head = [].concat([0x50, 0x4b, 0x03, 0x04], le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(crc, 4), le(data.length, 4), le(data.length, 4), le(nm.length, 2), le(0, 2));
      parts.push(new Uint8Array(head), nm, data);
      central.push(new Uint8Array([].concat([0x50, 0x4b, 0x01, 0x02], le(20, 2), le(20, 2), le(0x0800, 2), le(0, 2), le(0, 2), le(0x21, 2), le(crc, 4), le(data.length, 4), le(data.length, 4),
        le(nm.length, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 2), le(0, 4), le(offset, 4))), nm);
      offset += head.length + nm.length + data.length;
    });
    var csize = central.reduce(function (s, x) { return s + x.length; }, 0), n = Object.keys(files).length;
    var end = new Uint8Array([].concat([0x50, 0x4b, 0x05, 0x06], le(0, 2), le(0, 2), le(n, 2), le(n, 2), le(csize, 4), le(offset, 4), le(0, 2)));
    return new Blob(parts.concat(central, [end]), { type: "application/zip" });
  };
  A.download = function (blob, name) {
    var a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
  };

  /* ---------------------------------------------------------------- gambar: kompres ke WebP sebelum diunggah */
  var LOGO_AREA = 4300, LOGO_MAX_W = 140, LOGO_MAX_H = 50;
  A.processImage = function (file, opt) {
    opt = opt || {};
    return new Promise(function (resolve, reject) {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) return reject(new Error("Format harus PNG, JPG, WebP, atau GIF."));
      if (file.size > 20 * 1048576) return reject(new Error("File terlalu besar (maks. 20 MB sebelum dikompres)."));
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight, cv = document.createElement("canvas"), ctx = cv.getContext("2d");
        var sx = 0, sy = 0, sw = w, sh = h, outW, outH, disp = null;
        if (opt.logo) {
          cv.width = w; cv.height = h; ctx.drawImage(img, 0, 0);
          var id = ctx.getImageData(0, 0, w, h), d = id.data, x, y, i, minX = w, minY = h, maxX = -1, maxY = -1;
          if (opt.removeWhite) for (i = 0; i < d.length; i += 4) {
            var lum = Math.min(d[i], d[i + 1], d[i + 2]);
            if (lum > 245) d[i + 3] = 0; else if (lum > 215) d[i + 3] = Math.round(d[i + 3] * (245 - lum) / 30);
          }
          for (y = 0; y < h; y++) for (x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 12) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
          ctx.putImageData(id, 0, 0);
          if (maxX >= 0) { sx = minX; sy = minY; sw = maxX - minX + 1; sh = maxY - minY + 1; }
          var src = document.createElement("canvas"); src.width = w; src.height = h; src.getContext("2d").putImageData(id, 0, 0);
          var r = sw / sh, dh = Math.sqrt(LOGO_AREA / r), dw = dh * r;
          if (dh > LOGO_MAX_H) { dh = LOGO_MAX_H; dw = dh * r; } if (dw > LOGO_MAX_W) { dw = LOGO_MAX_W; dh = dw / r; }
          disp = { w: Math.round(dw), h: Math.round(dh) };
          outW = Math.min(sw, disp.w * 2); outH = Math.round(outW / r);
          cv.width = outW; cv.height = outH; ctx = cv.getContext("2d"); ctx.imageSmoothingQuality = "high"; ctx.drawImage(src, sx, sy, sw, sh, 0, 0, outW, outH);
        } else {
          var maxW = opt.maxW || 1600, maxH = opt.maxH || 4000, k = Math.min(1, maxW / w, maxH / h);
          outW = Math.round(w * k); outH = Math.round(h * k);
          cv.width = outW; cv.height = outH; ctx.imageSmoothingQuality = "high";
          if (opt.flatten) { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, outW, outH); }
          ctx.drawImage(img, 0, 0, outW, outH);
        }
        cv.toBlob(function (blob) {
          if (!blob) return reject(new Error("Browser tidak mendukung konversi WebP."));
          resolve({ blob: blob, w: outW, h: outH, display: disp, before: file.size, after: blob.size, name: (file.name || "gambar").replace(/\.[a-z0-9]+$/i, "") });
        }, "image/webp", opt.quality || 0.85);
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error("Gambar tidak dapat dibaca.")); };
      img.src = url;
    });
  };
  A.uploadImage = function (res, folder) {
    if (api.mode === "demo") {
      return new Promise(function (resolve) { var fr = new FileReader(); fr.onload = function () { resolve({ src: fr.result, w: res.w, h: res.h }); }; fr.readAsDataURL(res.blob); });
    }
    var fd = new FormData(); fd.append("file", res.blob, slugify(res.name) + ".webp"); fd.append("folder", folder || "media"); fd.append("name", res.name);
    return api.call("upload", fd).then(function (j) { return { src: j.src, w: res.w, h: res.h }; });
  };
  A.assetUrl = function (src) { var m = global.PKP_SITE && global.PKP_SITE.assets; return m && m[String(src).split("?")[0]] || null; };
  A.imgUrl = function (src) { if (!src) return ""; if (/^(https?:|data:|blob:)/.test(src)) return src; return A.assetUrl(src) || siteRoot() + src; };
  /* versi standalone: ganti gambar & stylesheet relatif dengan salinan tertanam */
  A.inlineAssets = function (d) {
    if (!global.PKP_SITE) return d;
    Array.prototype.forEach.call(d.querySelectorAll("img[src]"), function (im) { var a = A.assetUrl(im.getAttribute("src")); if (a) im.setAttribute("src", a); });
    Array.prototype.forEach.call(d.querySelectorAll('link[rel="stylesheet"][href*="assets/css"]'), function (l) { var st = d.createElement("style"); st.textContent = global.PKP_SITE.css; l.replaceWith(st); });
    Array.prototype.forEach.call(d.querySelectorAll('script[src*="assets/js"]'), function (sc) { sc.remove(); });
    return d;
  };

  /* ---------------------------------------------------------------- kesehatan konten (dasbor) */
  A.health = function () {
    var c = S.content || {}, out = [], add = function (level, title, detail, href) { out.push({ level: level, title: title, detail: detail, href: href }); };
    var iso = c.iso || {}, days = iso.expiry ? Math.round((new Date(iso.expiry + "T23:59:59") - new Date()) / 864e5) : null;
    if (days == null) add("warn", "Tanggal berlaku sertifikat ISO belum diisi", "Isi agar dasbor dapat mengingatkan masa berlaku.", "#/tentang");
    else if (days < 0) add("bad", "Sertifikat ISO 9001 sudah kedaluwarsa", "Berakhir " + fmtDate(iso.expiry) + " (" + Math.abs(days) + " hari lalu). Unggah sertifikat perpanjangan.", "#/tentang");
    else if (days < 60) add("warn", "Sertifikat ISO berakhir dalam " + days + " hari", "Siapkan sertifikat perpanjangan.", "#/tentang");
    else add("ok", "Sertifikat ISO berlaku", "Sampai " + fmtDate(iso.expiry) + ".", "#/tentang");
    var sample = (c.posts || []).filter(function (p) { return p.sample && p.status === "published"; }).length;
    if (sample) add("warn", sample + " artikel contoh masih tayang", "Ganti dengan artikel asli PKP atau ubah statusnya menjadi draf.", "#/blog");
    else add("ok", "Semua artikel tayang adalah artikel asli", "", "#/blog");
    var dummy = 0;
    (c.posts || []).forEach(function (p) { if (p.status === "published" && p.cover && /unsplash/.test(p.cover.src)) dummy++; });
    (c.courses || []).forEach(function (t) { if (t.visible !== false && t.image && /unsplash/.test(t.image.src)) dummy++; });
    if (dummy) add("warn", dummy + " foto dummy dari Unsplash", "Foto di blog dan training sebaiknya diganti foto kegiatan asli.", "#/training");
    var noAlt = (c.products || []).filter(function (p) { return p.image && p.image.src && !p.image.alt; }).length + (c.apps || []).filter(function (a) { return a.image && !a.image.alt; }).length;
    if (noAlt) add("warn", noAlt + " gambar produk tanpa teks alternatif", "Teks alternatif membantu SEO gambar dan pembaca layar.", "#/produk");
    var k = c.contact || {}, missing = [];
    if (!k.phone) missing.push("telepon"); if (!k.email) missing.push("email"); if (!k.address) missing.push("alamat"); if (!(k.instagram && k.instagram.url)) missing.push("Instagram");
    if (missing.length) add("warn", "Data kontak belum lengkap", "Belum diisi: " + missing.join(", ") + ".", "#/kontak");
    else add("ok", "Data kontak & Instagram lengkap", "Tampil di footer semua halaman dan halaman Hubungi Kami.", "#/kontak");
    var noLogo = (c.partners || []).concat(c.clients || []).filter(function (p) { return p.visible !== false && !(p.logo && p.logo.src); }).length;
    if (noLogo) add("warn", noLogo + " partner/klien belum punya logo", "Sementara tampil sebagai teks nama perusahaan.", "#/partner");
    else add("ok", "Semua partner & klien memakai logo", "", "#/partner");
    var noImg = (c.products || []).filter(function (p) { return p.visible !== false && (p.section === "main" || p.section === "comm") && !(p.image && p.image.src) && !p.mockupHtml; }).length;
    if (noImg) add("warn", noImg + " produk belum punya gambar", "Unggah screenshot produk.", "#/produk");
    else add("ok", "Semua produk punya tampilan visual", "", "#/produk");
    var unread = (S.messages || []).filter(function (m) { return m.status === "new"; }).length;
    if (unread) add("warn", unread + " pesan belum dibaca", "Balas calon klien secepatnya — idealnya di hari yang sama.", "#/inbox");
    var pend = A.changes().length;
    if (pend) add("warn", "Ada perubahan yang belum dipublikasikan", "Pengunjung masih melihat versi sebelumnya.", "#publish");
    else add("ok", "Website sudah sesuai data terbaru", S.publishedAt ? "Dipublikasikan " + ago(S.publishedAt) + "." : "", "");
    var score = Math.round(100 * out.filter(function (x) { return x.level === "ok"; }).length / out.length);
    return { items: out.sort(function (a, b) { var o = { bad: 0, warn: 1, ok: 2 }; return o[a.level] - o[b.level]; }), score: score };
  };
})(window);
