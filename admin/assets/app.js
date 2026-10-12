/* PKP SuperAdmin — kerangka aplikasi: sesi, navigasi, router, publikasi, pencarian cepat. */
(function (global) {
  "use strict";
  var A = global.PKPAdmin, u = A.u, esc = u.esc, ui = A.ui, S = A.store, icon = ui.icon;

  var NAV = [
    { group: "Ringkasan", items: [{ id: "", label: "Dasbor", icon: "dashboard" }] },
    { group: "Konten website", items: [
      { id: "beranda", label: "Beranda", icon: "home", keys: ["hero", "home"] },
      { id: "produk", label: "Produk", icon: "box", keys: ["products"] },
      { id: "aplikasi", label: "Aplikasi Mobile", icon: "smartphone", keys: ["apps"] },
      { id: "layanan", label: "Layanan", icon: "layers", keys: ["services", "infrastructure", "industries"] },
      { id: "partner", label: "Partner & Klien", icon: "handshake", keys: ["partners", "clients", "stats"] },
      { id: "blog", label: "Blog", icon: "news", keys: ["posts", "categories"] },
      { id: "karir", label: "Karir", icon: "briefcase", keys: ["jobs", "departments"] },
      { id: "training", label: "Training", icon: "graduation", keys: ["courses", "schedule"] },
      { id: "tentang", label: "Tentang & ISO", icon: "award", keys: ["iso"] },
      { id: "kontak", label: "Kontak & Sosial", icon: "pin", keys: ["contact"] }] },
    { group: "Interaksi", items: [{ id: "inbox", label: "Kotak Masuk", icon: "inbox", count: true }] },
    { group: "Sistem", items: [
      { id: "pengguna", label: "Pengguna", icon: "users", role: "superadmin" },
      { id: "riwayat", label: "Riwayat & Cadangan", icon: "history" }] }
  ];
  var TITLES = { "": "Dasbor", akun: "Akun saya" };
  NAV.forEach(function (g) { g.items.forEach(function (i) { TITLES[i.id] = i.label; }); });

  A.affectedLabel = function (changes) {
    var a = A.affected(changes), parts = a.pages.map(function (p) { return A.PAGE_LABEL[p]; });
    if (a.posts) parts.push("halaman artikel");
    if (a.sitemap) parts.push("sitemap");
    return parts.join(", ") || "—";
  };

  /* ---------------------------------------------------------------- kerangka */
  function shell() {
    document.body.innerHTML = '<a class="sr-only" href="#content">Langsung ke konten</a><div class="app" id="app"><aside class="sidebar" aria-label="Navigasi SuperAdmin">' +
      '<div class="side-brand"><img src="assets/logogram.svg" alt=""><div><b>PKP SuperAdmin</b><small>' + (global.PKP_STANDALONE ? "Versi tampilan" : A.api.mode === "demo" ? "Mode demo" : "Company Profile") + '</small></div></div>' +
      '<nav class="side-nav" data-nav></nav><div class="side-foot"><button type="button" class="side-user" data-user><span class="avatar" data-avatar></span><span style="min-width:0;flex:1"><b data-uname></b><small data-urole></small></span>' + icon("more", "icon--sm") + "</button></div></aside>" +
      '<div class="main"><header class="topbar"><button type="button" class="btn btn--ghost btn--icon menu-btn" data-menu aria-label="Buka menu">' + icon("menu") + "</button>" +
      '<div class="crumbs"><span class="crumb-parent">PKP</span>' + icon("chevron", "icon--sm crumb-parent") + '<b data-title>Dasbor</b></div><div class="top-actions">' +
      '<button type="button" class="search-btn" data-search>' + icon("search", "icon--sm") + '<span>Cari menu & konten</span><span class="kbd">Ctrl K</span></button>' +
      '<a class="btn btn--ghost btn--icon" href="' + A.siteRoot() + '" target="_blank" rel="noopener" aria-label="Buka website" title="Buka website">' + icon("external") + "</a>" +
      '<div class="pub" data-pub></div></div></header><main class="content" id="content" tabindex="-1"></main></div></div>';
    if (A.api.mode === "demo") {
      var n = ui.el('<div class="callout callout--info" style="border-radius:0;border-width:0 0 1px;justify-content:center">' + icon("info") + '<div>' + (global.PKP_BANNER ||
        '<b style="display:inline">Mode demo.</b> PHP tidak terdeteksi, jadi perubahan tersimpan di browser ini saja dan “Publikasikan” menghasilkan paket ZIP untuk diunggah ke hosting. Pasang di hosting ber-PHP agar website diperbarui langsung.') + "</div></div>");
      document.querySelector(".main").insertBefore(n, document.querySelector(".topbar").nextSibling);
    }
    drawNav(); drawUser(); drawPub();
    document.querySelector("[data-menu]").onclick = function () { document.getElementById("app").classList.toggle("nav-open"); };
    document.getElementById("app").addEventListener("click", function (e) { if (e.target.id === "app") this.classList.remove("nav-open"); });
    document.querySelector("[data-user]").onclick = function (e) {
      ui.popover(e.currentTarget, [
        { label: "Akun saya", icon: "key", onClick: function () { location.hash = "#/akun"; } },
        { label: "Buka website", icon: "external", onClick: function () { window.open(A.siteRoot(), "_blank", "noopener"); } },
        "-",
        { label: "Keluar", icon: "logout", danger: true, onClick: logout }
      ]);
    };
    document.querySelector("[data-search]").onclick = palette;
    document.addEventListener("keydown", function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); palette(); } });
    document.addEventListener("click", function (e) { var p = e.target.closest("[data-publish]"); if (p) { e.preventDefault(); publishFlow(); } });
  }
  function drawNav() {
    var nav = document.querySelector("[data-nav]"); if (!nav) return;
    var cur = (location.hash.replace(/^#\/?/, "").split("/")[0]) || "", ch = A.changes().map(function (c) { return c.key.split(".")[0]; });
    var unread = S.messages.filter(function (m) { return m.status === "new"; }).length;
    nav.innerHTML = NAV.map(function (g) {
      var items = g.items.filter(function (i) { return !i.role || i.role === S.user.role; });
      return '<div class="nav-group"><div class="nav-label">' + g.group + "</div>" + items.map(function (i) {
        var pending = (i.keys || []).some(function (k) { return ch.indexOf(k) >= 0; });
        return '<a class="nav-link" href="#/' + i.id + '"' + (cur === i.id ? ' aria-current="page"' : "") + ">" + icon(i.icon) + "<span>" + i.label + "</span>" +
          (i.count && unread ? '<span class="nav-count" aria-label="' + unread + ' pesan baru">' + unread + "</span>" : pending ? '<span class="nav-dot" title="Ada perubahan belum dipublikasikan"></span>' : "") + "</a>";
      }).join("") + "</div>";
    }).join("");
  }
  function drawUser() {
    var a = document.querySelector("[data-avatar]"); if (!a) return;
    a.textContent = u.initials(S.user.name);
    document.querySelector("[data-uname]").textContent = S.user.name;
    document.querySelector("[data-urole]").textContent = S.user.role === "superadmin" ? "SuperAdmin" : "Editor";
  }
  function drawPub() {
    var p = document.querySelector("[data-pub]"); if (!p) return;
    var ch = A.changes();
    if (S.saving) { p.className = "pub"; p.innerHTML = '<span class="pub-text">Menyimpan…</span>'; return; }
    p.className = "pub" + (ch.length ? " is-pending" : "");
    p.innerHTML = '<span class="pub-dot"></span><span class="pub-text">' + (ch.length ? ch.length + " perubahan belum tayang" : "Website terbaru") + "</span>" +
      '<button type="button" class="btn ' + (ch.length ? "btn--amber" : "btn--secondary") + '" data-publish' + (ch.length ? "" : ' title="Tidak ada perubahan"') + ">" + icon("rocket", "icon--sm") + "Publikasikan</button>";
  }
  S.on(function (what) { if (what === "content" || what === "saving") { drawPub(); drawNav(); } if (what === "messages") drawNav(); if (what === "user") drawUser(); });

  /* ---------------------------------------------------------------- router */
  var lastHash = location.hash;
  A.route = function () {
    var parts = location.hash.replace(/^#\/?/, "").split("/").map(decodeURIComponent), id = parts[0] || "", view = A.views[id === "" ? "dashboard" : id];
    /* elemen konten diganti baru agar event listener halaman sebelumnya tidak ikut terbawa */
    var prevRoot = document.getElementById("content"), root = prevRoot.cloneNode(false);
    prevRoot.replaceWith(root);
    if (!view) { location.replace("#/"); return; }
    document.querySelector("[data-title]").textContent = TITLES[id] || "PKP";
    document.title = (TITLES[id] || "Dasbor") + " — PKP SuperAdmin";
    document.getElementById("app").classList.remove("nav-open");
    drawNav();
    try { view(root, parts.slice(1)); } catch (e) { console.error(e); root.innerHTML = '<div class="callout callout--bad">' + icon("alert") + "<div><b>Halaman gagal dimuat</b>" + esc(e.message) + "</div></div>"; }
    if (lastHash.split("/")[1] !== location.hash.split("/")[1]) { window.scrollTo(0, 0); root.focus({ preventScroll: true }); }
    lastHash = location.hash;
  };
  window.addEventListener("hashchange", function () {
    if (A.guard) {
      var target = location.hash;
      history.replaceState(null, "", lastHash);
      ui.confirm({ title: "Tinggalkan halaman ini?", text: "Ada perubahan yang belum disimpan dan akan hilang.", ok: "Tinggalkan", danger: true, icon: "alert" }).then(function (y) { if (y) { A.guard = false; location.hash = target; } });
      return;
    }
    A.route();
  });
  window.addEventListener("beforeunload", function (e) { if (A.guard) { e.preventDefault(); e.returnValue = ""; } });

  /* ---------------------------------------------------------------- publikasi */
  function publishFlow() {
    var ch = A.changes();
    if (!ch.length) { ui.toast("Tidak ada perubahan — website sudah menampilkan data terbaru."); return; }
    var aff = A.affected(ch), demo = A.api.mode === "demo";
    var posts = aff.posts ? (S.content.posts || []).filter(function (p) { return p.status === "published" && p.body && String(p.body).trim(); }) : [];
    var body = '<div class="stack"><div><span class="field-label">Yang berubah</span><ul class="feed" style="margin-top:6px;border:1px solid var(--line);border-radius:12px">' + ch.map(function (c) {
      return '<li><span class="dot blue"></span><div><b>' + esc(c.label) + "</b><small>" + esc(A.affectedLabel([c])) + "</small></div></li>"; }).join("") + "</ul></div>" +
      '<div><span class="field-label">Halaman yang akan diperbarui <span class="opt">klik untuk pratinjau</span></span><div class="row" style="margin-top:8px">' +
      aff.pages.filter(function (p) { return p !== "404" && p !== "blog-detail"; }).map(function (p) { return '<button type="button" class="btn btn--secondary btn--xs" data-pv="' + p + '">' + icon("eye", "icon--sm") + esc(A.PAGE_LABEL[p]) + "</button>"; }).join("") +
      posts.slice(0, 6).map(function (p) { return '<button type="button" class="btn btn--secondary btn--xs" data-pvpost="' + esc(p.id) + '">' + icon("file", "icon--sm") + esc(p.title.length > 28 ? p.title.slice(0, 26) + "…" : p.title) + "</button>"; }).join("") +
      (aff.sitemap || aff.posts ? '<span class="tag">sitemap.xml</span>' : "") + "</div></div>" +
      (demo ? '<div class="callout callout--info">' + icon("download") + "<div><b>Mode demo: hasilnya paket ZIP</b>Unggah isi ZIP ke folder website di hosting (menimpa file lama).</div></div>"
            : '<div class="callout">' + icon("shield") + "<div><b>Aman</b>Versi halaman sebelumnya dicadangkan otomatis sebelum ditimpa.</div></div>") + "</div>";
    var m = ui.modal({ title: "Publikasikan ke website", text: "Perubahan berikut akan langsung terlihat oleh pengunjung.", icon: "rocket", body: body, wide: true,
      actions: [{ label: "Nanti saja", kind: "ghost" }, { label: demo ? "Buat paket ZIP" : "Publikasikan sekarang", kind: "primary", icon: demo ? "download" : "rocket", onClick: function () {
        return A.buildPublish(S.content).then(function (r) {
          if (demo) A.download(A.zip(r.files), "pkp-website-update-" + u.today() + ".zip");
          return A.api.call("publish", { files: r.files, delete: r.delete }).then(function (j) {
            S.published = u.clone(S.content); S.publishedAt = j.publishedAt; S.publishedBy = S.user.name; A.site.pages = {};
            S.emit("content");
            ui.toast(demo ? "Paket berisi " + Object.keys(r.files).length + " file sudah diunduh." : Object.keys(r.files).length + " file diperbarui" + (r.delete.length ? ", " + r.delete.length + " dihapus" : "") + ".",
              { title: demo ? "Paket publikasi siap" : "Website diperbarui", ms: 6000 });
            if (location.hash === "" || location.hash === "#/") A.route();
          });
        });
      } }] });
    m.el.addEventListener("click", function (e) {
      var b = e.target.closest("[data-pv]"); if (b) A.previewPage(b.dataset.pv, S.content).catch(function (er) { ui.toast(er.message, { type: "bad" }); });
      var bp = e.target.closest("[data-pvpost]"); if (bp) A.previewPage(null, S.content, S.content.posts.filter(function (p) { return p.id === bp.dataset.pvpost; })[0]).catch(function (er) { ui.toast(er.message, { type: "bad" }); });
    });
  }
  A.publish = publishFlow;

  /* ---------------------------------------------------------------- pencarian cepat (Ctrl+K) */
  function palette() {
    if (document.querySelector(".palette")) return;
    var c = S.content, entries = [];
    NAV.forEach(function (g) { g.items.forEach(function (i) { if (!i.role || i.role === S.user.role) entries.push({ label: i.label, hint: "Menu", icon: i.icon, go: "#/" + i.id }); }); });
    (c.products || []).forEach(function (p) { entries.push({ label: p.name, hint: "Produk", icon: "box", run: function () { location.hash = "#/produk"; setTimeout(function () { A.editProduct(p); }, 60); } }); });
    (c.posts || []).forEach(function (p) { entries.push({ label: p.title, hint: "Artikel", icon: "news", go: "#/blog/tulis/" + p.id }); });
    (c.partners || []).forEach(function (p) { entries.push({ label: p.name, hint: "Partner", icon: "handshake", go: "#/partner" }); });
    (c.clients || []).forEach(function (p) { entries.push({ label: p.name, hint: "Klien", icon: "handshake", go: "#/partner/klien" }); });
    (c.jobs || []).forEach(function (p) { entries.push({ label: p.title, hint: "Lowongan", icon: "briefcase", go: "#/karir" }); });
    entries.push({ label: "Tulis artikel baru", hint: "Aksi", icon: "plus", go: "#/blog/tulis/baru" }, { label: "Publikasikan perubahan", hint: "Aksi", icon: "rocket", run: publishFlow });
    var box = ui.el('<div class="palette-in"><div class="search-in">' + icon("search") + '<input placeholder="Cari menu, produk, artikel, partner…" aria-label="Cari"><span class="kbd">Esc</span></div><ul role="listbox"></ul></div>');
    var m = ui.modal({ raw: true, cls: "palette", body: box, focus: "input" });
    var input = box.querySelector("input"), ul = box.querySelector("ul"), idx = 0, shown = [];
    var draw = function () {
      var q = input.value.trim().toLowerCase();
      shown = entries.filter(function (e) { return !q || e.label.toLowerCase().indexOf(q) >= 0 || e.hint.toLowerCase().indexOf(q) >= 0; }).slice(0, 12);
      idx = Math.min(idx, Math.max(0, shown.length - 1));
      ul.innerHTML = shown.map(function (e, i) { return '<li><button type="button" role="option" data-i="' + i + '" aria-selected="' + (i === idx) + '">' + icon(e.icon) + esc(e.label) + "<small>" + e.hint + "</small></button></li>"; }).join("") || '<li class="empty"><p>Tidak ditemukan.</p></li>';
    };
    var go = function (i) { var e = shown[i]; if (!e) return; m.close(); setTimeout(function () { if (e.go) location.hash = e.go; else e.run(); }, 120); };
    input.oninput = function () { idx = 0; draw(); };
    input.onkeydown = function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); idx = Math.min(shown.length - 1, idx + 1); draw(); }
      if (e.key === "ArrowUp") { e.preventDefault(); idx = Math.max(0, idx - 1); draw(); }
      if (e.key === "Enter") { e.preventDefault(); go(idx); }
    };
    ul.onclick = function (e) { var b = e.target.closest("[data-i]"); if (b) go(+b.dataset.i); };
    draw();
  }

  function logout() { if (global.PKP_ONLOGOUT) return global.PKP_ONLOGOUT(); A.api.call("logout", {}).catch(function () {}).then(function () { location.href = "login.html"; }); }

  /* ---------------------------------------------------------------- mulai */
  A.boot = function () {
    A.api.detect().then(function (st) {
      if (!st.user) { location.replace("login.html" + (st.needsSetup ? "?setup=1" : "")); return; }
      S.user = st.user;
      return Promise.all([S.load(), S.loadMessages().catch(function () { S.messages = []; }), A.loadSite()]).then(function () {
        shell();
        A.route();
        setInterval(function () { if (!document.hidden) S.loadMessages().catch(function () {}); }, 120000);
      });
    }).catch(function (e) {
      console.error(e);
      document.body.innerHTML = '<div class="boot"><div class="callout callout--bad" style="max-width:520px">' + icon("alert") + "<div><b>SuperAdmin gagal dimuat</b>" + esc(e.message) + "</div></div></div>";
    });
  };
})(window);
