/* PKP SuperAdmin — Dasbor, Blog, SEO & Integrasi, Kotak Masuk, Pengguna, Riwayat, Akun. */
(function (global) {
  "use strict";
  var A = global.PKPAdmin, u = A.u, esc = u.esc, ui = A.ui, S = A.store, F = ui.F, icon = ui.icon, sIcon = ui.siteIcon, H = A.vh;
  var V = A.views;

  /* ================================================================= DASBOR */
  V.dashboard = function (root) {
    var c = S.content, hl = A.health(), ch = A.changes(), hour = new Date().getHours();
    var greet = hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
    var R = 70, C = 2 * Math.PI * R, okN = hl.items.filter(function (x) { return x.level === "ok"; }).length;
    var vis = function (l) { return (l || []).filter(function (x) { return x.visible !== false; }).length; };
    var pub = (c.posts || []).filter(function (p) { return p.status === "published"; }).length, drafts = (c.posts || []).length - pub;
    var unread = S.messages.filter(function (m) { return m.status === "new"; }).length;
    root.innerHTML = '<div class="hello"><div><h1>' + greet + ", " + esc((S.user.name || "").split(" ")[0]) + "</h1><p>" +
      (ch.length ? "Ada <b>" + ch.length + " bagian</b> yang berubah dan belum tampil di website." : "Website sudah menampilkan data terbaru" + (S.publishedAt ? " — dipublikasikan " + u.ago(S.publishedAt) + (S.publishedBy ? " oleh " + esc(S.publishedBy) : "") : "") + ".") +
      '</p></div><div class="page-actions"><a class="btn btn--secondary" href="' + A.siteRoot() + '" target="_blank" rel="noopener">' + icon("external") + 'Buka website</a>' +
      (ch.length ? '<button type="button" class="btn btn--amber" data-publish>' + icon("rocket") + "Tinjau & publikasikan</button>" : "") + "</div></div>" +
      '<div class="kpis">' +
      '<a class="card kpi" href="#/produk"><span class="item-icon">' + icon("box") + "</span><div><b>" + vis(c.products) + "</b><span>Produk tampil</span></div></a>" +
      '<a class="card kpi" href="#/blog"><span class="item-icon">' + icon("news") + "</span><div><b>" + pub + "</b><span>Artikel tayang · " + drafts + " draf</span></div></a>" +
      '<a class="card kpi" href="#/partner"><span class="item-icon">' + icon("handshake") + "</span><div><b>" + (vis(c.partners) + vis(c.clients)) + "</b><span>Partner & klien</span></div></a>" +
      '<a class="card kpi" href="#/inbox"><span class="item-icon">' + icon("inbox") + "</span><div><b>" + unread + "</b><span>Pesan baru</span></div></a></div>" +
      '<div class="dash"><div class="stack"><section class="card" aria-labelledby="hl-t"><div class="card-head"><div><h2 id="hl-t">Kesehatan konten website</h2><p>' + okN + " dari " + hl.items.length + ' pemeriksaan terpenuhi.</p></div></div>' +
      '<div class="health"><div class="ring" role="img" aria-label="Skor kesehatan ' + hl.score + ' dari 100"><svg viewBox="0 0 168 168"><circle class="track" cx="84" cy="84" r="' + R + '"/>' +
      '<circle class="val" cx="84" cy="84" r="' + R + '" stroke-dasharray="' + C + '" stroke-dashoffset="' + C + '" data-off="' + (C * (1 - hl.score / 100)) + '"/></svg>' +
      '<div class="ring-label"><b>' + hl.score + "<small>%</small></b><span>skor konten</span></div></div>" +
      '<ul class="checks">' + hl.items.map(function (it) {
        return '<li class="check-item ' + it.level + '"><span class="check-ic">' + icon(it.level === "ok" ? "check" : it.level === "bad" ? "x" : "alert") + "</span><div><b>" + esc(it.title) + "</b>" + (it.detail ? "<small>" + esc(it.detail) + "</small>" : "") + "</div>" +
          (it.href && it.level !== "ok" ? '<a href="' + it.href + '"' + (it.href === "#publish" ? " data-publish" : "") + ">" + (it.href === "#publish" ? "Publikasikan" : "Perbaiki") + "</a>" : "") + "</li>";
      }).join("") + "</ul></div></section>" +
      (ch.length ? '<section class="card"><div class="card-head"><div><h2>Menunggu dipublikasikan</h2><p>Perubahan yang tersimpan sebagai draf.</p></div><button type="button" class="btn btn--primary btn--sm" data-publish>' + icon("rocket", "icon--sm") + "Publikasikan</button></div>" +
        '<ul class="feed">' + ch.map(function (x) { return '<li><span class="dot blue"></span><div><b>' + esc(x.label) + "</b><small>Halaman: " + esc(A.affectedLabel([x])) + "</small></div></li>"; }).join("") + "</ul></section>" : "") +
      '</div><div class="stack"><section class="card"><div class="card-head"><div><h2>Pesan terbaru</h2><p>Dari form Hubungi Kami.</p></div><a class="btn btn--ghost btn--sm" href="#/inbox">Semua' + icon("chevron", "icon--sm") + "</a></div>" +
      (S.messages.length ? S.messages.slice(0, 4).map(function (m) {
        return '<a class="msg-mini" href="#/inbox/' + esc(m.id) + '"><span class="avatar">' + esc(u.initials(m.name)) + "</span><div><b>" + esc(m.name) + (m.status === "new" ? ' <span class="badge badge--new" style="margin-left:4px">Baru</span>' : "") +
          "</b><p>" + esc(m.message) + "</p></div><time>" + u.ago(m.at) + "</time></a>";
      }).join("") : H.empty("inbox", "Belum ada pesan", "Pesan dari form website akan muncul di sini.", "")) + "</section>" +
      '<section class="card"><div class="card-head"><div><h2>Aktivitas terakhir</h2></div><a class="btn btn--ghost btn--sm" href="#/riwayat">Riwayat' + icon("chevron", "icon--sm") + '</a></div><ul class="feed" data-audit><li><div class="skel" style="height:14px;width:70%"></div></li></ul></section></div></div>';
    requestAnimationFrame(function () { var v = root.querySelector(".ring .val"); if (v) setTimeout(function () { v.style.strokeDashoffset = v.dataset.off; }, 60); });
    A.api.call("audit").then(function (j) {
      var box = root.querySelector("[data-audit]"); if (!box) return;
      box.innerHTML = (j.audit || []).slice(0, 6).map(function (a) { return '<li><span class="dot"></span><div><b>' + esc(a.user) + "</b> " + esc(a.action.toLowerCase()) + (a.detail ? " — " + esc(a.detail) : "") + "<small>" + u.ago(a.at) + "</small></div></li>"; }).join("") || '<li class="muted">Belum ada aktivitas.</li>';
    }).catch(function () {});
  };

  /* ================================================================= BLOG */
  V.blog = function (root, params) {
    if (params[0] === "tulis") return editor(root, params[1]);
    var f = params[0] || "semua", q = "", c = S.content, sel = {};
    var posts = function () {
      return (c.posts || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).filter(function (p) {
        return (f === "semua" || (f === "tayang" && p.status === "published") || (f === "draf" && p.status !== "published") || (f === "contoh" && p.sample)) &&
          (!q || (p.title + " " + p.excerpt).toLowerCase().indexOf(q) >= 0);
      });
    };
    var count = function (k) { return (c.posts || []).filter(function (p) { return k === "semua" || (k === "tayang" && p.status === "published") || (k === "draf" && p.status !== "published") || (k === "contoh" && p.sample); }).length; };
    root.innerHTML = H.head("Blog", "Artikel di halaman <b>Media & Informasi</b> dan Beranda. Artikel dengan isi lengkap mendapat halaman sendiri dan masuk sitemap Google.",
      '<button type="button" class="btn btn--secondary" data-cats>' + icon("tag") + 'Kategori</button><a class="btn btn--primary" href="#/blog/tulis/baru">' + icon("plus") + "Tulis artikel</a>") +
      ((c.posts || []).some(function (p) { return p.sample && p.status === "published"; }) ? '<div class="callout callout--warn" style="margin-bottom:16px">' + icon("alert") + "<div><b>Artikel contoh masih tayang</b>Artikel berlabel <i>Contoh</i> berasal dari desain awal. Ganti dengan artikel asli PKP — Google menilai konten orisinal dan rutin.</div></div>" : "") +
      '<div class="card"><div class="toolbar"><div class="seg" role="tablist">' + [["semua", "Semua"], ["tayang", "Tayang"], ["draf", "Draf"], ["contoh", "Contoh"]].map(function (t) {
        return '<button type="button" role="tab" data-f="' + t[0] + '" aria-selected="' + (f === t[0]) + '">' + t[1] + ' <span class="count">' + count(t[0]) + "</span></button>"; }).join("") +
      '</div><span class="spacer"></span><label class="search">' + icon("search") + '<input class="input" type="search" placeholder="Cari judul artikel" aria-label="Cari artikel"></label></div><div data-bulk></div><div class="table-wrap"><table class="table"><thead><tr><th style="width:36px"><input type="checkbox" class="check" data-all aria-label="Pilih semua"></th><th>Artikel</th><th class="hide-sm">Kategori</th><th>Status</th><th class="hide-sm">Tanggal</th><th class="t-actions"><span class="sr-only">Aksi</span></th></tr></thead><tbody></tbody></table></div></div>';
    var tbody = root.querySelector("tbody"), bulk = root.querySelector("[data-bulk]");
    var draw = function () {
      var list = posts();
      tbody.innerHTML = list.length ? list.map(function (p) {
        return '<tr><td><input type="checkbox" class="check" data-sel="' + esc(p.id) + '"' + (sel[p.id] ? " checked" : "") + ' aria-label="Pilih ' + esc(p.title) + '"></td>' +
          '<td><div class="row" style="flex-wrap:nowrap;gap:12px">' + H.thumb(p.cover) + '<div style="min-width:0"><a class="t-title" href="#/blog/tulis/' + esc(p.id) + '">' + esc(p.title) + '</a><div class="t-sub">' + (p.body ? icon("file", "icon--sm") + " Halaman artikel lengkap" : "Ringkasan saja — menaut ke template artikel") + "</div></div></div></td>" +
          '<td class="hide-sm"><span class="tag">' + esc(PKPRender.catLabel(c, p.category)) + "</span></td>" +
          "<td>" + (p.status === "published" ? '<span class="badge badge--live">Tayang</span>' : '<span class="badge badge--draft">Draf</span>') + (p.sample ? ' <span class="badge badge--sample badge--plain">Contoh</span>' : "") + "</td>" +
          '<td class="hide-sm t-date">' + u.fmtDate(p.date) + '</td><td class="t-actions"><a class="btn btn--ghost btn--icon btn--sm" href="#/blog/tulis/' + esc(p.id) + '" aria-label="Edit">' + icon("edit", "icon--sm") + '</a><button type="button" class="btn btn--ghost btn--icon btn--sm" data-more="' + esc(p.id) + '" aria-label="Opsi">' + icon("more", "icon--sm") + "</button></td></tr>";
      }).join("") : '<tr><td colspan="6">' + H.empty("news", q ? "Tidak ada artikel yang cocok" : "Belum ada artikel di sini", q ? "Coba kata kunci lain." : "Tulis artikel pertama untuk mengisi blog.", '<a class="btn btn--primary btn--sm" href="#/blog/tulis/baru">' + icon("plus", "icon--sm") + "Tulis artikel</a>") + "</td></tr>";
      var n = Object.keys(sel).filter(function (k) { return sel[k]; }).length;
      bulk.innerHTML = n ? '<div class="bulkbar">' + n + ' artikel dipilih<span class="spacer"></span><button type="button" class="btn btn--secondary btn--xs" data-bulk-act="published">Tandai tayang</button><button type="button" class="btn btn--secondary btn--xs" data-bulk-act="draft">Jadikan draf</button><button type="button" class="btn btn--danger btn--xs" data-bulk-act="delete">' + icon("trash", "icon--sm") + "Hapus</button></div>" : "";
    };
    draw();
    root.querySelectorAll("[data-f]").forEach(function (b) { b.onclick = function () { location.hash = "#/blog/" + b.dataset.f; }; });
    root.querySelector('input[type="search"]').oninput = u.debounce(function (e) { q = e.target.value.trim().toLowerCase(); draw(); }, 150);
    root.addEventListener("change", function (e) {
      if (e.target.matches("[data-sel]")) { sel[e.target.dataset.sel] = e.target.checked; draw(); }
      if (e.target.matches("[data-all]")) { posts().forEach(function (p) { sel[p.id] = e.target.checked; }); draw(); }
    });
    root.addEventListener("click", function (e) {
      var m = e.target.closest("[data-more]");
      if (m) {
        var p = (c.posts || []).filter(function (x) { return x.id === m.dataset.more; })[0];
        ui.popover(m, [
          { label: "Edit", icon: "edit", onClick: function () { location.hash = "#/blog/tulis/" + p.id; } },
          { label: "Pratinjau", icon: "eye", onClick: function () { A.previewPage(null, S.content, p).catch(function (er) { ui.toast(er.message, { type: "bad" }); }); } },
          { label: p.status === "published" ? "Jadikan draf" : "Tandai tayang", icon: p.status === "published" ? "eyeoff" : "send", onClick: function () {
            H.save(function (cc) { cc.posts.forEach(function (x) { if (x.id === p.id) x.status = p.status === "published" ? "draft" : "published"; }); }, "Status artikel " + p.title).then(function () { A.route(); });
          } },
          { label: "Duplikat", icon: "copy", onClick: function () { H.save(function (cc) { var cp = u.clone(p); cp.id = u.uid("post"); cp.slug = cp.slug + "-salinan"; cp.title += " (salinan)"; cp.status = "draft"; cc.posts.unshift(cp); }, "Duplikat artikel").then(function () { A.route(); }); } },
          "-",
          { label: "Hapus", icon: "trash", danger: true, onClick: function () {
            ui.confirm({ title: "Hapus artikel ini?", text: "“" + p.title + "” dihapus dari draf. Halaman artikelnya dihapus dari website saat dipublikasikan.", ok: "Hapus", danger: true }).then(function (y) {
              if (y) H.save(function (cc) { cc.posts = cc.posts.filter(function (x) { return x.id !== p.id; }); }, "Menghapus artikel " + p.title).then(function () { A.route(); });
            });
          } }
        ]);
      }
      var ba = e.target.closest("[data-bulk-act]");
      if (ba) {
        var ids = Object.keys(sel).filter(function (k) { return sel[k]; }), act = ba.dataset.bulkAct;
        var go = function () { H.save(function (cc) {
          if (act === "delete") cc.posts = cc.posts.filter(function (x) { return ids.indexOf(x.id) < 0; });
          else cc.posts.forEach(function (x) { if (ids.indexOf(x.id) >= 0) x.status = act; });
        }, "Aksi massal artikel (" + ids.length + ")", ids.length + " artikel diperbarui.").then(function () { A.route(); }); };
        if (act === "delete") ui.confirm({ title: "Hapus " + ids.length + " artikel?", text: "Tindakan ini menghapus artikel dari draf.", ok: "Hapus", danger: true }).then(function (y) { if (y) go(); }); else go();
      }
    });
    root.querySelector("[data-cats]").onclick = function () {
      var m = { list: u.clone(c.categories || []) };
      ui.defineRepeater("cats", { addLabel: "Tambah kategori", empty: function () { return { key: "", label: "" }; }, fields: function (p) { return F.text(p + ".label", "Nama kategori"); } });
      var body = ui.el('<div class="form">' + F.repeater("list", "Kategori (tombol filter di halaman blog)", { id: "cats" }) + "</div>");
      ui.bindForm(body, m);
      ui.modal({ title: "Kategori blog", icon: "tag", body: body, wide: true, actions: [{ label: "Batal", kind: "ghost" }, { label: "Simpan", kind: "primary", onClick: function () {
        m.list = m.list.filter(function (k) { return k.label; }).map(function (k) { k.key = k.key || u.slugify(k.label); return k; });
        var used = (c.posts || []).map(function (p) { return p.category; }).filter(function (k) { return !m.list.some(function (x) { return x.key === k; }); });
        if (used.length) { ui.toast("Kategori masih dipakai artikel: " + used.filter(function (v, i, a) { return a.indexOf(v) === i; }).join(", "), { type: "bad" }); return false; }
        return H.save(function (cc) { cc.categories = m.list; }, "Mengubah kategori blog").then(function () { A.route(); });
      } }] });
    };
  };

  function editor(root, id) {
    var c = S.content, isNew = id === "baru";
    var orig = isNew ? null : (c.posts || []).filter(function (p) { return p.id === id; })[0];
    if (!isNew && !orig) { root.innerHTML = H.empty("news", "Artikel tidak ditemukan", "Mungkin sudah dihapus.", '<a class="btn btn--secondary" href="#/blog">Kembali ke Blog</a>'); return; }
    var d = orig ? u.clone(orig) : { id: u.uid("post"), slug: "", title: "", category: ((c.categories || [])[0] || {}).key || "insight", excerpt: "", date: u.today(), author: S.user.name, linkLabel: "Baca selengkapnya",
      cover: null, body: "", topics: [], readTime: "", status: "draft", seoTitle: "", seoDescription: "" };
    d.seoTitle = d.seoTitle || ""; d.seoDescription = d.seoDescription || "";
    var slugTouched = !!(orig && orig.slug);
    root.innerHTML = '<div class="row" style="margin-bottom:16px"><a class="btn btn--ghost btn--sm" href="#/blog">' + icon("back", "icon--sm") + 'Semua artikel</a><span class="spacer"></span><span class="hint" data-state></span>' +
      '<button type="button" class="btn btn--secondary btn--sm" data-preview>' + icon("eye", "icon--sm") + "Pratinjau</button></div>" +
      '<div class="editor-page"><div class="stack"><div class="card card-pad"><textarea class="title-input" rows="1" data-path="title" placeholder="Judul artikel" aria-label="Judul artikel"></textarea>' +
      '<div class="input-group" style="margin-top:8px;max-width:520px"><span class="prefix">pkp.co.id/blog-</span><input class="input input--mono" data-slug aria-label="Alamat artikel" placeholder="judul-artikel"><span class="prefix" style="border-left:0;border-right:1px solid var(--line-2);border-radius:0 var(--r) var(--r) 0">.html</span></div></div>' +
      F.rich("body") + '<div class="card"><div class="card-head"><div><h2>Ringkasan & tampilan kartu</h2><p>Dipakai di daftar blog, Beranda, dan hasil pencarian.</p></div></div><div class="card-body form">' +
      F.textarea("excerpt", "Ringkasan", { rows: 3, max: 160, min: 70 }) + F.text("linkLabel", "Teks tautan di kartu", { placeholder: "Baca selengkapnya" }) + "</div></div>" +
      '<div class="card"><div class="card-head"><div><h2>SEO</h2><p>Kosongkan untuk memakai judul dan ringkasan.</p></div></div><div class="card-body form">' +
      F.text("seoTitle", "Judul di Google", { max: 60, optional: true }) + F.textarea("seoDescription", "Deskripsi di Google", { rows: 3, max: 160, optional: true }) + '<div class="serp" data-serp></div></div></div></div>' +
      '<aside class="side-panel stack"><div class="card"><div class="card-head"><h2>Publikasi</h2><span data-badge></span></div><div class="card-body form">' +
      F.select("status", "Status", [["draft", "Draf — belum tampil"], ["published", "Tayang di website"]]) + F.text("date", "Tanggal terbit", { type: "date" }) +
      F.select("category", "Kategori", (c.categories || []).map(function (k) { return [k.key, k.label]; })) + F.text("author", "Penulis") + F.tags("topics", "Topik", { optional: true, placeholder: "Core Finance, OJK…" }) +
      '</div><div class="card-foot"><button type="button" class="btn btn--primary" style="width:100%" data-save>' + icon("check") + "Simpan artikel</button></div></div>" +
      '<div class="card"><div class="card-head"><h2>Gambar sampul</h2></div><div class="card-body">' + F.image("cover", "Sampul", { kind: "cover", folder: "blog", maxW: 1440, hint: "Rasio lebar ± 16:9. Foto asli lebih baik untuk SEO." }) + "</div></div>" +
      (orig && orig.sample ? '<div class="callout callout--warn">' + icon("alert") + "<div><b>Artikel contoh</b>Label <i>Contoh</i> hilang otomatis setelah judul atau isi diubah.</div></div>" : "") + "</aside></div>";
    var state = root.querySelector("[data-state]"), slugIn = root.querySelector("[data-slug]"), title = root.querySelector(".title-input");
    slugIn.value = d.slug;
    var autosize = function () { title.style.height = "auto"; title.style.height = title.scrollHeight + "px"; };
    var serp = function () {
      var s = root.querySelector("[data-serp]"), t = d.seoTitle || (d.title ? d.title + " | PKP" : "Judul artikel | PKP"), ds = d.seoDescription || d.excerpt || "Ringkasan artikel akan tampil di sini.";
      s.innerHTML = '<div class="site"><img src="' + A.imgUrl("assets/img/favicon.png") + '" alt=""><div>PT. Prawathiya Karsa Pradiptha<small>' + esc(((c.settings || {}).siteUrl || "https://www.pkp.co.id").replace(/^https?:\/\//, "")) + " › blog-" + esc(d.slug || "…") + "</small></div></div><h4>" +
        esc(t.length > 62 ? t.slice(0, 60) + "…" : t) + "</h4><p>" + esc(ds.length > 160 ? ds.slice(0, 158) + "…" : ds) + "</p>";
      root.querySelector("[data-badge]").innerHTML = d.status === "published" ? '<span class="badge badge--live">Tayang</span>' : '<span class="badge badge--draft">Draf</span>';
    };
    var dirty = false;
    ui.bindForm(root.querySelector(".editor-page"), d, function () {
      dirty = true; A.guard = true; state.textContent = "Belum disimpan"; state.style.color = "var(--amber-ink)";
      if (!slugTouched) { d.slug = u.slugify(d.title); slugIn.value = d.slug; }
      autosize(); serp();
    });
    slugIn.oninput = function () { slugTouched = true; d.slug = u.slugify(slugIn.value); dirty = true; A.guard = true; serp(); };
    slugIn.onblur = function () { slugIn.value = d.slug; };
    autosize(); serp();
    root.querySelector("[data-preview]").onclick = function () { var cc = u.clone(S.content), p = u.clone(d); p.slug = p.slug || "pratinjau"; A.previewPage(null, cc, p).catch(function (e) { ui.toast(e.message, { type: "bad" }); }); };
    root.querySelector("[data-save]").onclick = function (e) {
      var b = e.currentTarget;
      if (!d.title.trim()) return ui.toast("Judul artikel wajib diisi.", { type: "bad" });
      if (d.status === "published" && !d.excerpt.trim()) return ui.toast("Isi ringkasan sebelum menayangkan artikel.", { type: "bad" });
      d.slug = H.uniqueSlug(S.content.posts, d.slug || u.slugify(d.title), d.id);
      var words = (root.querySelector("[data-rich]").innerText || "").trim().split(/\s+/).filter(Boolean).length;
      d.readTime = words ? Math.max(1, Math.round(words / 200)) + " menit baca" : "";
      if (orig && orig.sample && (d.title !== orig.title || d.body !== orig.body)) delete d.sample;
      d.updatedAt = new Date().toISOString();
      if (!d.seoTitle) delete d.seoTitle; if (!d.seoDescription) delete d.seoDescription;
      b.classList.add("is-busy");
      H.save(function (cc) { H.replaceById(cc.posts, u.clone(d), true); }, (isNew ? "Menulis artikel " : "Mengubah artikel ") + d.title,
        d.status === "published" ? "Artikel tersimpan. Tayang di website setelah dipublikasikan." : "Draf artikel tersimpan.").then(function () {
        A.guard = false; dirty = false; b.classList.remove("is-busy"); state.textContent = "Tersimpan " + u.fmtDate(new Date().toISOString(), true); state.style.color = "var(--green)";
        if (isNew) location.replace("#/blog/tulis/" + d.id);
      }, function (er) { b.classList.remove("is-busy"); ui.toast(er.message, { type: "bad" }); });
    };
  }

  /* ================================================================= KOTAK MASUK */
  var MSTAT = { new: ["Baru", "badge--new"], read: ["Dibaca", "badge--hidden"], replied: ["Dibalas", "badge--live"], archived: ["Arsip", "badge--hidden"] };
  V.inbox = function (root, params) {
    var f = "aktif", sel = params[0] || null;
    root.innerHTML = H.head("Kotak Masuk", "Pesan dari form <b>Hubungi Kami</b> di website." + (A.api.mode === "demo" ? " (Mode demo menampilkan pesan contoh.)" : ""),
      '<button type="button" class="btn btn--secondary" data-refresh>' + icon("refresh") + "Muat ulang</button>") +
      '<div class="card inbox"><div class="inbox-list"><div class="toolbar"><div class="seg" role="tablist">' + [["aktif", "Semua"], ["new", "Baru"], ["replied", "Dibalas"], ["archived", "Arsip"]].map(function (t) {
        return '<button type="button" role="tab" data-f="' + t[0] + '" aria-selected="' + (t[0] === f) + '">' + t[1] + "</button>"; }).join("") + '</div></div><div class="inbox-items" role="listbox" aria-label="Daftar pesan"></div></div><div class="reader" aria-live="polite"></div></div>';
    var listEl = root.querySelector(".inbox-items"), reader = root.querySelector(".reader"), box = root.querySelector(".inbox");
    var visible = function () { return S.messages.filter(function (m) { return f === "aktif" ? m.status !== "archived" : m.status === f; }); };
    var drawList = function () {
      var l = visible();
      listEl.innerHTML = l.length ? l.map(function (m) {
        return '<button type="button" class="mail' + (m.status === "new" ? " is-new" : "") + '" role="option" data-id="' + esc(m.id) + '" aria-selected="' + (m.id === sel) + '"><span class="avatar">' + esc(u.initials(m.name)) +
          '</span><div class="mail-top"><b>' + esc(m.name) + "</b><time>" + u.ago(m.at) + "</time></div><p>" + esc((m.company ? m.company + " — " : "") + m.message) + "</p></button>";
      }).join("") : H.empty("inbox", "Tidak ada pesan", f === "new" ? "Semua pesan sudah dibaca." : "Belum ada pesan di folder ini.", "");
    };
    var update = function (m, patch, msg) {
      Object.assign(m, patch); S.emit("messages");
      return A.api.call("messages/update", Object.assign({ id: m.id }, patch)).then(function () { if (msg) ui.toast(msg); drawList(); drawReader(); }, function (e) { ui.toast(e.message, { type: "bad" }); });
    };
    var drawReader = function () {
      var m = S.messages.filter(function (x) { return x.id === sel; })[0];
      box.classList.toggle("reading", !!m);
      if (!m) { reader.innerHTML = H.empty("mail", "Pilih pesan", "Pesan yang dipilih akan tampil di sini.", ""); return; }
      var subject = "Re: " + (m.topic ? m.topic + " — " : "") + "Pesan Anda di website PKP";
      reader.innerHTML = '<button type="button" class="btn btn--ghost btn--sm menu-back" data-back style="margin-bottom:10px">' + icon("back", "icon--sm") + "Kembali</button>" +
        '<div class="row"><span class="badge ' + MSTAT[m.status][1] + '">' + MSTAT[m.status][0] + '</span><span class="hint">' + u.fmtDate(m.at, true) + "</span></div>" +
        '<h2 style="margin-top:10px">' + esc(m.name) + "</h2>" +
        '<dl class="reader-meta"><div><dt>Email</dt><dd><a href="mailto:' + esc(m.email) + '">' + esc(m.email) + "</a></dd></div><div><dt>Telepon</dt><dd>" + (m.phone ? '<a href="tel:' + esc(m.phone.replace(/[^\d+]/g, "")) + '">' + esc(m.phone) + "</a>" : "—") + "</dd></div>" +
        "<div><dt>Perusahaan</dt><dd>" + esc(m.company || "—") + "</dd></div><div><dt>Kebutuhan</dt><dd>" + esc(m.topic || "—") + '</dd></div></dl><div class="reader-body">' + esc(m.message) + "</div>" +
        '<div class="row" style="margin-top:16px"><a class="btn btn--primary" data-reply href="mailto:' + esc(m.email) + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent("Halo " + m.name + ",\n\nTerima kasih telah menghubungi PT. Prawathiya Karsa Pradiptha.\n\n\n\nSalam,\n" + S.user.name + "\nPKP\n\n---\n" + m.message) + '">' + icon("reply") + "Balas via email</a>" +
        (m.status !== "replied" ? '<button type="button" class="btn btn--secondary" data-st="replied">' + icon("check") + "Tandai dibalas</button>" : "") +
        (m.status !== "archived" ? '<button type="button" class="btn btn--secondary" data-st="archived">' + icon("archive") + "Arsipkan</button>" : '<button type="button" class="btn btn--secondary" data-st="read">' + icon("inbox") + "Kembalikan</button>") +
        '<span class="spacer"></span><button type="button" class="btn btn--danger btn--icon" data-del aria-label="Hapus pesan">' + icon("trash") + "</button></div>" +
        '<div class="field" style="margin-top:22px"><label for="note">Catatan internal <span class="opt">hanya terlihat admin</span></label><textarea class="textarea" id="note" rows="3" placeholder="mis. Sudah ditelepon, demo dijadwalkan Kamis 10.00">' + esc(m.notes || "") + '</textarea><div class="row"><button type="button" class="btn btn--secondary btn--sm" data-note>Simpan catatan</button></div></div>';
      if (m.status === "new") update(m, { status: "read" });
      reader.querySelector("[data-back]").onclick = function () { sel = null; history.replaceState(null, "", "#/inbox"); drawList(); drawReader(); };
      reader.querySelector("[data-reply]").addEventListener("click", function () { if (m.status !== "replied") setTimeout(function () { update(m, { status: "replied" }, "Ditandai dibalas."); }, 400); });
      reader.querySelectorAll("[data-st]").forEach(function (b) { b.onclick = function () { update(m, { status: b.dataset.st }, { replied: "Ditandai dibalas.", archived: "Pesan diarsipkan.", read: "Pesan dikembalikan ke kotak masuk." }[b.dataset.st]); }; });
      reader.querySelector("[data-note]").onclick = function () { update(m, { notes: reader.querySelector("#note").value }, "Catatan tersimpan."); };
      reader.querySelector("[data-del]").onclick = function () {
        ui.confirm({ title: "Hapus pesan dari " + m.name + "?", text: "Pesan dihapus permanen dari kotak masuk.", ok: "Hapus", danger: true }).then(function (y) {
          if (y) A.api.call("messages/delete", { ids: [m.id] }).then(function () { S.messages = S.messages.filter(function (x) { return x.id !== m.id; }); S.emit("messages"); sel = null; drawList(); drawReader(); ui.toast("Pesan dihapus."); });
        });
      };
    };
    listEl.addEventListener("click", function (e) { var b = e.target.closest(".mail"); if (!b) return; sel = b.dataset.id; history.replaceState(null, "", "#/inbox/" + sel); drawList(); drawReader(); });
    root.querySelectorAll("[data-f]").forEach(function (b) { b.onclick = function () { f = b.dataset.f; root.querySelectorAll("[data-f]").forEach(function (x) { x.setAttribute("aria-selected", x === b); }); drawList(); }; });
    root.querySelector("[data-refresh]").onclick = function () { S.loadMessages().then(function () { drawList(); drawReader(); ui.toast("Kotak masuk diperbarui."); }); };
    drawList(); drawReader();
  };

  /* ================================================================= PENGGUNA */
  V.pengguna = function (root) {
    if (S.user.role !== "superadmin") { root.innerHTML = H.empty("shield", "Khusus SuperAdmin", "Halaman ini hanya dapat dibuka oleh SuperAdmin.", ""); return; }
    root.innerHTML = H.head("Pengguna Admin", "Siapa saja yang dapat masuk ke SuperAdmin.", '<button type="button" class="btn btn--primary" data-add>' + icon("plus") + "Tambah admin</button>") +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) 300px;align-items:start"><div class="card"><div class="table-wrap"><table class="table"><thead><tr><th>Admin</th><th>Peran</th><th class="hide-sm">Terakhir masuk</th><th class="t-actions"><span class="sr-only">Aksi</span></th></tr></thead><tbody><tr><td colspan="4"><div class="skel" style="height:40px"></div></td></tr></tbody></table></div></div>' +
      '<div class="card card-pad stack"><div><b>SuperAdmin</b><p class="hint" style="margin-top:4px">Semua akses: konten, publikasi, SEO & integrasi, pengguna, dan pemulihan cadangan.</p></div><div><b>Editor</b><p class="hint" style="margin-top:4px">Mengubah & mempublikasikan konten serta membalas pesan. Tidak dapat mengubah integrasi Google atau mengelola pengguna.</p></div></div></div>';
    var tbody = root.querySelector("tbody"), users = [];
    var draw = function () {
      tbody.innerHTML = users.map(function (x) {
        return '<tr><td><div class="row" style="flex-wrap:nowrap"><span class="avatar">' + esc(u.initials(x.name)) + '</span><div><div class="t-title">' + esc(x.name) + (x.id === S.user.id ? ' <span class="badge badge--plain">Anda</span>' : "") + '</div><div class="t-sub">' + esc(x.email) + "</div></div></div></td>" +
          '<td><span class="badge ' + (x.role === "superadmin" ? "badge--new" : "badge--plain") + '">' + (x.role === "superadmin" ? "SuperAdmin" : "Editor") + "</span>" + (x.active === false ? ' <span class="badge badge--hidden">Nonaktif</span>' : "") + "</td>" +
          '<td class="hide-sm">' + (x.lastLogin ? u.ago(x.lastLogin) : "Belum pernah") + '</td><td class="t-actions"><button type="button" class="btn btn--ghost btn--icon btn--sm" data-edit="' + esc(x.id) + '" aria-label="Edit ' + esc(x.name) + '">' + icon("edit", "icon--sm") + "</button>" +
          (x.id !== S.user.id ? '<button type="button" class="btn btn--ghost btn--icon btn--sm" data-del="' + esc(x.id) + '" aria-label="Hapus ' + esc(x.name) + '">' + icon("trash", "icon--sm") + "</button>" : "") + "</td></tr>";
      }).join("");
    };
    var load = function () { return A.api.call("users").then(function (j) { users = j.users; draw(); }); };
    load().catch(function (e) { tbody.innerHTML = '<tr><td colspan="4">' + esc(e.message) + "</td></tr>"; });
    var edit = function (x) {
      var isNew = !x, d = x ? u.clone(x) : { name: "", email: "", role: "editor", active: true, password: "" }; d.password = "";
      var dr = ui.drawer({ title: isNew ? "Tambah admin" : "Edit admin", saveLabel: isNew ? "Buat akun" : "Simpan",
        form: F.text("name", "Nama lengkap", { required: true }) + F.text("email", "Email (untuk masuk)", { type: "email", required: true }) +
          F.select("role", "Peran", [["editor", "Editor — kelola konten & pesan"], ["superadmin", "SuperAdmin — semua akses"]]) +
          F.text("password", isNew ? "Kata sandi awal" : "Atur ulang kata sandi", { type: "password", optional: !isNew, hint: "Minimal 10 karakter. " + (isNew ? "Sampaikan ke admin baru lewat jalur aman dan minta ia menggantinya." : "Kosongkan bila tidak diganti.") }) +
          (isNew || x.id === S.user.id ? "" : F.toggle("active", "Akun aktif (dapat masuk)")),
        onSave: function () {
          if (!d.name || !/^\S+@\S+\.\S+$/.test(d.email)) return Promise.reject(new Error("Nama dan email wajib diisi dengan benar."));
          if ((isNew || d.password) && d.password.length < 10) return Promise.reject(new Error("Kata sandi minimal 10 karakter."));
          return A.api.call("users/save", d).then(function (j) { users = j.users; draw(); ui.toast(isNew ? "Akun admin dibuat." : "Data admin diperbarui."); });
        } });
      ui.bindForm(dr.form, d, function () { dr.setDirty(true); });
    };
    root.querySelector("[data-add]").onclick = function () { edit(null); };
    tbody.addEventListener("click", function (e) {
      var ed = e.target.closest("[data-edit]"); if (ed) edit(users.filter(function (x) { return x.id === ed.dataset.edit; })[0]);
      var de = e.target.closest("[data-del]");
      if (de) { var x = users.filter(function (y) { return y.id === de.dataset.del; })[0];
        ui.confirm({ title: "Hapus akun " + x.name + "?", text: x.email + " tidak akan dapat masuk lagi.", ok: "Hapus akun", danger: true }).then(function (y) {
          if (y) A.api.call("users/delete", { id: x.id }).then(function (j) { users = j.users; draw(); ui.toast("Akun dihapus."); }, function (er) { ui.toast(er.message, { type: "bad" }); });
        }); }
    });
  };

  /* ================================================================= RIWAYAT */
  V.riwayat = function (root) {
    root.innerHTML = H.head("Riwayat & Cadangan", "Catatan aktivitas admin dan cadangan otomatis setiap kali draf disimpan.") +
      '<div class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start"><section class="card"><div class="card-head"><h2>Aktivitas</h2></div><ul class="feed" data-audit><li><div class="skel" style="height:14px;width:60%"></div></li></ul></section>' +
      '<section class="card"><div class="card-head"><div><h2>Cadangan konten</h2><p>Pulihkan bila ada perubahan yang keliru.</p></div></div><ul class="feed" data-backups><li><div class="skel" style="height:14px;width:60%"></div></li></ul></section></div>';
    A.api.call("audit").then(function (j) {
      root.querySelector("[data-audit]").innerHTML = (j.audit || []).map(function (a) {
        return '<li><span class="dot' + (/Mempublikasikan/.test(a.action) ? " blue" : "") + '"></span><div><b>' + esc(a.user) + "</b> " + esc(a.action.toLowerCase()) + (a.detail ? " — " + esc(a.detail) : "") + "<small>" + u.fmtDate(a.at, true) + "</small></div></li>";
      }).join("") || '<li class="muted">Belum ada aktivitas.</li>';
    });
    A.api.call("backups").then(function (j) {
      var sa = S.user.role === "superadmin";
      root.querySelector("[data-backups]").innerHTML = (j.backups || []).map(function (b) {
        return '<li><span class="dot"></span><div style="flex:1"><b>' + u.fmtDate(b.at, true) + "</b><small>" + esc(b.reason) + (b.user ? " · " + esc(b.user) : "") + "</small></div>" +
          (sa ? '<button type="button" class="btn btn--secondary btn--xs" data-restore="' + esc(b.id) + '">' + icon("undo", "icon--sm") + "Pulihkan</button>" : "") + "</li>";
      }).join("") || '<li class="muted">Belum ada cadangan. Cadangan dibuat otomatis saat draf disimpan.</li>';
    });
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-restore]"); if (!b) return;
      ui.confirm({ title: "Pulihkan cadangan ini?", text: "Draf saat ini diganti dengan isi cadangan (draf sekarang tetap dicadangkan dulu). Website berubah setelah dipublikasikan.", ok: "Pulihkan", icon: "undo", tone: "amber" }).then(function (y) {
        if (!y) return;
        A.api.call("backups/restore", { id: b.dataset.restore }).then(function (j) { S.content = j.content; S.emit("content"); ui.toast("Cadangan dipulihkan ke draf."); A.route(); }, function (er) { ui.toast(er.message, { type: "bad" }); });
      });
    });
  };

  /* ================================================================= AKUN */
  V.akun = function (root) {
    var d = { name: S.user.name, current: "", password: "", confirm: "" };
    root.innerHTML = H.head("Akun saya", esc(S.user.email) + " · " + (S.user.role === "superadmin" ? "SuperAdmin" : "Editor")) +
      '<div class="card" style="max-width:560px"><div class="card-head"><h2>Ganti kata sandi</h2></div><form class="card-body form" novalidate>' + F.text("name", "Nama tampilan") +
      F.text("current", "Kata sandi saat ini", { type: "password" }) + F.text("password", "Kata sandi baru", { type: "password", hint: "Minimal 10 karakter. Gabungkan kata yang mudah diingat, mis. “kopi-senin-pagi-2026”." }) +
      F.text("confirm", "Ulangi kata sandi baru", { type: "password" }) + '</form><div class="card-foot"><button type="button" class="btn btn--primary" data-save>' + icon("key") + "Simpan kata sandi</button></div></div>";
    ui.bindForm(root.querySelector("form"), d);
    root.querySelector("[data-save]").onclick = function (e) {
      if (d.password.length < 10) return ui.toast("Kata sandi baru minimal 10 karakter.", { type: "bad" });
      if (d.password !== d.confirm) return ui.toast("Ulangan kata sandi belum sama.", { type: "bad" });
      var b = e.currentTarget; b.classList.add("is-busy");
      A.api.call("account", d).then(function () { b.classList.remove("is-busy"); ui.toast("Kata sandi diganti."); S.user.name = d.name; S.emit("user"); A.route(); }, function (er) { b.classList.remove("is-busy"); ui.toast(er.message, { type: "bad" }); });
    };
  };
})(window);
