/* PKP SuperAdmin — halaman pengaturan konten website:
   Beranda, Produk, Aplikasi Mobile, Layanan, Partner & Klien, Karir, Training, Tentang & ISO, Kontak. */
(function (global) {
  "use strict";
  var A = global.PKPAdmin, u = A.u, esc = u.esc, ui = A.ui, S = A.store, F = ui.F, icon = ui.icon, sIcon = ui.siteIcon;
  var V = A.views = A.views || {};

  /* ---------------------------------------------------------------- pembantu bersama */
  var H = A.vh = {};
  H.head = function (title, desc, actions) {
    return '<div class="page-head"><div><h1>' + esc(title) + "</h1>" + (desc ? "<p>" + desc + "</p>" : "") + '</div><div class="page-actions">' + (actions || "") + "</div></div>";
  };
  H.visBadge = function (it) { return it.visible === false ? '<span class="badge badge--hidden">Disembunyikan</span>' : '<span class="badge badge--live">Tampil</span>'; };
  H.thumb = function (im, cls) {
    return '<span class="item-thumb ' + (cls || "") + '">' + (im && im.src ? '<img src="' + esc(A.imgUrl(im.src)) + '" alt="" loading="lazy" onerror="this.replaceWith(document.createTextNode(\'\'))">' : icon("image", "icon--sm")) + "</span>";
  };
  H.actions = function (id, extra) {
    return '<div class="item-actions">' + (extra || "") +
      '<button type="button" class="btn btn--ghost btn--icon btn--sm" data-act="toggle" data-id="' + esc(id) + '" aria-label="Tampilkan / sembunyikan" title="Tampilkan / sembunyikan">' + icon("eye", "icon--sm") + "</button>" +
      '<button type="button" class="btn btn--ghost btn--icon btn--sm" data-act="edit" data-id="' + esc(id) + '" aria-label="Edit" title="Edit">' + icon("edit", "icon--sm") + "</button>" +
      '<button type="button" class="btn btn--ghost btn--icon btn--sm" data-act="more" data-id="' + esc(id) + '" aria-label="Opsi lain" title="Opsi lain">' + icon("more", "icon--sm") + "</button></div>";
  };
  H.empty = function (ic, title, text, btn) {
    return '<div class="empty"><span class="item-icon">' + icon(ic) + "</span><b>" + esc(title) + "</b><p>" + esc(text) + "</p>" + (btn || "") + "</div>";
  };
  /* simpan + umpan balik */
  H.save = function (mut, note, okMsg) {
    return S.commit(mut, note).then(function (c) { ui.toast(okMsg || "Perubahan tersimpan sebagai draf.", { title: "Tersimpan" }); return c; });
  };
  /* operasi daftar standar (urut, tampil/sembunyi, hapus, duplikat) untuk key array di konten */
  H.listOps = function (root, key, opts) {
    opts = opts || {};
    var list = function (c) { return opts.path ? ui.getP(c, opts.path) : c[key]; };
    root.addEventListener("click", function (e) {
      var b = e.target.closest("[data-act]"); if (!b || !root.contains(b)) return;
      var id = b.dataset.id, act = b.dataset.act, items = list(S.content) || [], it = items.filter(function (x) { return x.id === id; })[0];
      if (act === "edit" && opts.edit) return opts.edit(it);
      if (act === "toggle") return H.save(function (c) { list(c).forEach(function (x) { if (x.id === id) x.visible = x.visible === false; }); },
        (it.visible === false ? "Menampilkan " : "Menyembunyikan ") + (it.name || it.title), it.visible === false ? "“" + (it.name || it.title) + "” akan tampil setelah dipublikasikan." : "“" + (it.name || it.title) + "” disembunyikan dari website.");
      if (act === "more") {
        var menu = [];
        if (opts.edit) menu.push({ label: "Edit", icon: "edit", onClick: function () { opts.edit(it); } });
        if (opts.duplicate !== false && !it.locked) menu.push({ label: "Duplikat", icon: "copy", onClick: function () {
          H.save(function (c) { var arr = list(c), i = arr.findIndex(function (x) { return x.id === id; }), cp = u.clone(arr[i]);
            cp.id = u.uid(key.slice(0, 3)); if (cp.slug) cp.slug = cp.slug + "-salinan"; if (cp.name) cp.name += " (salinan)"; if (cp.title) cp.title += " (salinan)"; cp.visible = false; arr.splice(i + 1, 0, cp); },
            "Duplikat " + (it.name || it.title), "Salinan dibuat dan disembunyikan — edit lalu tampilkan.");
        } });
        if (!it.locked) menu.push("-", { label: "Hapus", icon: "trash", danger: true, onClick: function () {
          ui.confirm({ title: "Hapus “" + (it.name || it.title) + "”?", text: "Item dihapus dari draf. Website berubah setelah dipublikasikan. Cadangan otomatis tetap tersimpan di Riwayat.", ok: "Hapus", danger: true }).then(function (y) {
            if (y) H.save(function (c) { var arr = list(c); arr.splice(arr.findIndex(function (x) { return x.id === id; }), 1); if (opts.onDelete) opts.onDelete(c, it); }, "Menghapus " + (it.name || it.title), "Item dihapus dari draf.");
          });
        } });
        ui.popover(b, menu);
      }
    });
  };
  H.sortList = function (ul, key, opts) {
    opts = opts || {};
    ui.sortable(ul, { grid: opts.grid, itemSel: opts.itemSel, handleSel: opts.handleSel, onMove: function (from, to) {
      H.save(function (c) {
        var arr = opts.path ? ui.getP(c, opts.path) : c[key];
        if (opts.filter) {           /* daftar yang ditampilkan adalah subset (mis. per bagian) */
          var sub = arr.filter(opts.filter), a = sub[from], b = sub[to];
          var ia = arr.indexOf(a), ib = arr.indexOf(b);
          arr.splice(ia, 1); arr.splice(ib, 0, a);
        } else arr.splice(to, 0, arr.splice(from, 1)[0]);
      }, "Mengubah urutan", "Urutan diperbarui.");
    } });
  };
  /* buka laci editor untuk satu objek; mutate(c, draft) menulis kembali */
  H.edit = function (o) {
    var draft = u.clone(o.item || {});
    var dr = ui.drawer({ title: o.title, badge: o.badge, form: o.form, preview: o.preview, saveLabel: o.saveLabel, validate: function () { return o.validate ? o.validate(draft) : null; },
      onSave: function () { return H.save(function (c) { o.apply(c, draft); }, o.note || ("Mengubah " + (draft.name || draft.title || o.title)), o.okMsg); } });
    var refresh = function () { if (dr.preview) { var c = u.clone(S.content); o.apply(c, u.clone(draft)); dr.preview.render(c); } };
    ui.bindForm(dr.form, draft, function () { dr.setDirty(true); refresh(); if (o.onChange) o.onChange(draft, dr); });
    if (o.after) o.after(dr, draft, refresh);
    if (dr.preview) { var c0 = u.clone(S.content); o.apply(c0, u.clone(draft)); dr.preview.renderNow(c0); }
    return dr;
  };
  var replaceById = function (arr, item, atStart) {
    var i = arr.findIndex(function (x) { return x.id === item.id; });
    if (i >= 0) arr[i] = item; else if (atStart) arr.unshift(item); else arr.push(item);
  };
  var uniqueSlug = function (list, slug, id) {
    var s = slug, n = 2;
    while ((list || []).some(function (x) { return x.slug === s && x.id !== id; })) s = slug + "-" + n++;
    return s;
  };
  H.replaceById = replaceById; H.uniqueSlug = uniqueSlug;

  /* repeater yang dipakai berulang */
  ui.defineRepeater("paragraphs", { addLabel: "Tambah paragraf", empty: "", fields: function (p) { return F.textarea(p, "Paragraf", { rows: 3, html: true, hint: "Boleh memakai &lt;b&gt;tebal&lt;/b&gt; dan &lt;a href=…&gt;tautan&lt;/a&gt;." }); } });
  ui.defineRepeater("definitions", { addLabel: "Tambah poin", empty: { term: "", desc: "" }, fields: function (p) {
    return '<div class="form-row" style="grid-template-columns:180px 1fr">' + F.text(p + ".term", "Judul poin", { placeholder: "mis. SMS Blast" }) + F.textarea(p + ".desc", "Penjelasan", { rows: 2, html: true }) + "</div>"; } });
  ui.defineRepeater("stats", { addLabel: "Tambah angka", empty: { value: "", suffix: "", label: "", animate: true }, max: 6, fields: function (p) {
    return '<div class="form-row form-row--3" style="grid-template-columns:110px 90px 1fr">' + F.text(p + ".value", "Angka", { placeholder: "30" }) + F.text(p + ".suffix", "Akhiran", { placeholder: "+" }) + F.text(p + ".label", "Keterangan", { placeholder: "Klien & partner" }) + "</div>" +
      F.toggle(p + ".animate", "Animasi menghitung naik saat terlihat"); } });
  ui.defineRepeater("ctas", { addLabel: "Tambah tombol", max: 2, empty: { label: "", url: "", style: "primary" }, fields: function (p) {
    return '<div class="form-row form-row--3" style="grid-template-columns:1fr 1fr 150px">' + F.text(p + ".label", "Teks tombol") + F.text(p + ".url", "Tujuan", { placeholder: "produk.html", mono: true }) +
      F.select(p + ".style", "Gaya", [["primary", "Utama (emas)"], ["ghost", "Garis putih"]]) + "</div>"; } });
  ui.defineRepeater("ekyc", { addLabel: "Tambah fitur", empty: { label: "", icon: "check" }, fields: function (p) {
    return '<div class="form-row" style="grid-template-columns:200px 1fr">' + F.icon(p + ".icon", "Ikon") + F.text(p + ".label", "Nama fitur") + "</div>"; } });
  ui.defineRepeater("hours", { addLabel: "Tambah baris", empty: { days: "", time: "" }, fields: function (p) {
    return '<div class="form-row">' + F.text(p + ".days", "Hari", { placeholder: "Senin – Jumat" }) + F.text(p + ".time", "Jam", { placeholder: "08.30 – 17.30" }) + "</div>"; } });
  ui.defineRepeater("infraItems", { addLabel: "Tambah layanan", empty: function () { return { id: u.uid("inf"), title: "", desc: "", icon: "check", link: null }; }, fields: function (p) {
    return '<div class="form-row" style="grid-template-columns:190px 1fr">' + F.icon(p + ".icon", "Ikon") + F.text(p + ".title", "Nama layanan") + "</div>" + F.textarea(p + ".desc", "Deskripsi singkat", { rows: 2, max: 120 }) +
      '<div class="form-row">' + F.text(p + ".link.label", "Teks tautan", { optional: true, placeholder: "Lihat program" }) + F.text(p + ".link.url", "Tujuan tautan", { optional: true, mono: true, placeholder: "training.html" }) + "</div>"; } });

  /* ================================================================= BERANDA */
  V.beranda = function (root) {
    var c = S.content, h = c.hero || {}, home = c.home || {};
    var refName = function (ref) {
      var t = ref.split(":"), it = (t[0] === "service" ? c.services : c.products).filter(function (x) { return x.slug === t[1]; })[0];
      return it ? { name: it.name, icon: it.icon, type: t[0] === "service" ? "Layanan" : "Produk", hidden: it.visible === false } : { name: ref + " (tidak ditemukan)", icon: "x", type: "", hidden: true };
    };
    var refList = function (key, title, desc, refs, kind) {
      return '<div class="card"><div class="list-head"><h3>' + esc(title) + '</h3><span class="hint">' + esc(desc) + '</span></div><ul class="sortable" data-refs="' + key + '">' +
        refs.map(function (r, i) {
          var it = kind === "ref" ? refName(r) : (function () { var src = kind === "service" ? c.services : c.products, x = src.filter(function (y) { return y.slug === r || y.id === r; })[0];
            return x ? { name: x.name, icon: x.icon, type: kind === "service" ? "Layanan" : "Produk", hidden: x.visible === false } : { name: r, icon: "x", type: "", hidden: true }; })();
          return '<li class="item' + (it.hidden ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser untuk mengurutkan">' + icon("grip") + '</button><span class="item-icon">' + sIcon(it.icon) +
            '</span><div class="item-main"><div class="item-title"><span>' + esc(it.name) + '</span></div><div class="item-sub">' + esc(it.type) + (it.hidden ? " · disembunyikan, tidak tampil" : "") + "</div></div>" +
            '<button type="button" class="btn btn--ghost btn--icon btn--sm" data-rm="' + key + '" data-i="' + i + '" aria-label="Keluarkan dari daftar">' + icon("x", "icon--sm") + "</button></li>";
        }).join("") + '</ul><div class="card-foot" style="justify-content:flex-start"><button type="button" class="btn btn--secondary btn--sm" data-addref="' + key + '" data-kind="' + kind + '">' + icon("plus", "icon--sm") + "Tambah item</button></div></div>";
    };
    root.innerHTML = H.head("Beranda", "Atur bagian pembuka, angka statistik, dan susunan konten yang tampil di halaman utama website.",
      '<button type="button" class="btn btn--secondary" data-prev>' + icon("eye") + "Pratinjau Beranda</button>") +
      '<div class="card"><div class="card-head"><div><h2>Hero — bagian pembuka</h2><p>Judul besar, kalimat pembuka, tombol, dan angka di bagian paling atas.</p></div><button type="button" class="btn btn--primary btn--sm" data-edit-hero>' + icon("edit", "icon--sm") + 'Edit hero</button></div>' +
      '<div class="card-body"><div style="padding:28px;border-radius:14px;background:linear-gradient(112deg,#0A2C46,#1A6FAA);color:#fff">' +
      '<div style="font-size:26px;font-weight:800;letter-spacing:-.02em;line-height:1.2;max-width:620px">' + esc(h.titleBefore) + ' <span style="color:#F5A524">' + esc(h.highlight) + "</span> " + esc(h.titleAfter) + "</div>" +
      '<p style="margin-top:10px;opacity:.8;max-width:620px">' + esc(h.lead) + '</p><div class="row" style="margin-top:16px">' + (h.ctas || []).map(function (b) {
        return '<span class="btn btn--sm" style="' + (b.style === "ghost" ? "border-color:rgba(255,255,255,.5);color:#fff" : "background:#F5A524;color:#0A2C46") + '">' + esc(b.label) + "</span>"; }).join("") + "</div>" +
      '<div class="row" style="margin-top:20px;gap:28px">' + (h.stats || []).map(function (s) { return '<div><b style="font-size:22px">' + esc(s.value) + esc(s.suffix) + '</b><div style="font-size:12px;opacity:.7">' + esc(s.label) + "</div></div>"; }).join("") + "</div></div>" +
      '<div class="row" style="margin-top:14px"><span class="hint">Industri tepercaya:</span>' + (h.trusted || []).map(function (t) { return '<span class="tag">' + esc(t) + "</span>"; }).join("") + "</div></div></div>" +
      '<div class="section-title"><div><h2>Portofolio — “Produk Software & Layanan IT”</h2><p>Dua kolom tautan di Beranda. Seret untuk mengurutkan.</p></div></div>' +
      '<div class="grid grid-2">' + refList("portfolio.product", "Kolom Product", "tautan ke halaman Produk/Layanan", (home.portfolio || {}).product || [], "ref") +
      refList("portfolio.service", "Kolom Service", "tautan ke halaman Produk/Layanan", (home.portfolio || {}).service || [], "ref") + "</div>" +
      '<div class="section-title"><div><h2>Produk unggulan (tab)</h2><p>Produk yang tampil sebagai tab interaktif. Ringkasan per produk diatur di menu Produk.</p></div></div>' +
      '<div class="grid grid-2">' + refList("featured", "Tab produk unggulan", "maks. 8", home.featured || [], "product") +
      refList("services", "Kartu layanan di Beranda", "4 disarankan", home.services || [], "service") + "</div>";

    root.querySelector("[data-prev]").onclick = function () { A.previewPage("index", S.content).catch(function (e) { ui.toast(e.message, { type: "bad" }); }); };
    root.querySelector("[data-edit-hero]").onclick = function () {
      H.edit({ title: "Edit hero Beranda", item: u.clone(S.content.hero), preview: { page: "index", selector: "section.hero" },
        form: '<div class="form-row" style="grid-template-columns:1fr 1fr">' + F.text("titleBefore", "Judul — awal", { placeholder: "Partner Terpercaya" }) + F.text("highlight", "Judul — kata disorot (emas)", { placeholder: "Transformasi Digital" }) + "</div>" +
          F.text("titleAfter", "Judul — akhir", { placeholder: "Bisnis Anda" }) + F.textarea("lead", "Kalimat pembuka", { rows: 3, max: 220 }) +
          F.repeater("ctas", "Tombol", { id: "ctas", hint: "Maksimal 2 tombol." }) + F.repeater("stats", "Angka statistik", { id: "stats", hint: "Angka bulat akan beranimasi menghitung naik." }) +
          F.tags("trusted", "Industri tepercaya (baris di bawah hero)", { hint: "Ditampilkan dalam huruf kapital." }),
        validate: function (d) { return !d.titleBefore && !d.highlight ? "Judul hero wajib diisi." : null; },
        apply: function (c, d) { c.hero = d; }, note: "Mengubah hero Beranda", okMsg: "Hero Beranda tersimpan sebagai draf." });
    };
    root.querySelectorAll("[data-refs]").forEach(function (ul) {
      var key = ul.dataset.refs;
      ui.sortable(ul, { onMove: function (f, t) { H.save(function (c) { var a = ui.getP(c.home, key); a.splice(t, 0, a.splice(f, 1)[0]); }, "Urutan Beranda", "Urutan diperbarui."); } });
    });
    root.addEventListener("click", function (e) {
      var rm = e.target.closest("[data-rm]"); if (rm) H.save(function (c) { ui.getP(c.home, rm.dataset.rm).splice(+rm.dataset.i, 1); }, "Mengubah susunan Beranda", "Item dikeluarkan dari daftar.");
      var add = e.target.closest("[data-addref]");
      if (add) {
        var key = add.dataset.addref, kind = add.dataset.kind, cur = ui.getP(S.content.home, key) || [];
        var opts = kind === "ref" ? S.content.products.map(function (p) { return ["product:" + p.slug, "Produk — " + p.name]; }).concat(S.content.services.map(function (s) { return ["service:" + s.slug, "Layanan — " + s.name]; }))
          : (kind === "service" ? S.content.services : S.content.products.filter(function (p) { return p.section === "main" || p.section === "comm"; })).map(function (p) { return [kind === "service" ? p.id : p.slug, p.name]; });
        opts = opts.filter(function (o) { return cur.indexOf(o[0]) < 0; });
        if (!opts.length) return ui.toast("Semua item sudah ada di daftar.");
        var body = ui.el('<div class="form">' + F.select("pick", "Pilih item", opts) + "</div>"), m = { pick: opts[0][0] };
        ui.bindForm(body, m);
        ui.modal({ title: "Tambah item", body: body, icon: "plus", actions: [{ label: "Batal", kind: "ghost" }, { label: "Tambahkan", kind: "primary", onClick: function () {
          return H.save(function (c) { var a = ui.getP(c.home, key); if (!a) { ui.setP(c.home, key, []); a = ui.getP(c.home, key); } a.push(m.pick); }, "Mengubah susunan Beranda", "Item ditambahkan.");
        } }] });
      }
    });
  };

  /* ================================================================= PRODUK */
  var SECTIONS = { main: "Produk software", comm: "Komunikasi & call center", mobile: "Bagian khusus", ekyc: "Bagian khusus" };
  V.produk = function (root) {
    var c = S.content, P = c.products || [], featured = (c.home || {}).featured || [];
    var row = function (p) {
      var media = p.image && p.image.src ? H.thumb(p.image) : '<span class="item-thumb">' + (p.mockupHtml ? '<span class="tag" style="font-size:10px">Mockup</span>' : sIcon(p.icon)) + "</span>";
      return '<li class="item' + (p.visible === false ? " is-hidden" : "") + '" data-id="' + esc(p.id) + '"><button type="button" class="handle" aria-label="Geser untuk mengurutkan ' + esc(p.name) + '">' + icon("grip") + "</button>" + media +
        '<div class="item-main"><div class="item-title"><span>' + esc(p.name) + "</span>" + (featured.indexOf(p.slug) >= 0 ? '<span class="badge badge--new badge--plain" title="Tampil sebagai tab di Beranda">' + icon("star", "icon--sm") + "Unggulan</span>" : "") +
        '</div><div class="item-sub">' + esc(p.kicker || "") + ' · <span class="mono">#' + esc(p.slug) + "</span></div></div>" +
        '<div class="item-meta">' + H.visBadge(p) + "</div>" + H.actions(p.id) + "</li>";
    };
    var group = function (sec, title, desc, addable) {
      var items = P.filter(function (p) { return sec.indexOf(p.section) >= 0; });
      return '<div class="card" style="margin-bottom:16px"><div class="list-head"><h3>' + esc(title) + '</h3><span class="hint">' + esc(desc) + "</span>" +
        (addable ? '<button type="button" class="btn btn--secondary btn--xs" data-add="' + sec[0] + '">' + icon("plus", "icon--sm") + "Tambah</button>" : "") +
        '</div><ul class="sortable" data-sec="' + sec.join(",") + '">' + items.map(row).join("") + "</ul></div>";
    };
    root.innerHTML = H.head("Produk", "Produk yang tampil di halaman <b>Produk</b> dan di Beranda. Seret untuk mengubah urutan; urutan yang sama dipakai di menu navigasi produk.",
      '<button type="button" class="btn btn--secondary" data-prev>' + icon("eye") + 'Pratinjau halaman</button><button type="button" class="btn btn--primary" data-add="main">' + icon("plus") + "Produk baru</button>") +
      group(["main"], "Produk software", "Baris bergantian gambar–teks di halaman Produk", false) +
      group(["comm"], "Komunikasi & call center", "Bagian berlatar gelap (Messaging, Call Center)", true) +
      group(["mobile", "ekyc"], "Bagian khusus", "Judul & deskripsi bagian Mobile Application dan E-KYC. Daftar aplikasinya diatur di menu Aplikasi Mobile.", false);
    root.querySelector("[data-prev]").onclick = function () { A.previewPage("produk", S.content).catch(function (e) { ui.toast(e.message, { type: "bad" }); }); };
    root.querySelectorAll("[data-sec]").forEach(function (ul) {
      var secs = ul.dataset.sec.split(",");
      H.sortList(ul, "products", { filter: function (p) { return secs.indexOf(p.section) >= 0; } });
    });
    H.listOps(root, "products", { edit: editProduct, onDelete: function (c, it) {
      c.home.featured = (c.home.featured || []).filter(function (s) { return s !== it.slug; });
      ["product", "service"].forEach(function (k) { c.home.portfolio[k] = (c.home.portfolio[k] || []).filter(function (r) { return r !== "product:" + it.slug; }); });
    } });
    root.querySelectorAll("[data-add]").forEach(function (b) { b.onclick = function () {
      editProduct({ id: u.uid("prd"), slug: "", section: b.dataset.add, name: "", navLabel: "", kicker: "", icon: "layers", paragraphs: [""], definitions: [], features: [], image: null,
        mockupHtml: "", cta: null, visible: true, locked: false, tabLabel: "", tabCategory: "", summary: "", _new: true });
    }; });
  };
  function editProduct(p) {
    var isNew = !!p._new, special = p.section === "mobile" || p.section === "ekyc", comm = p.section === "comm";
    var d = u.clone(p); delete d._new;
    d._featured = (S.content.home.featured || []).indexOf(p.slug) >= 0;
    d.cta = d.cta || { label: "", url: "", newTab: false };
    var form = '<fieldset class="form"><legend class="sr-only">Informasi utama</legend>' +
      F.text("name", special ? "Judul bagian" : "Nama produk", { required: true, placeholder: "mis. Beyond Fincore +" }) +
      '<div class="form-row">' + F.text("navLabel", "Label singkat", { hint: "Untuk menu navigasi produk & tab Beranda." }) + F.text("kicker", special ? "Label kecil di atas judul" : "Kategori (label kecil)", { placeholder: "Loan & Financing" }) + "</div>" +
      '<div class="form-row">' + F.icon("icon", "Ikon") + F.text("slug", "Alamat bagian", { prefix: "produk.html#", mono: true, hint: special ? "Tidak dapat diubah." : "Huruf kecil & tanda hubung." }) + "</div></fieldset>";
    if (special) form += F.textarea("paragraphs.0", "Deskripsi bagian", { rows: 3, max: 240 }) + (p.section === "ekyc" ? F.repeater("ekycFeatures", "Daftar fitur E-KYC", { id: "ekyc" }) : "");
    else {
      form += F.repeater("paragraphs", "Deskripsi", { id: "paragraphs" }) + (comm ? F.repeater("definitions", "Poin penjelasan (opsional)", { id: "definitions" }) : "") +
        F.tags("features", "Fitur unggulan", { hint: "Tampil sebagai label kecil di bawah deskripsi. Tekan Enter setiap fitur." }) +
        (p.mockupHtml && !(p.image && p.image.src) ? '<div class="callout callout--info">' + icon("info") + "<div><b>Saat ini memakai mockup tampilan bawaan</b>Unggah screenshot produk untuk menggantinya.</div></div>" : "") +
        F.image("image", "Screenshot produk", { kind: "photo", folder: "media", maxW: 1760, hint: "Disarankan rasio 4:3, lebar minimal 1760 px agar tajam di layar retina." }) +
        '<div class="fieldset"><legend>Tombol aksi <span class="opt">opsional</span></legend><div class="form-row" style="margin-top:6px">' + F.text("cta.label", "Teks tombol", { placeholder: "Kunjungi KlinikCare" }) + F.text("cta.url", "Tujuan", { mono: true, placeholder: "https://… atau kontak.html" }) + "</div>" +
        F.toggle("cta.newTab", "Buka di tab baru (untuk situs luar)") + "</div>" +
        '<div class="fieldset"><legend>Tampilan di Beranda</legend>' + F.toggle("_featured", "Tampilkan sebagai tab Produk Unggulan") +
        '<div class="form-row" style="margin-top:12px">' + F.text("tabLabel", "Nama di tab", { placeholder: "iColls" }) + F.text("tabCategory", "Kategori di tab", { placeholder: "Collection" }) + "</div>" +
        F.textarea("summary", "Ringkasan di Beranda", { rows: 3, max: 180, min: 80 }) + "</div>";
    }
    form += F.toggle("visible", "Tampilkan di website");
    var spec = special ? { page: "produk", selector: "#" + p.slug } : { page: "produk", selector: '[data-cms="' + (comm ? "products-comm" : "products-main") + '"] #' + (p.slug || "__baru"),
      wrap: function (html) { return '<section class="section' + (comm ? " section--night" : "") + '"><div class="container showcase">' + html + "</div></section>"; } };
    var dr = H.edit({ title: isNew ? "Produk baru" : "Edit produk", badge: SECTIONS[p.section] ? '<span class="badge badge--plain">' + esc(SECTIONS[p.section]) + "</span>" : "", item: d, form: form, preview: spec,
      validate: function (x) { if (!x.name) return "Nama produk wajib diisi."; if (!special && !x.slug) return "Alamat bagian wajib diisi."; return null; },
      onChange: function (x, drw) {
        if (isNew && !x._slugTouched) { x.slug = u.slugify(x.navLabel || x.name); var s = drw.form.querySelector('[data-path="slug"]'); if (s) s.value = x.slug; }
        if (spec.selector && !special) { spec.selector = '[data-cms="' + (comm ? "products-comm" : "products-main") + '"] #' + (x.slug || "__baru"); }
      },
      after: function (drw, x) {
        if (special) drw.form.querySelector('[data-path="slug"]').disabled = true;
        var s = drw.form.querySelector('[data-path="slug"]'); if (s) s.addEventListener("input", function () { x._slugTouched = true; x.slug = u.slugify(s.value); });
      },
      apply: function (c, x) {
        var out = u.clone(x), featured = out._featured, oldSlug = p.slug;
        delete out._featured; delete out._slugTouched;
        if (!special) out.slug = uniqueSlug(c.products, u.slugify(out.slug || out.name), out.id);
        if (out.cta && !out.cta.label) out.cta = null;
        out.paragraphs = (out.paragraphs || []).filter(function (t) { return String(t).trim(); });
        out.tabLabel = out.tabLabel || out.navLabel || out.name; out.navLabel = out.navLabel || out.name; out.tabCategory = out.tabCategory || out.kicker;
        replaceById(c.products, out);
        var f = c.home.featured = (c.home.featured || []).map(function (s) { return s === oldSlug ? out.slug : s; });
        if (oldSlug && oldSlug !== out.slug) ["product", "service"].forEach(function (k) { c.home.portfolio[k] = (c.home.portfolio[k] || []).map(function (r) { return r === "product:" + oldSlug ? "product:" + out.slug : r; }); });
        if (!special) { var i = f.indexOf(out.slug); if (featured && i < 0) f.push(out.slug); if (!featured && i >= 0) f.splice(i, 1); }
      },
      note: (isNew ? "Menambah produk " : "Mengubah produk ") + (p.name || ""), okMsg: isNew ? "Produk baru tersimpan sebagai draf." : null });
    return dr;
  }
  A.editProduct = editProduct;

  /* ================================================================= APLIKASI MOBILE */
  V.aplikasi = function (root) {
    var apps = S.content.apps || [];
    root.innerHTML = H.head("Aplikasi Mobile", "Kartu aplikasi di bagian <b>Mobile Application</b> halaman Produk. Seret untuk mengurutkan.",
      '<button type="button" class="btn btn--primary" data-add>' + icon("plus") + "Aplikasi baru</button>") +
      '<div class="card"><ul class="sortable">' + (apps.length ? apps.map(function (a) {
        return '<li class="item' + (a.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(a.name) + '">' + icon("grip") + "</button>" + H.thumb(a.image, "item-thumb--tall") +
          '<div class="item-main"><div class="item-title"><span>' + esc(a.name) + '</span></div><div class="item-sub">' + esc(a.desc) + '</div></div><div class="item-meta">' + H.visBadge(a) + "</div>" + H.actions(a.id) + "</li>";
      }).join("") : "") + "</ul>" + (apps.length ? "" : H.empty("smartphone", "Belum ada aplikasi", "Tambahkan aplikasi mobile pertama.", "")) + "</div>";
    H.sortList(root.querySelector(".sortable"), "apps");
    var edit = function (a, isNew) {
      H.edit({ title: isNew ? "Aplikasi baru" : "Edit aplikasi", item: a, preview: { page: "produk", selector: "#mobile" },
        form: F.text("name", "Nama aplikasi", { required: true }) + F.textarea("desc", "Deskripsi singkat", { rows: 3, max: 110 }) +
          F.image("image", "Screenshot aplikasi", { kind: "app", folder: "apps", maxW: 434, hint: "Tangkapan layar ponsel tegak (rasio ± 9:19)." }) + F.toggle("visible", "Tampilkan di website"),
        validate: function (x) { return x.name ? null : "Nama aplikasi wajib diisi."; },
        apply: function (c, x) { replaceById(c.apps, x); }, note: (isNew ? "Menambah aplikasi " : "Mengubah aplikasi ") + (a.name || "") });
    };
    H.listOps(root, "apps", { edit: function (a) { edit(a); } });
    root.querySelector("[data-add]").onclick = function () { edit({ id: u.uid("app"), name: "", desc: "", image: null, visible: true }, true); };
  };

  /* ================================================================= LAYANAN */
  V.layanan = function (root, params) {
    var tab = params[0] || "utama", c = S.content;
    root.innerHTML = H.head("Layanan", "Isi halaman <b>Layanan</b>: kartu layanan utama, kelompok Infrastructure & Services, dan solusi per industri.") +
      '<div class="tabs" role="tablist">' + [["utama", "Layanan utama", (c.services || []).length], ["infrastruktur", "Infrastructure & Services", ((c.infrastructure || {}).groups || []).length], ["industri", "Solusi per industri", (c.industries || []).length]].map(function (t) {
        return '<button type="button" role="tab" aria-selected="' + (t[0] === tab) + '" data-tab="' + t[0] + '">' + t[1] + ' <span class="count">' + t[2] + "</span></button>"; }).join("") + '</div><div data-pane></div>';
    root.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { location.hash = "#/layanan/" + b.dataset.tab; }; });
    var pane = root.querySelector("[data-pane]");
    if (tab === "utama") {
      pane.innerHTML = '<div class="row" style="margin-bottom:12px"><span class="hint">Kartu layanan berlatar terang. Yang dipilih untuk Beranda diatur di menu Beranda.</span><span class="spacer"></span><button type="button" class="btn btn--primary btn--sm" data-add>' + icon("plus", "icon--sm") + "Layanan baru</button></div>" +
        '<div class="card"><ul class="sortable">' + (c.services || []).map(function (s) {
          return '<li class="item' + (s.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(s.name) + '">' + icon("grip") + '</button><span class="item-icon">' + sIcon(s.icon) + '</span><div class="item-main"><div class="item-title"><span>' + esc(s.name) +
            '</span></div><div class="item-sub">' + esc((s.features || []).join(" · ")) + '</div></div><div class="item-meta">' + H.visBadge(s) + "</div>" + H.actions(s.id) + "</li>";
        }).join("") + "</ul></div>";
      H.sortList(pane.querySelector(".sortable"), "services");
      var editS = function (s, isNew) {
        H.edit({ title: isNew ? "Layanan baru" : "Edit layanan", item: s, preview: { page: "layanan", selector: '[data-cms="services-cards"]', closest: "section" },
          form: F.text("name", "Nama layanan", { required: true }) + '<div class="form-row">' + F.icon("icon", "Ikon") + F.text("slug", "Alamat", { prefix: "layanan.html#", mono: true }) + "</div>" +
            F.textarea("desc", "Deskripsi", { rows: 3, max: 200 }) + F.tags("features", "Cakupan layanan", { hint: "Ditampilkan sebagai label di kartu halaman Layanan." }) +
            F.tags("homeFeatures", "Cakupan ringkas di Beranda", { optional: true, hint: "Kosongkan untuk memakai daftar yang sama." }) + F.toggle("visible", "Tampilkan di website"),
          validate: function (x) { return x.name ? null : "Nama layanan wajib diisi."; },
          onChange: function (x, drw) { if (isNew && !x._t) { x.slug = u.slugify(x.name); drw.form.querySelector('[data-path="slug"]').value = x.slug; } },
          after: function (drw, x) { drw.form.querySelector('[data-path="slug"]').addEventListener("input", function () { x._t = 1; }); },
          apply: function (cc, x) { var o = u.clone(x); delete o._t; var old = s.slug; o.slug = uniqueSlug(cc.services, u.slugify(o.slug || o.name), o.id); if (!(o.homeFeatures || []).length) delete o.homeFeatures;
            replaceById(cc.services, o);
            if (old && old !== o.slug) ["product", "service"].forEach(function (k) { cc.home.portfolio[k] = (cc.home.portfolio[k] || []).map(function (r) { return r === "service:" + old ? "service:" + o.slug : r; }); });
          }, note: (isNew ? "Menambah layanan " : "Mengubah layanan ") + (s.name || "") });
      };
      H.listOps(pane, "services", { edit: function (s) { editS(s); }, onDelete: function (cc, it) {
        cc.home.services = (cc.home.services || []).filter(function (x) { return x !== it.id; });
        ["product", "service"].forEach(function (k) { cc.home.portfolio[k] = (cc.home.portfolio[k] || []).filter(function (r) { return r !== "service:" + it.slug; }); });
      } });
      pane.querySelector("[data-add]").onclick = function () { editS({ id: u.uid("svc"), slug: "", name: "", icon: "briefcase", desc: "", features: [], visible: true }, true); };
    }
    if (tab === "infrastruktur") {
      var inf = c.infrastructure || { groups: [] };
      pane.innerHTML = '<div class="card card-pad row" style="margin-bottom:16px"><div class="item-main"><div class="item-title"><span>' + esc(inf.title) + '</span></div><div class="item-sub" style="white-space:normal">' + esc(inf.lead) + "</div></div>" +
        '<button type="button" class="btn btn--secondary btn--sm" data-head>' + icon("edit", "icon--sm") + 'Edit judul bagian</button></div>' +
        '<div class="row" style="margin-bottom:12px"><span class="hint">Setiap kelompok tampil sebagai panel yang bisa dibuka-tutup. Jumlah layanan dihitung otomatis.</span><span class="spacer"></span><button type="button" class="btn btn--primary btn--sm" data-add>' + icon("plus", "icon--sm") + "Kelompok baru</button></div>" +
        '<div class="card"><ul class="sortable">' + inf.groups.map(function (g) {
          return '<li class="item' + (g.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(g.title) + '">' + icon("grip") + '</button><span class="item-icon">' + sIcon(g.icon) + '</span><div class="item-main"><div class="item-title"><span>' + esc(g.title) +
            '</span><span class="badge badge--plain">' + (g.items || []).length + ' layanan</span></div><div class="item-sub">' + esc((g.items || []).map(function (x) { return x.title; }).join(" · ")) + '</div></div><div class="item-meta">' + H.visBadge(g) + "</div>" + H.actions(g.id) + "</li>";
        }).join("") + "</ul></div>";
      H.sortList(pane.querySelector(".sortable"), "groups", { path: "infrastructure.groups" });
      var editG = function (g, isNew) {
        H.edit({ title: isNew ? "Kelompok baru" : "Edit kelompok", item: g, preview: { page: "layanan", selector: '[data-cms="infra-groups"]', wrap: function (h) { return '<section class="section section--night"><div class="container">' + h + "</div></section>"; } },
          form: F.text("title", "Nama kelompok", { required: true }) + F.textarea("desc", "Deskripsi kelompok", { rows: 2, max: 120 }) +
            '<div class="form-row">' + F.icon("icon", "Ikon") + F.select("tone", "Warna ikon", [["sky", "Biru"], ["amber", "Emas"], ["mint", "Hijau mint"]]) + "</div>" +
            F.repeater("items", "Daftar layanan", { id: "infraItems" }) + F.toggle("visible", "Tampilkan di website"),
          validate: function (x) { return x.title ? null : "Nama kelompok wajib diisi."; },
          apply: function (cc, x) { (x.items || []).forEach(function (it) { if (it.link && !it.link.url) it.link = null; }); replaceById(cc.infrastructure.groups, x); }, note: "Mengubah kelompok " + (g.title || "") });
      };
      H.listOps(pane, "groups", { path: "infrastructure.groups", edit: function (g) { editG(g); } });
      pane.querySelector("[data-add]").onclick = function () { editG({ id: u.uid("grp"), title: "", desc: "", icon: "server", tone: "sky", items: [], visible: true }, true); };
      pane.querySelector("[data-head]").onclick = function () {
        var hd = { eyebrow: inf.eyebrow, title: inf.title, lead: inf.lead };
        H.edit({ title: "Judul bagian Infrastructure", item: hd, preview: { page: "layanan", selector: "#infrastructure" },
          form: F.text("eyebrow", "Label kecil") + F.text("title", "Judul") + F.textarea("lead", "Deskripsi", { rows: 3, max: 220 }),
          apply: function (cc, x) { cc.infrastructure.eyebrow = x.eyebrow; cc.infrastructure.title = x.title; cc.infrastructure.lead = x.lead; }, note: "Mengubah judul Infrastructure" });
      };
    }
    if (tab === "industri") {
      pane.innerHTML = '<div class="row" style="margin-bottom:12px"><span class="hint">Kartu “Solusi per Industri” di bagian bawah halaman Layanan.</span><span class="spacer"></span><button type="button" class="btn btn--primary btn--sm" data-add>' + icon("plus", "icon--sm") + "Industri baru</button></div>" +
        '<div class="card"><ul class="sortable">' + (c.industries || []).map(function (s) {
          return '<li class="item' + (s.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(s.title) + '">' + icon("grip") + '</button><span class="item-icon">' + sIcon(s.icon) + '</span><div class="item-main"><div class="item-title"><span>' + esc(s.title) +
            '</span></div><div class="item-sub">' + esc(s.desc) + '</div></div><div class="item-meta">' + H.visBadge(s) + "</div>" + H.actions(s.id) + "</li>";
        }).join("") + "</ul></div>";
      H.sortList(pane.querySelector(".sortable"), "industries");
      var editI = function (s, isNew) {
        H.edit({ title: isNew ? "Industri baru" : "Edit industri", item: s, preview: { page: "layanan", selector: '[data-cms="industries"]', wrap: function (h) { return '<section class="section section--night"><div class="container">' + h + "</div></section>"; } },
          form: F.text("title", "Nama industri", { required: true }) + F.textarea("desc", "Deskripsi", { rows: 3, max: 200 }) +
            '<div class="form-row">' + F.icon("icon", "Ikon") + F.select("tone", "Gaya ikon", [["sky", "Biru"], ["dark", "Gelap"], ["dark-mint", "Gelap, ikon mint"]]) + "</div>" + F.toggle("visible", "Tampilkan di website"),
          validate: function (x) { return x.title ? null : "Nama industri wajib diisi."; },
          apply: function (cc, x) { replaceById(cc.industries, x); }, note: "Mengubah industri " + (s.title || "") });
      };
      H.listOps(pane, "industries", { edit: function (s) { editI(s); } });
      pane.querySelector("[data-add]").onclick = function () { editI({ id: u.uid("ind"), title: "", desc: "", icon: "globe", tone: "sky", visible: true }, true); };
    }
  };

  /* ================================================================= PARTNER & KLIEN */
  V.partner = function (root, params) {
    var tab = params[0] === "klien" ? "clients" : "partners", c = S.content, list = c[tab] || [];
    var label = tab === "partners" ? "partner" : "klien";
    root.innerHTML = H.head("Partner & Klien", "Logo di halaman <b>Partner</b> dan Beranda. Seret kartu untuk mengurutkan; logo diskalakan otomatis agar bobot visualnya seimbang.",
      '<button type="button" class="btn btn--secondary" data-stats>' + icon("chart") + 'Angka ringkasan</button><button type="button" class="btn btn--primary" data-add>' + icon("plus") + "Tambah " + label + "</button>") +
      '<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (tab === "partners") + '" data-tab="partner">Partner <span class="count">' + (c.partners || []).length + '</span></button>' +
      '<button type="button" role="tab" aria-selected="' + (tab === "clients") + '" data-tab="klien">Klien <span class="count">' + (c.clients || []).length + "</span></button></div>" +
      '<div class="logo-board" data-board>' + list.map(function (p) {
        return '<div class="logo-card' + (p.visible === false ? " is-hidden" : "") + '" data-id="' + esc(p.id) + '"><div class="logo-stage" title="Seret untuk mengurutkan" tabindex="0" aria-label="Geser ' + esc(p.name) + ' (Alt+panah)">' +
          (p.logo && p.logo.src ? '<img src="' + esc(A.imgUrl(p.logo.src)) + '" alt="" style="width:' + p.logo.w + "px;height:" + p.logo.h + 'px">' : '<span class="logo-word" style="--c:' + esc(p.color) + '">' + esc(p.name) + "</span>") +
          '</div><div class="logo-info"><b title="' + esc(p.name) + '">' + esc(p.name) + "</b>" +
          '<button type="button" class="btn btn--ghost btn--icon btn--xs" data-act="toggle" data-id="' + esc(p.id) + '" aria-label="Tampilkan / sembunyikan ' + esc(p.name) + '">' + icon(p.visible === false ? "eyeoff" : "eye", "icon--sm") + "</button>" +
          '<button type="button" class="btn btn--ghost btn--icon btn--xs" data-act="more" data-id="' + esc(p.id) + '" aria-label="Opsi ' + esc(p.name) + '">' + icon("more", "icon--sm") + "</button></div></div>";
      }).join("") + '<button type="button" class="logo-add" data-static data-add>' + icon("plus", "icon--lg") + "Tambah " + label + "</button></div>";
    root.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { location.hash = "#/partner/" + b.dataset.tab; }; });
    H.sortList(root.querySelector("[data-board]"), tab, { grid: true, itemSel: ".logo-card", handleSel: ".logo-stage" });
    var edit = function (p, isNew) {
      H.edit({ title: isNew ? "Tambah " + label : "Edit " + label, item: p, preview: { page: "partner", selector: '[data-cms="' + tab + '"]', closest: "section" },
        form: F.text("name", "Nama perusahaan", { required: true }) + F.image("logo", "Logo", { kind: "logo", folder: tab, alt: false, hint: "PNG transparan paling rapi. Latar putih dapat dihapus otomatis." }) +
          '<div class="field"><label for="f-color">Warna teks cadangan</label><div class="row"><input type="color" id="f-color" data-path="color" style="width:52px;height:40px;border:1px solid var(--line-2);border-radius:10px;padding:3px;background:#fff">' +
          '<span class="hint">Dipakai bila logo belum diunggah — nama perusahaan ditampilkan sebagai teks berwarna.</span></div></div>' + F.toggle("visible", "Tampilkan di website"),
        validate: function (x) { return x.name ? null : "Nama perusahaan wajib diisi."; },
        apply: function (cc, x) { replaceById(cc[tab], x); }, note: (isNew ? "Menambah " : "Mengubah ") + label + " " + (p.name || ""), okMsg: isNew ? "Logo " + label + " ditambahkan ke draf." : null });
    };
    H.listOps(root, tab, { edit: function (p) { edit(p); }, duplicate: false });
    root.querySelector("[data-board]").addEventListener("dblclick", function (e) { var cd = e.target.closest(".logo-card"); if (cd) edit((S.content[tab] || []).filter(function (x) { return x.id === cd.dataset.id; })[0]); });
    root.querySelectorAll("[data-add]").forEach(function (b) { b.onclick = function () { edit({ id: u.uid(tab.slice(0, 3)), name: "", logo: null, color: "#1A6FAA", visible: true }, true); }; });
    root.querySelector("[data-stats]").onclick = function () {
      var st = { list: u.clone((S.content.stats || {}).partner || []) };
      H.edit({ title: "Angka ringkasan kemitraan", item: st, preview: { page: "partner", selector: '[data-cms="partner-stats"]', closest: "section" },
        form: '<div class="callout callout--info">' + icon("info") + "<div><b>Data saat ini</b>" + (S.content.partners || []).filter(function (x) { return x.visible !== false; }).length + " partner dan " +
          (S.content.clients || []).filter(function (x) { return x.visible !== false; }).length + " klien tampil di website.</div></div>" + F.repeater("list", "Angka", { id: "stats" }),
        apply: function (cc, x) { cc.stats = cc.stats || {}; cc.stats.partner = x.list; }, note: "Mengubah angka kemitraan" });
    };
  };

  /* ================================================================= KARIR */
  V.karir = function (root) {
    var c = S.content, jobs = c.jobs || [], dl = function (k) { var d = (c.departments || []).filter(function (x) { return x.key === k; })[0]; return d ? d.label : k; };
    root.innerHTML = H.head("Karir", "Lowongan di halaman <b>Karir</b>. Tombol “Lamar” membuka tautan pendaftaran di tab baru.",
      '<button type="button" class="btn btn--secondary" data-dept>' + icon("tag") + 'Kelola divisi</button><button type="button" class="btn btn--primary" data-add>' + icon("plus") + "Lowongan baru</button>") +
      '<div class="card"><div class="toolbar"><b>' + jobs.filter(function (j) { return j.visible !== false; }).length + ' posisi terbuka</b><span class="hint">· ' + jobs.length + " total</span></div>" +
      (jobs.length ? '<ul class="sortable">' + jobs.map(function (j) {
        return '<li class="item' + (j.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(j.title) + '">' + icon("grip") + '</button><span class="item-icon">' + icon("briefcase") + '</span><div class="item-main"><div class="item-title"><span>' + esc(j.title) +
          '</span></div><div class="item-sub">' + esc(dl(j.dept)) + " · " + esc(j.location) + " · " + esc(j.type) + '</div></div><div class="item-meta">' + (j.visible === false ? '<span class="badge badge--hidden">Ditutup</span>' : '<span class="badge badge--live">Dibuka</span>') + "</div>" + H.actions(j.id) + "</li>";
      }).join("") + "</ul>" : H.empty("briefcase", "Belum ada lowongan", "Saat tidak ada lowongan, halaman Karir tetap menampilkan ajakan mengirim CV.", "")) + "</div>";
    if (jobs.length) H.sortList(root.querySelector(".sortable"), "jobs");
    var edit = function (j, isNew) {
      H.edit({ title: isNew ? "Lowongan baru" : "Edit lowongan", item: j, preview: { page: "karir", selector: '[data-cms="jobs"]', closest: "section" },
        form: F.text("title", "Nama posisi", { required: true, placeholder: "mis. Backend Developer (Java)" }) +
          '<div class="form-row">' + F.select("dept", "Divisi", (S.content.departments || []).map(function (d) { return [d.key, d.label]; })) +
          F.select("type", "Jenis", [["Full-time", "Full-time"], ["Kontrak", "Kontrak"], ["Magang", "Magang"], ["Paruh waktu", "Paruh waktu"]]) + "</div>" +
          F.text("location", "Lokasi", { placeholder: "Cibubur / Hybrid" }) + F.text("url", "Tautan pendaftaran", { mono: true, hint: "Default: portal karir PKP." }) + F.toggle("visible", "Lowongan dibuka (tampil di website)"),
        validate: function (x) { return x.title ? null : "Nama posisi wajib diisi."; },
        apply: function (cc, x) { replaceById(cc.jobs, x, true); }, note: (isNew ? "Menambah lowongan " : "Mengubah lowongan ") + (j.title || "") });
    };
    H.listOps(root, "jobs", { edit: function (j) { edit(j); } });
    root.querySelector("[data-add]").onclick = function () { edit({ id: u.uid("job"), title: "", dept: ((S.content.departments || [])[0] || {}).key || "", location: "Cibubur", type: "Full-time", url: "https://karir.pkp.co.id/", visible: true }, true); };
    root.querySelector("[data-dept]").onclick = function () {
      var m = { list: u.clone(S.content.departments || []) };
      ui.defineRepeater("dept", { addLabel: "Tambah divisi", empty: function () { return { key: "", label: "" }; }, fields: function (p) { return F.text(p + ".label", "Nama divisi"); } });
      var body = ui.el('<div class="form">' + F.repeater("list", "Divisi (pilihan filter di halaman Karir)", { id: "dept" }) + "</div>");
      ui.bindForm(body, m);
      ui.modal({ title: "Kelola divisi", icon: "tag", body: body, wide: true, actions: [{ label: "Batal", kind: "ghost" }, { label: "Simpan", kind: "primary", onClick: function () {
        var used = {}; m.list = m.list.filter(function (d) { return d.label; }).map(function (d) { d.key = d.key || u.slugify(d.label); return d; });
        (S.content.jobs || []).forEach(function (j) { used[j.dept] = 1; });
        var missing = Object.keys(used).filter(function (k) { return !m.list.some(function (d) { return d.key === k; }); });
        if (missing.length) { ui.toast("Divisi masih dipakai lowongan: " + missing.join(", ") + ". Pindahkan lowongannya dulu.", { type: "bad" }); return false; }
        return H.save(function (cc) { cc.departments = m.list; }, "Mengubah divisi karir");
      } }] });
    };
  };

  /* ================================================================= TRAINING */
  V.training = function (root, params) {
    var tab = params[0] || "program", c = S.content;
    root.innerHTML = H.head("Training", "Program pelatihan dan jadwal public class di halaman <b>Training</b>. Kartu program menautkan ke portal training PKP.") +
      '<div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="' + (tab === "program") + '" data-tab="program">Program <span class="count">' + (c.courses || []).length + "</span></button>" +
      '<button type="button" role="tab" aria-selected="' + (tab === "jadwal") + '" data-tab="jadwal">Jadwal <span class="count">' + (c.schedule || []).length + '</span></button></div><div data-pane></div>';
    root.querySelectorAll("[data-tab]").forEach(function (b) { b.onclick = function () { location.hash = "#/training/" + b.dataset.tab; }; });
    var pane = root.querySelector("[data-pane]");
    if (tab === "program") {
      pane.innerHTML = '<div class="row" style="margin-bottom:12px"><span class="spacer"></span><button type="button" class="btn btn--primary btn--sm" data-add>' + icon("plus", "icon--sm") + "Program baru</button></div>" +
        '<div class="card"><ul class="sortable">' + (c.courses || []).map(function (t) {
          return '<li class="item' + (t.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(t.title) + '">' + icon("grip") + "</button>" + H.thumb(t.image) +
            '<div class="item-main"><div class="item-title"><span>' + esc(t.title) + "</span>" + (t.image && /unsplash/.test(t.image.src) ? '<span class="badge badge--sample">Foto dummy</span>' : "") +
            '</div><div class="item-sub">' + esc(t.category) + " · " + esc(t.duration) + " · " + esc(t.capacity) + '</div></div><div class="item-meta">' + H.visBadge(t) + "</div>" + H.actions(t.id) + "</li>";
        }).join("") + "</ul></div>";
      H.sortList(pane.querySelector(".sortable"), "courses");
      var edit = function (t, isNew) {
        H.edit({ title: isNew ? "Program baru" : "Edit program", item: t, preview: { page: "training", selector: '[data-cms="courses"]', closest: "section" },
          form: F.text("title", "Nama program", { required: true }) + F.text("category", "Kategori (label)", { placeholder: "Cloud" }) + F.textarea("desc", "Deskripsi", { rows: 3, max: 140 }) +
            '<div class="form-row">' + F.text("duration", "Durasi", { placeholder: "3 hari" }) + F.text("capacity", "Kapasitas", { placeholder: "Maks. 20 peserta" }) + "</div>" +
            F.image("image", "Foto program", { kind: "cover", folder: "training", maxW: 1440, hint: "Rasio 16:9. Gunakan foto kelas/kegiatan asli PKP bila ada." }) +
            F.text("url", "Tautan program", { mono: true }) + F.toggle("visible", "Tampilkan di website"),
          validate: function (x) { return x.title ? null : "Nama program wajib diisi."; },
          apply: function (cc, x) { if (x.image) { x.image.w = 720; x.image.h = 405; } replaceById(cc.courses, x); }, note: (isNew ? "Menambah program " : "Mengubah program ") + (t.title || "") });
      };
      H.listOps(pane, "courses", { edit: function (t) { edit(t); } });
      pane.querySelector("[data-add]").onclick = function () { edit({ id: u.uid("crs"), title: "", category: "", desc: "", image: null, duration: "", capacity: "", url: "https://training.pkp.co.id/", visible: true }, true); };
    } else {
      var TONE = { mint: ["Tersedia", "badge--live"], amber: ["Hampir penuh", "badge--draft"], sky: ["Segera dibuka", "badge--new"] };
      pane.innerHTML = '<div class="row" style="margin-bottom:12px"><span class="hint">Tabel “Public class kuartal ini”. Baris yang lewat tanggalnya sebaiknya dihapus.</span><span class="spacer"></span><button type="button" class="btn btn--primary btn--sm" data-add>' + icon("plus", "icon--sm") + "Tambah jadwal</button></div>" +
        '<div class="card"><ul class="sortable">' + (c.schedule || []).map(function (s) {
          return '<li class="item' + (s.visible === false ? " is-hidden" : "") + '"><button type="button" class="handle" aria-label="Geser ' + esc(s.program) + '">' + icon("grip") + '</button><span class="item-icon">' + icon("calendar") + '</span><div class="item-main"><div class="item-title"><span>' + esc(s.program) +
            '</span></div><div class="item-sub">' + esc(s.date) + " · " + esc(s.duration) + " · " + esc(s.format) + '</div></div><div class="item-meta"><span class="badge ' + ((TONE[s.tone] || [])[1] || "") + '">' + esc(s.status) + "</span></div>" + H.actions(s.id) + "</li>";
        }).join("") + "</ul></div>";
      H.sortList(pane.querySelector(".sortable"), "schedule");
      var editS = function (s, isNew) {
        H.edit({ title: isNew ? "Jadwal baru" : "Edit jadwal", item: s, preview: { page: "training", selector: '[data-cms="schedule"]', closest: "section" },
          form: F.text("program", "Program", { required: true, list: "courseList" }) + '<datalist id="courseList">' + (S.content.courses || []).map(function (t) { return '<option value="' + esc(t.title) + '">'; }).join("") + "</datalist>" +
            '<div class="form-row">' + F.text("date", "Tanggal", { placeholder: "21–23 Okt 2026" }) + F.text("duration", "Durasi", { placeholder: "3 hari" }) + "</div>" +
            '<div class="form-row">' + F.select("format", "Format", [["Public class", "Public class"], ["Online", "Online"], ["In-house", "In-house"]]) + F.select("tone", "Warna status", [["mint", "Hijau — tersedia"], ["amber", "Emas — hampir penuh"], ["sky", "Biru — segera dibuka"]]) + "</div>" +
            F.text("status", "Teks status", { placeholder: "Tersedia / Sisa 4 kursi" }) + F.toggle("visible", "Tampilkan di website"),
          validate: function (x) { return x.program ? null : "Nama program wajib diisi."; },
          apply: function (cc, x) { replaceById(cc.schedule, x); }, note: "Mengubah jadwal " + (s.program || "") });
      };
      H.listOps(pane, "schedule", { edit: function (s) { editS(s); } });
      pane.querySelector("[data-add]").onclick = function () { editS({ id: u.uid("sch"), program: "", date: "", duration: "", format: "Public class", status: "Tersedia", tone: "mint", visible: true }, true); };
    }
  };

  /* ================================================================= TENTANG & ISO */
  V.tentang = function (root) {
    var c = S.content, iso = c.iso || {}, days = iso.expiry ? Math.round((new Date(iso.expiry + "T23:59:59") - new Date()) / 864e5) : null;
    var st = days == null ? ["badge--hidden", "Belum diisi"] : days < 0 ? ["badge--danger", "Kedaluwarsa " + Math.abs(days) + " hari lalu"] : days < 60 ? ["badge--draft", "Berakhir dalam " + days + " hari"] : ["badge--live", "Berlaku"];
    root.innerHTML = H.head("Tentang & ISO", "Sertifikat ISO di halaman <b>Tentang Kami</b> dan angka perusahaan.") +
      (days != null && days < 0 ? '<div class="callout callout--bad" style="margin-bottom:16px">' + icon("alert") + "<div><b>Sertifikat ISO 9001 sudah kedaluwarsa (" + u.fmtDate(iso.expiry) + ")</b>Website masih menampilkan klaim “ISO 9001:2015 Certified”. Unggah sertifikat perpanjangan dan perbarui tanggalnya, atau tinjau klaim tersebut sebelum dipublikasikan.</div></div>" : "") +
      '<div class="grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1.4fr)"><div class="card card-pad" style="display:grid;place-items:center;background:var(--canvas)">' +
      (iso.image && iso.image.src ? '<img src="' + esc(A.imgUrl(iso.image.src)) + '" alt="Sertifikat ISO" style="max-height:420px;border-radius:8px;box-shadow:var(--sh-2)">' : H.empty("award", "Belum ada sertifikat", "Unggah gambar sertifikat.", "")) + "</div>" +
      '<div class="card"><div class="card-head"><div><h2>Sertifikat ' + esc(iso.standard || "ISO") + '</h2><p>Nomor ' + esc(iso.number || "—") + '</p></div><span class="badge ' + st[0] + '">' + st[1] + "</span></div>" +
      '<div class="card-body"><dl class="reader-meta" style="margin:0 0 16px"><div><dt>Lembaga sertifikasi</dt><dd>' + esc(iso.body || "—") + "</dd></div><div><dt>Akreditasi</dt><dd>" + esc(iso.accreditation || "—") +
      "</dd></div><div><dt>Berlaku sampai</dt><dd>" + u.fmtDate(iso.expiry) + "</dd></div><div><dt>Standar</dt><dd>" + esc(iso.standard || "—") + '</dd></div></dl><div class="row"><button type="button" class="btn btn--primary" data-iso>' + icon("edit") + "Perbarui sertifikat</button></div></div></div></div>" +
      '<div class="section-title"><div><h2>Angka perusahaan</h2><p>Pita angka di halaman Tentang Kami.</p></div><button type="button" class="btn btn--secondary btn--sm" data-stats>' + icon("edit", "icon--sm") + "Edit angka</button></div>" +
      '<div class="kpis">' + ((c.stats || {}).about || []).map(function (s) { return '<div class="card kpi"><div><b>' + esc(s.value) + esc(s.suffix) + "</b><span>" + esc(s.label) + "</span></div></div>"; }).join("") + "</div>";
    root.querySelector("[data-iso]").onclick = function () {
      var d = u.clone(iso);
      H.edit({ title: "Perbarui sertifikat ISO", item: d, preview: { page: "tentang", selector: "#sertifikasi" },
        form: '<div class="form-row">' + F.text("standard", "Standar", { placeholder: "ISO 9001:2015" }) + F.text("number", "Nomor sertifikat", { mono: true }) + "</div>" +
          F.text("body", "Lembaga sertifikasi") + F.text("accreditation", "Akreditasi", { placeholder: "KAN (LSSM-075-IDN) · IAF" }) +
          F.text("expiry", "Berlaku sampai", { type: "date", hint: "Dasbor akan mengingatkan 60 hari sebelum berakhir." }) +
          F.image("image", "Gambar sertifikat", { kind: "photo", folder: "iso", maxW: 1600, hint: "Scan/foto tegak. Disimpan 1600 px untuk tampilan “ukuran penuh”." }),
        apply: function (cc, x) {
          if (x.image && x.image.src) { if (x.image.w > 640) { x.image.h = Math.round(x.image.h * 640 / x.image.w); x.image.w = 640; } if (x.image.src !== iso.image.src) x.imageFull = x.image.src; }
          cc.iso = x;
        }, note: "Memperbarui sertifikat ISO", okMsg: "Data sertifikat tersimpan sebagai draf." });
    };
    root.querySelector("[data-stats]").onclick = function () {
      var st2 = { list: u.clone((S.content.stats || {}).about || []) };
      H.edit({ title: "Angka perusahaan", item: st2, preview: { page: "tentang", selector: '[data-cms="about-stats"]', closest: "section" },
        form: F.repeater("list", "Angka", { id: "stats" }), apply: function (cc, x) { cc.stats = cc.stats || {}; cc.stats.about = x.list; }, note: "Mengubah angka Tentang" });
    };
  };

  /* ================================================================= KONTAK */
  V.kontak = function (root) {
    var d = u.clone(S.content.contact || {}); d.instagram = d.instagram || { handle: "", url: "" };
    d._ig = String(d.instagram.url || d.instagram.handle || "").replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");
    root.innerHTML = H.head("Kontak & Sosial Media", "Dipakai di footer semua halaman, menu mobile, halaman <b>Hubungi Kami</b>, dan data perusahaan untuk Google.") +
      '<form class="grid" style="grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);align-items:start" novalidate><div class="card"><div class="card-head"><h2>Informasi kontak</h2></div><div class="card-body form">' +
      '<div class="form-row">' + F.text("phone", "Telepon (tampilan)", { placeholder: "(021) 84311636" }) + F.text("phoneHref", "Nomor untuk panggilan", { mono: true, placeholder: "+622184311636", hint: "Format internasional tanpa spasi." }) + "</div>" +
      '<div class="form-row">' + F.text("email", "Email", { type: "email" }) +
        F.text("_ig", "Social Media Instagram", { prefix: "instagram.com/", mono: true, placeholder: "beyondtechid", hint: "Isi nama akun saja. Tampil sebagai @nama-akun di footer & halaman Hubungi Kami." }) + "</div>" +
      F.textarea("address", "Alamat kantor", { rows: 2 }) +
      F.repeater("hours", "Jam operasional", { id: "hours" }) + "</div></div>" +
      '<div class="stack"><div class="card"><div class="card-head"><div><h2>Peta lokasi</h2><p>Pencarian Google Maps untuk peta di halaman Hubungi Kami.</p></div></div><div class="card-body form">' + F.text("mapQuery", "Kata kunci lokasi") +
      '<div style="border-radius:12px;overflow:hidden;border:1px solid var(--line);aspect-ratio:4/3;background:var(--canvas)"><iframe data-map title="Pratinjau peta" style="width:100%;height:100%;border:0" loading="lazy"></iframe></div></div></div>' +
      '<div class="card"><div class="card-head"><div><h2>Form Hubungi Kami</h2><p>Ke mana pesan dari form website dikirim.</p></div></div><div class="card-body form">' +
      F.text("formRecipient", "Email penerima pesan", { type: "email", hint: "Pesan juga selalu masuk ke <b>Kotak Masuk</b> SuperAdmin. Saat email penerima diganti, FormSubmit mengirim email aktivasi sekali ke alamat baru." }) + "</div></div></div></form>" +
      '<div class="card" style="position:sticky;bottom:16px;margin-top:16px;box-shadow:var(--sh-3)"><div class="card-foot" style="border:0;border-radius:var(--r-lg);background:#fff"><span class="hint" style="margin-right:auto" data-state>Belum ada perubahan.</span><button type="button" class="btn btn--ghost" data-reset>Batalkan</button><button type="button" class="btn btn--primary" data-save>' + icon("check") + "Simpan perubahan</button></div></div>";
    var map = root.querySelector("[data-map]"), stateEl = root.querySelector("[data-state]");
    var drawMap = u.debounce(function () { map.src = "https://maps.google.com/maps?q=" + encodeURIComponent(d.mapQuery || "") + "&z=15&output=embed"; }, 600);
    ui.bindForm(root.querySelector("form"), d, function () { stateEl.textContent = "Ada perubahan yang belum disimpan."; stateEl.style.color = "var(--amber-ink)"; drawMap(); A.guard = true; });
    drawMap();
    root.querySelector("[data-reset]").onclick = function () { A.guard = false; A.route(); };
    root.querySelector("[data-save]").onclick = function (e) {
      var b = e.currentTarget;
      if (d.email && !/^\S+@\S+\.\S+$/.test(d.email)) return ui.toast("Format email belum benar.", { type: "bad" });
      if (d.formRecipient && !/^\S+@\S+\.\S+$/.test(d.formRecipient)) return ui.toast("Format email penerima belum benar.", { type: "bad" });
      var ig = String(d._ig || "").trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/[/?#].*$/, "");
      if (ig && !/^[A-Za-z0-9._]{1,30}$/.test(ig)) return ui.toast("Nama akun Instagram hanya boleh huruf, angka, titik, dan garis bawah.", { type: "bad" });
      var out = u.clone(d); delete out._ig;
      out.instagram = ig ? { handle: "@" + ig, url: "https://www.instagram.com/" + ig } : { handle: "", url: "" };
      b.classList.add("is-busy");
      H.save(function (cc) { cc.contact = out; }, "Mengubah kontak", "Kontak tersimpan. Footer semua halaman diperbarui saat dipublikasikan.").then(function () { A.guard = false; A.route(); }, function (er) { b.classList.remove("is-busy"); ui.toast(er.message, { type: "bad" }); });
    };
  };
})(window);
