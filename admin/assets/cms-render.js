/* PKP CMS — renderer bersama.
   Mengubah data content.json menjadi potongan HTML yang SAMA dengan markup website
   (class, struktur, atribut aksesibilitas), lalu menempelkannya ke elemen ber-atribut
   data-cms="..." di halaman. Dipakai SuperAdmin untuk pratinjau dan publikasi. */
(function (global) {
  "use strict";

  var esc = function (s) {
    return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  };
  var icon = function (name, cls) { return '<svg class="' + (cls || "icon") + '" aria-hidden="true"><use href="#i-' + esc(name) + '"/></svg>'; };
  var vis = function (list) { return (list || []).filter(function (x) { return x && x.visible !== false; }); };
  var byId = function (list, id) { return (list || []).filter(function (x) { return x.id === id || x.slug === id; })[0]; };
  var NEWTAB = '<span class="sr-only"> (membuka tab baru)</span>';
  var MONTH_S = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  var MONTH_L = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var parseDate = function (iso) { var p = String(iso || "").split("-"); return { y: +p[0], m: +p[1] - 1, d: +p[2] }; };
  var dateShort = function (iso) { var t = parseDate(iso); return t.y ? t.d + " " + MONTH_S[t.m] + " " + t.y : ""; };
  var dateLong = function (iso) { var t = parseDate(iso); return t.y ? t.d + " " + MONTH_L[t.m] + " " + t.y : ""; };
  var imgTag = function (im, cls, extra) {
    if (!im || !im.src) return "";
    return "<img" + (cls ? ' class="' + cls + '"' : "") + ' src="' + esc(im.src) + '" alt="' + esc(im.alt || "") + '"' +
      (im.w ? ' width="' + im.w + '"' : "") + (im.h ? ' height="' + im.h + '"' : "") + (extra || ' loading="lazy" decoding="async"') + ">";
  };
  var postsSorted = function (c, all) {
    return (c.posts || []).filter(function (p) { return all || p.status === "published"; })
      .slice().sort(function (a, b) { return a.date < b.date ? 1 : a.date > b.date ? -1 : 0; });
  };
  var postHref = function (p) { return p.body && String(p.body).trim() ? "blog-" + p.slug + ".html" : "blog-detail.html"; };
  var catLabel = function (c, key) { var k = (c.categories || []).filter(function (x) { return x.key === key; })[0]; return k ? k.label : key; };
  var resolveRef = function (c, ref) {
    var t = String(ref).split(":"), list = t[0] === "service" ? c.services : c.products, it = byId(list, t[1]);
    if (!it || it.visible === false) return null;
    return { name: it.name, icon: it.icon, href: (t[0] === "service" ? "layanan.html#" : "produk.html#") + it.slug };
  };

  /* ---------------------------------------------------------------- potongan bersama */
  function mediaBlock(p, attrs, firstLcp) {
    if (p.image && p.image.src) {
      return '<div class="showcase-media showcase-media--shot"' + attrs + ">" +
        imgTag(p.image, "shot", firstLcp ? ' fetchpriority="high" decoding="async"' : null) + "</div>";
    }
    return '<div class="showcase-media showcase-media--frame"' + attrs + '><div class="device device--light">' + (p.mockupHtml || "") + "</div></div>";
  }
  function ctaBtn(cta) {
    if (!cta || !cta.label || !cta.url) return "";
    return '\n        <a class="btn btn--primary" href="' + esc(cta.url) + '"' + (cta.newTab ? ' target="_blank" rel="noopener"' : "") + ">" +
      esc(cta.label) + " " + (cta.newTab ? icon("external") + NEWTAB : icon("arrow-right")) + "</a>";
  }
  function pills(list) {
    return list && list.length ? '\n        <ul class="pill-list">' + list.map(function (f) { return "<li>" + esc(f) + "</li>"; }).join("") + "</ul>" : "";
  }
  function showcaseRow(p, comm, firstLcp) {
    var kick = '<span class="showcase-kicker"' + (comm ? ' style="color:var(--amber-500)"' : "") + ">" + esc(p.kicker) + "</span>";
    var paras = (p.paragraphs || []).filter(Boolean).map(function (t) { return "\n        <p>" + t + "</p>"; }).join("");
    var defs = (p.definitions || []).length ? '\n        <div class="def-list">' + p.definitions.map(function (d) {
      return "\n          <p><b>" + esc(d.term) + "</b> — " + d.desc + "</p>";
    }).join("") + "\n        </div>" : "";
    return '    <article class="showcase-row" id="' + esc(p.slug) + '">\n      <div data-reveal>\n        ' + kick +
      "\n        <h2>" + esc(p.name) + "</h2>" + paras + defs + pills(p.features) + ctaBtn(p.cta) + "\n      </div>\n      " +
      mediaBlock(p, ' data-reveal style="--d:80ms"', firstLcp) + "\n    </article>";
  }
  function stats(list, cls) {
    return (list || []).map(function (s) {
      var anim = s.animate !== false && /^\d+$/.test(String(s.value));
      return '<div class="' + cls + '"><strong' + (anim ? ' data-count="' + esc(s.value) + '"' : "") + (anim && s.suffix ? ' data-suffix="' + esc(s.suffix) + '"' : "") + ">" +
        esc(s.value) + esc(s.suffix || "") + "</strong><span>" + esc(s.label) + "</span></div>";
    }).join("\n    ");
  }
  function logoTile(it, tag) {
    var mark = it.logo && it.logo.src
      ? '<img class="partner-logo" src="' + esc(it.logo.src) + '" alt="' + esc(it.name) + '" width="' + it.logo.w + '" height="' + it.logo.h + '" loading="lazy" decoding="async">'
      : '<span class="logo-word" style="--c:' + esc(it.color || "#1A6FAA") + '">' + esc(it.name) + "</span>";
    return "<" + tag + ' class="logo-tile">' + mark + "</" + tag + ">";
  }
  function postCard(c, p) {
    var href = postHref(p);
    return '<article class="post-card" data-cat="' + esc(p.category) + '">\n  <a class="post-thumb ph" href="' + href + '" tabindex="-1" aria-hidden="true">\n    <span class="tag tag--amber">' +
      esc(catLabel(c, p.category)) + "</span>\n    " + icon("home", "icon ph-ic") + '\n    <img src="' + esc(p.cover && p.cover.src) + '" alt="' + esc(p.title) +
      '" loading="lazy" width="720" height="700">\n  </a>\n  <div class="post-meta"><span>' + esc(p.author || "Admin PKP") + "</span><span><time>" + dateShort(p.date) +
      '</time></span></div>\n  <h3><a href="' + href + '">' + esc(p.title) + "</a></h3>\n  <p>" + esc(p.excerpt) + '</p>\n  <a class="link-arrow" href="' + href + '">' +
      esc(p.linkLabel || "Baca selengkapnya") + " " + icon("arrow-right") + '<span class="sr-only">: ' + esc(p.title) + "</span></a>\n</article>";
  }
  function psList(c, refs) {
    return "\n" + (refs || []).map(function (r) { return resolveRef(c, r); }).filter(Boolean).map(function (it) {
      return '          <li><a href="' + esc(it.href) + '"><span class="ps-ic">' + icon(it.icon) + "</span>" + esc(it.name) + icon("arrow-right") + "</a></li>";
    }).join("\n") + "\n        ";
  }
  function contactLis(c, order) {
    var k = c.contact || {}, li = function (ic, body) { return '\n          <li><span class="ci">' + icon(ic) + "</span>" + body + "</li>"; };
    var parts = {
      phone: k.phone ? li("phone", '<a href="tel:' + esc(k.phoneHref) + '">' + esc(k.phone) + "</a>") : "",
      instagram: k.instagram && k.instagram.url ? li("instagram", '<a href="' + esc(k.instagram.url) + '" target="_blank" rel="noopener">' + esc(k.instagram.handle) +
        '<span class="sr-only"> di Instagram (membuka tab baru)</span></a>') : "",
      email: k.email ? li("mail", '<a href="mailto:' + esc(k.email) + '">' + esc(k.email) + "</a>") : "",
      address: k.address ? li("map-pin", "<span>" + esc(k.address) + "</span>") : "",
      website: k.website ? li("globe", '<a href="' + esc(k.website) + '">' + esc(String(k.website).replace(/^https?:\/\//, "")) + "</a>") : ""
    };
    return order.map(function (key) { return parts[key]; }).join("") + "\n        ";
  }

  /* ---------------------------------------------------------------- region */
  var R = {
    /* global */
    "drawer-contact": function (c) {
      var k = c.contact || {};
      return '<a href="tel:' + esc(k.phoneHref) + '">' + esc(k.phone) + '</a><a href="mailto:' + esc(k.email) + '">' + esc(k.email) + "</a>";
    },
    "footer-contact": function (c) { return contactLis(c, ["phone", "instagram", "email", "address"]); },

    /* beranda */
    "hero-title": function (c) {
      var h = c.hero || {};
      return esc(h.titleBefore) + (h.highlight ? ' <span class="text-amber">' + esc(h.highlight) + "</span> " : " ") + esc(h.titleAfter);
    },
    "hero-lead": function (c) { return esc((c.hero || {}).lead); },
    "hero-actions": function (c) {
      return "\n" + ((c.hero || {}).ctas || []).filter(function (a) { return a.label && a.url; }).map(function (a) {
        return a.style === "ghost"
          ? '          <a class="btn btn--ghost-light" href="' + esc(a.url) + '">' + esc(a.label) + "</a>"
          : '          <a class="btn btn--primary" href="' + esc(a.url) + '">' + esc(a.label) + " " + icon("arrow-right") + "</a>";
      }).join("\n") + "\n        ";
    },
    "hero-stats": function (c) { return "\n          " + stats((c.hero || {}).stats, "hero-stat").replace(/\n    /g, "\n          ") + "\n        "; },
    "hero-trusted": function (c) { return ((c.hero || {}).trusted || []).map(function (t) { return "<li>" + esc(t) + "</li>"; }).join(""); },
    "home-ps-product": function (c) { return psList(c, ((c.home || {}).portfolio || {}).product); },
    "home-ps-service": function (c) { return psList(c, ((c.home || {}).portfolio || {}).service); },
    "home-tabs": function (c) {
      var items = ((c.home || {}).featured || []).map(function (s) { return byId(c.products, s); }).filter(function (p) { return p && p.visible !== false; });
      var tabs = items.map(function (p, i) {
        return '        <button class="ptab" role="tab" id="t-' + esc(p.slug) + '" aria-controls="p-' + esc(p.slug) + '" aria-selected="' + (i ? "false" : "true") + '"' +
          (i ? ' tabindex="-1"' : "") + '><span class="ps-ic">' + icon(p.icon) + "</span><span><strong>" + esc(p.tabLabel || p.navLabel || p.name) +
          "</strong><small>" + esc(p.tabCategory || p.kicker) + "</small></span></button>";
      }).join("\n");
      var panels = items.map(function (p, i) {
        return '        <div class="ptab-panel" role="tabpanel" id="p-' + esc(p.slug) + '" aria-labelledby="t-' + esc(p.slug) + '" tabindex="0"' + (i ? " hidden" : "") + ">\n          " +
          mediaBlock(p, "") + '\n          <div class="ptab-copy"><span class="showcase-kicker">' + esc(p.kicker) + "</span><h3>" + esc(p.name) + "</h3><p>" +
          esc(p.summary) + '</p><a class="link-arrow" href="produk.html#' + esc(p.slug) + '">Detail produk ' + icon("arrow-right") + "</a></div>\n        </div>";
      }).join("\n");
      return '\n      <div class="ptab-list" role="tablist" aria-label="Produk unggulan" aria-orientation="vertical" data-reveal>\n' + tabs +
        '\n      </div>\n      <div data-reveal style="--d:80ms">\n' + panels + "\n      </div>\n    ";
    },
    "home-services": function (c) {
      return "\n" + ((c.home || {}).services || []).map(function (id) { return byId(c.services, id); }).filter(function (s) { return s && s.visible !== false; }).map(function (s) {
        var f = (s.homeFeatures && s.homeFeatures.length ? s.homeFeatures : s.features) || [];
        return '      <article class="card svc-card"><span class="icon-badge">' + icon(s.icon) + "</span><h3>" + esc(s.name) + "</h3><p>" + esc(s.desc) + "</p>" +
          (f.length ? '<ul class="pill-list">' + f.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</article>";
      }).join("\n") + "\n    ";
    },
    "home-partners": function (c) { return vis(c.partners).map(function (p) { return logoTile(p, "li"); }).join("\n"); },
    "home-clients": function (c) { return vis(c.clients).map(function (p) { return logoTile(p, "li"); }).join("\n"); },
    "home-posts": function (c) { return postsSorted(c).slice(0, (c.home || {}).postsCount || 3).map(function (p) { return postCard(c, p); }).join("\n"); },

    /* produk */
    "product-subnav": function (c) {
      var order = ["main", "mobile", "comm", "ekyc"], list = vis(c.products).slice().sort(function (a, b) { return order.indexOf(a.section) - order.indexOf(b.section); });
      if (!vis(c.apps).length) list = list.filter(function (p) { return p.section !== "mobile"; });
      return "\n" + list.map(function (p) { return '      <li><a href="#' + esc(p.slug) + '">' + esc(p.navLabel || p.name) + "</a></li>"; }).join("\n") + "\n    ";
    },
    "products-main": function (c) {
      var first = true;
      return "\n" + vis(c.products).filter(function (p) { return p.section === "main"; }).map(function (p) {
        var lcp = first && p.image && p.image.src; first = false; return showcaseRow(p, false, lcp);
      }).join("\n\n") + "\n  ";
    },
    "mobile-head": function (c) {
      var p = byId(c.products, "mobile") || {};
      return '\n      <span class="eyebrow">' + esc(p.kicker) + '</span>\n      <h2 class="section-title" id="mobile-title">' + esc(p.name) +
        '</h2>\n      <p class="section-lead">' + esc((p.paragraphs || [])[0]) + "</p>\n    ";
    },
    "apps": function (c) {
      return "\n" + vis(c.apps).map(function (a) {
        return '      <li class="app-card">' + imgTag(a.image, "shot app-shot") + "<h3>" + esc(a.name) + "</h3><p>" + esc(a.desc) + "</p></li>";
      }).join("\n") + "\n    ";
    },
    "products-comm": function (c) {
      return "\n" + vis(c.products).filter(function (p) { return p.section === "comm"; }).map(function (p) { return showcaseRow(p, true); }).join("\n\n") + "\n  ";
    },
    "ekyc-intro": function (c) {
      var p = byId(c.products, "ekyc") || {};
      return '\n      <span class="eyebrow">' + esc(p.kicker) + '</span>\n      <h2 class="section-title" id="ekyc-title">' + esc(p.name) +
        '</h2>\n      <p class="section-lead">' + esc((p.paragraphs || [])[0]) + '</p>\n      <ul class="kyc-list">\n' +
        (p.ekycFeatures || []).map(function (f) { return "        <li>" + icon(f.icon) + esc(f.label) + "</li>"; }).join("\n") + "\n      </ul>\n    ";
    },

    /* layanan */
    "services-cards": function (c) {
      return "\n" + vis(c.services).map(function (s) {
        return '      <article class="card svc-card" id="' + esc(s.slug) + '"><span class="icon-badge">' + icon(s.icon) + "</span><h3>" + esc(s.name) + "</h3><p>" + esc(s.desc) + "</p>" +
          ((s.features || []).length ? '<ul class="pill-list">' + s.features.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</article>";
      }).join("\n") + "\n    ";
    },
    "infra-head": function (c) {
      var h = c.infrastructure || {};
      return '\n      <span class="eyebrow">' + esc(h.eyebrow) + '</span>\n      <h2 class="section-title" id="infra-title">' + esc(h.title) +
        '</h2>\n      <p class="section-lead">' + esc(h.lead) + "</p>\n    ";
    },
    "infra-groups": function (c) {
      var BADGE = {
        sky: '<span class="icon-badge icon-badge--sky" style="width:40px;height:40px">',
        amber: '<span class="icon-badge" style="width:40px;height:40px;box-shadow:none;background:rgba(245,166,35,.12)">',
        mint: '<span class="icon-badge" style="width:40px;height:40px;box-shadow:none;background:rgba(55,224,176,.12);color:var(--mint-400)">'
      };
      return "\n" + ((c.infrastructure || {}).groups || []).filter(function (g) { return g.visible !== false; }).map(function (g) {
        var items = (g.items || []).filter(function (x) { return x.visible !== false; });
        return '      <details class="infra-group" open data-reveal>\n        <summary>' + (BADGE[g.tone] || BADGE.sky) + icon(g.icon) + "</span><div><h3>" + esc(g.title) + "</h3><p>" + esc(g.desc) +
          '</p></div><span class="count">' + items.length + " layanan</span>" + icon("chevron-down") + '</summary>\n        <div class="infra-items">\n' +
          items.map(function (it) {
            return '          <div class="infra-item"><span class="ps-ic">' + icon(it.icon) + "</span><div><h4>" + esc(it.title) + "</h4><p>" + esc(it.desc) +
              (it.link && it.link.url ? ' <a href="' + esc(it.link.url) + '" style="color:var(--amber-500);font-weight:600">' + esc(it.link.label) + "</a>" : "") + "</p></div></div>";
          }).join("\n") + "\n        </div>\n      </details>";
      }).join("\n") + "\n    ";
    },
    "industries": function (c) {
      var BADGE = { sky: '<span class="icon-badge icon-badge--sky">', dark: '<span class="icon-badge icon-badge--dark">', "dark-mint": '<span class="icon-badge icon-badge--dark" style="color:var(--mint-400)">' };
      return "\n" + vis(c.industries).map(function (it) {
        return '      <article class="industry-card">' + (BADGE[it.tone] || BADGE.sky) + icon(it.icon) + "</span><h3>" + esc(it.title) + "</h3><p>" + esc(it.desc) + "</p></article>";
      }).join("\n") + "\n    ";
    },

    /* partner */
    "partners": function (c) { return R["home-partners"](c); },
    "clients": function (c) { return R["home-clients"](c); },
    "partner-stats": function (c) { return "\n    " + stats((c.stats || {}).partner, "stat-item") + "\n  "; },
    "about-stats": function (c) { return "\n    " + stats((c.stats || {}).about, "stat-item") + "\n  "; },

    /* tentang */
    "iso-doc": function (c) {
      var i = c.iso || {};
      return '\n        <a class="cert-photo" href="' + esc(i.imageFull || (i.image && i.image.src)) + '" target="_blank" rel="noopener">\n          ' +
        imgTag(i.image, "cert-img") + '\n          <span class="cert-zoom">' + icon("maximize") + ' Lihat ukuran penuh<span class="sr-only"> (membuka tab baru)</span></span>\n        </a>\n      ';
    },
    "iso-meta": function (c) {
      var i = c.iso || {}, row = function (k, v) { return v ? "\n          <div><dt>" + k + "</dt><dd>" + esc(v) + "</dd></div>" : ""; };
      return row("Standar", i.standard) + row("Nomor sertifikat", i.number) + row("Lembaga sertifikasi", i.body) + row("Akreditasi", i.accreditation) + "\n        ";
    },

    /* karir */
    "job-filter": function (c) {
      return '\n          <option value="all">Semua divisi</option>\n' + (c.departments || []).map(function (d) {
        return '          <option value="' + esc(d.key) + '">' + esc(d.label) + "</option>";
      }).join("\n") + "\n        ";
    },
    "job-count": function (c) { return vis(c.jobs).length + " posisi terbuka"; },
    "jobs": function (c) {
      var dl = function (k) { var d = (c.departments || []).filter(function (x) { return x.key === k; })[0]; return d ? d.label : k; };
      return "\n" + vis(c.jobs).map(function (j) {
        return '      <article class="job" data-dept="' + esc(j.dept) + '"><div><h3>' + esc(j.title) + '</h3><p class="dept">' + esc(dl(j.dept)) + '</p></div><span class="meta">' +
          icon("map-pin") + esc(j.location) + '</span><span class="meta meta--type">' + icon("clock") + esc(j.type) + '</span><a class="btn btn--outline btn--sm" href="' + esc(j.url) +
          '" target="_blank" rel="noopener">Lamar ' + icon("external") + NEWTAB + "</a></article>";
      }).join("\n") + "\n    ";
    },

    /* training */
    "courses": function (c) {
      return "\n" + vis(c.courses).map(function (t) {
        return '      <article class="card course-card"><div class="ph"><span class="tag tag--amber">' + esc(t.category) + "</span>" +
          '<img src="' + esc(t.image && t.image.src) + '" alt="' + esc((t.image && t.image.alt) || "Ilustrasi pelatihan " + t.title) + '" loading="lazy" width="720" height="405"></div>' +
          '<div class="course-body"><h3><a class="card-link" href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.title) + NEWTAB + "</a></h3><p>" + esc(t.desc) + "</p>" +
          '<div class="course-meta"><span>' + icon("clock") + esc(t.duration) + "</span><span>" + icon("users") + esc(t.capacity) + "</span></div>" +
          '<span class="course-go" aria-hidden="true">Lihat program ' + icon("external") + "</span></div></article>";
      }).join("\n") + "\n    ";
    },
    "schedule": function (c) {
      return "\n" + (c.schedule || []).filter(function (s) { return s.visible !== false; }).map(function (s) {
        return "          <tr><td>" + esc(s.program) + "</td><td>" + esc(s.date) + "</td><td>" + esc(s.duration) + "</td><td>" + esc(s.format) +
          '</td><td><span class="tag tag--' + esc(s.tone || "mint") + '">' + esc(s.status) + "</span></td></tr>";
      }).join("\n") + "\n        ";
    },

    /* blog */
    "blog-filters": function (c) {
      return '\n      <button class="filter-chip" type="button" data-filter="all" aria-pressed="true">Semua</button>\n' + (c.categories || []).map(function (k) {
        return '      <button class="filter-chip" type="button" data-filter="' + esc(k.key) + '" aria-pressed="false">' + esc(k.label) + "</button>";
      }).join("\n") + "\n    ";
    },
    "blog-posts": function (c) { return postsSorted(c).map(function (p) { return postCard(c, p); }).join("\n"); },

    /* kontak */
    "contact-info": function (c) { return contactLis(c, ["address", "phone", "email", "instagram"]); },
    "contact-hours": function (c) {
      return ((c.contact || {}).hours || []).map(function (h) { return "\n          <div><span>" + esc(h.days) + "</span><b>" + esc(h.time) + "</b></div>"; }).join("") + "\n        ";
    }
  };

  /* atribut (bukan isi) yang ikut diperbarui */
  var ATTR = {
    "contact-map": function (el, c) {
      var k = c.contact || {};
      el.setAttribute("src", "https://maps.google.com/maps?q=" + encodeURIComponent(k.mapQuery || "").replace(/%20/g, "%20") + "&z=15&output=embed");
      if (k.mapTitle) el.setAttribute("title", k.mapTitle);
    },
    "contact-form": function (el, c) { var r = (c.contact || {}).formRecipient; if (r) el.setAttribute("data-recipient", r); }
  };
  var SECTIONS = {
    mobile: function (c) { var p = byId(c.products, "mobile"); return !!(p && p.visible !== false && vis(c.apps).length); },
    ekyc: function (c) { var p = byId(c.products, "ekyc"); return !!(p && p.visible !== false); },
    infrastructure: function (c) { return ((c.infrastructure || {}).groups || []).length > 0; }
  };

  /* ---------------------------------------------------------------- terapkan ke dokumen */
  function setMeta(doc, sel, attr, val) { var el = doc.querySelector(sel); if (el && val != null) el.setAttribute(attr, val); }
  function applyHead(doc, c, pageKey, seoOverride) {
    var s = seoOverride || (c.seo || {})[pageKey];
    if (s) {
      if (s.title) { doc.title = s.title; setMeta(doc, 'meta[property="og:title"]', "content", s.title); }
      if (s.description) { setMeta(doc, 'meta[name="description"]', "content", s.description); setMeta(doc, 'meta[property="og:description"]', "content", s.description); }
    }
    var st = c.settings || {}, gaSrc = doc.querySelector('script[src*="googletagmanager.com/gtag/js"]');
    if (gaSrc && st.gaId) {
      gaSrc.setAttribute("src", "https://www.googletagmanager.com/gtag/js?id=" + st.gaId);
      var cfg = gaSrc.nextElementSibling;
      if (cfg && /gtag\('config'/.test(cfg.textContent)) cfg.textContent = cfg.textContent.replace(/gtag\('config', '[^']*'\)/, "gtag('config', '" + st.gaId + "')");
    }
    if (pageKey === "index") {
      var g = doc.querySelector('meta[name="google-site-verification"]');
      if (st.gscCode) {
        if (!g) { g = doc.createElement("meta"); g.setAttribute("name", "google-site-verification"); doc.head.insertBefore(g, doc.querySelector('meta[name="theme-color"]')); }
        g.setAttribute("content", st.gscCode);
      } else if (g) g.parentNode.removeChild(g);
    }
  }
  function applyPage(doc, c, pageKey) {
    var changed = [];
    Array.prototype.forEach.call(doc.querySelectorAll("[data-cms]"), function (el) {
      var key = el.getAttribute("data-cms");
      if (R[key]) { var html = R[key](c); if (el.innerHTML !== html) { el.innerHTML = html; changed.push(key); } }
      else if (ATTR[key]) ATTR[key](el, c);
    });
    Array.prototype.forEach.call(doc.querySelectorAll("[data-cms-section]"), function (el) {
      var f = SECTIONS[el.getAttribute("data-cms-section")];
      if (f) { if (f(c)) el.removeAttribute("hidden"); else el.setAttribute("hidden", ""); }
    });
    if (pageKey) applyHead(doc, c, pageKey);
    return changed;
  }

  /* ---------------------------------------------------------------- halaman artikel */
  function renderPost(tpl, c, p) {
    var doc = tpl, site = (c.settings || {}).siteUrl || "", url = site + "/blog-" + p.slug + ".html";
    var cover = p.cover && p.cover.src ? String(p.cover.src).replace(/([?&]w=)720\b/, "$11400") : "";
    var set = function (key, html) { var el = doc.querySelector('[data-cms="' + key + '"]'); if (el) el.innerHTML = html; };
    set("post-crumb", '<li><a href="index.html">Beranda</a></li><li><a href="blog.html">Media &amp; Informasi</a></li><li aria-current="page">' + esc(p.title) + "</li>");
    set("post-title", esc(p.title));
    set("post-article", "\n      " + (cover ? '<div class="article-cover ph" data-reveal><img src="' + esc(cover) + '" alt="' + esc((p.cover && p.cover.alt) || p.title) + '" width="1400" height="612"></div>' : "") +
      '\n      <div class="article-meta">\n        <span class="tag tag--amber">' + esc(catLabel(c, p.category).toUpperCase()) + '</span>\n        <time datetime="' + esc(p.date) + '">' + dateLong(p.date) +
      '</time>\n        <span class="author"><span class="avatar" aria-hidden="true">' + esc((p.author || "AP").split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase()) +
      "</span>" + esc(p.author || "Admin PKP") + "</span>" + (p.readTime ? "\n        <span>" + icon("clock") + " " + esc(p.readTime) + "</span>" : "") +
      '\n      </div>\n      <div class="article-body">\n        ' + (p.body || "") + '\n      </div>\n      <div class="share">\n        <span>Bagikan artikel ini:</span>\n' +
      '        <a href="https://www.linkedin.com/sharing/share-offsite/?url=' + encodeURIComponent(url) + '" target="_blank" rel="noopener" aria-label="Bagikan ke LinkedIn">in</a>\n' +
      '        <a href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(url) + "&amp;text=" + encodeURIComponent(p.title) + '" target="_blank" rel="noopener" aria-label="Bagikan ke X">X</a>\n' +
      '        <button type="button" aria-label="Salin tautan artikel" data-copy-link>' + icon("link") + "</button>\n      </div>\n    ");
    var rel = postsSorted(c).filter(function (x) { return x.id !== p.id; });
    rel = rel.filter(function (x) { return x.category === p.category; }).concat(rel.filter(function (x) { return x.category !== p.category; })).slice(0, 3);
    var grads = ["", ' style="background:linear-gradient(135deg,#16233D,#0A1424)"', ' style="background:linear-gradient(135deg,#1E3A5F,#0F1E36)"'];
    set("post-related", "\n" + rel.map(function (x, i) {
      return '          <a href="' + postHref(x) + '"><span class="thumb"' + grads[i % 3] + "></span><span><strong>" + esc(x.title) + "</strong><small>" + dateLong(x.date) + "</small></span></a>";
    }).join("\n") + "\n        ");
    set("post-topics", (p.topics && p.topics.length ? p.topics : [catLabel(c, p.category)]).map(function (t) { return '<a href="blog.html">' + esc(t) + "</a>"; }).join(""));
    var title = p.seoTitle || (p.title + " | PKP"), desc = p.seoDescription || p.excerpt || "";
    applyHead(doc, c, null, { title: title, description: desc });
    setMeta(doc, 'link[rel="canonical"]', "href", url);
    setMeta(doc, 'meta[property="og:url"]', "content", url);
    if (cover) setMeta(doc, 'meta[property="og:image"]', "content", cover);
    Array.prototype.forEach.call(doc.querySelectorAll('script[type="application/ld+json"]'), function (s) {
      var o; try { o = JSON.parse(s.textContent); } catch (e) { return; }
      if (o["@type"] === "BlogPosting") {
        o.headline = p.title; o.description = desc; o.mainEntityOfPage = url; o.datePublished = p.date; if (cover) o.image = cover;
      } else if (o["@type"] === "BreadcrumbList" && o.itemListElement && o.itemListElement[2]) {
        o.itemListElement[2].name = p.title; o.itemListElement[2].item = url;
      }
      s.textContent = JSON.stringify(o);
    });
    return doc;
  }

  /* ---------------------------------------------------------------- sitemap */
  function sitemap(c, today) {
    var site = (c.settings || {}).siteUrl || "", pri = { index: "1.0", produk: "0.9", layanan: "0.9", tentang: "0.8", kontak: "0.8" };
    var pages = ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "blog-detail", "kontak"];
    var urls = pages.map(function (s) {
      return "  <url><loc>" + (s === "index" ? site + "/" : site + "/" + s + ".html") + "</loc><lastmod>" + today + "</lastmod><priority>" + (pri[s] || "0.6") + "</priority></url>";
    });
    postsSorted(c).filter(function (p) { return p.body && String(p.body).trim(); }).forEach(function (p) {
      urls.push("  <url><loc>" + site + "/blog-" + p.slug + ".html</loc><lastmod>" + (p.updatedAt || p.date || today).slice(0, 10) + "</lastmod><priority>0.6</priority></url>");
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join("\n") + "\n</urlset>\n";
  }

  /* halaman mana memuat region apa (untuk publikasi seperlunya) */
  var PAGES = ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "blog-detail", "kontak", "404"];

  global.PKPRender = {
    R: R, esc: esc, icon: icon, applyPage: applyPage, applyHead: applyHead, renderPost: renderPost, sitemap: sitemap,
    postHref: postHref, postsSorted: postsSorted, dateShort: dateShort, dateLong: dateLong, catLabel: catLabel, PAGES: PAGES
  };
})(typeof window !== "undefined" ? window : this);
