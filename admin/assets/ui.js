/* PKP SuperAdmin — komponen antarmuka: ikon, toast, modal, laci editor dengan
   pratinjau langsung, form terikat data, daftar yang bisa diurutkan. */
(function (global) {
  "use strict";
  var A = global.PKPAdmin, u = A.u, esc = u.esc;

  /* ---------------------------------------------------------------- ikon admin (garis, 24px) */
  var I = {
    dashboard: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
    box: '<path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>',
    smartphone: '<rect x="6" y="2" width="12" height="20" rx="2.5"/><path d="M11 18h2"/>',
    layers: '<path d="m12 2 10 5-10 5L2 7z"/><path d="m2 12 10 5 10-5"/><path d="m2 17 10 5 10-5"/>',
    handshake: '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.9-3.9a2 2 0 0 0-2.8 0l-.9.9a1 1 0 1 1-3-3l2.8-2.8a5.8 5.8 0 0 1 7.1-.8l.5.3a2 2 0 0 0 1.4.3L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
    news: '<path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8M15 18h-5M10 6h8v4h-8z"/>',
    briefcase: '<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',
    graduation: '<path d="M22 10 12 5 2 10l10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',
    award: '<circle cx="12" cy="8" r="6"/><path d="M15.5 13 17 22l-5-3-5 3 1.5-9"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>',
    inbox: '<path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.8 4H7.2a2 2 0 0 0-1.7 1.1z"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
    history: '<path d="M3 12a9 9 0 1 0 9-9 9.8 9.8 0 0 0-6.7 2.7L3 8"/><path d="M3 3v5h5M12 7v5l4 2"/>',
    settings: '<path d="M12.2 2h-.4a2 2 0 0 0-2 2v.2a2 2 0 0 1-1 1.7l-.4.3a2 2 0 0 1-2 0l-.2-.1a2 2 0 0 0-2.7.7l-.2.4a2 2 0 0 0 .7 2.7l.2.1a2 2 0 0 1 1 1.7v.5a2 2 0 0 1-1 1.8l-.2.1a2 2 0 0 0-.7 2.7l.2.4a2 2 0 0 0 2.7.7l.2-.1a2 2 0 0 1 2 0l.4.3a2 2 0 0 1 1 1.7v.2a2 2 0 0 0 2 2h.4a2 2 0 0 0 2-2v-.2a2 2 0 0 1 1-1.7l.4-.3a2 2 0 0 1 2 0l.2.1a2 2 0 0 0 2.7-.7l.2-.4a2 2 0 0 0-.7-2.7l-.2-.1a2 2 0 0 1-1-1.8v-.4a2 2 0 0 1 1-1.8l.2-.1a2 2 0 0 0 .7-2.7l-.2-.4a2 2 0 0 0-2.7-.7l-.2.1a2 2 0 0 1-2 0l-.4-.3a2 2 0 0 1-1-1.7V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M12 20h9"/><path d="M16.4 3.6a2.1 2.1 0 1 1 3 3L7 19l-4 1 1-4z"/>',
    trash: '<path d="M3 6h18M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6M10 11v6M14 11v6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeoff: '<path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 8 10 8a17.6 17.6 0 0 1-2.2 3.2M6.6 6.6C3.8 8.4 2 12 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.4-1.6M14.1 14.1A3 3 0 0 1 9.9 9.9M2 2l20 20"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    chevron: '<path d="m9 18 6-6-6-6"/>',
    chevdown: '<path d="m6 9 6 6 6-6"/>',
    back: '<path d="m15 18-6-6 6-6"/>',
    x: '<path d="M18 6 6 18M6 6l12 12"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    alert: '<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
    external: '<path d="M15 3h6v6M10 14 21 3M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    refresh: '<path d="M3 12a9 9 0 0 1 15.5-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.4L3 16M3 21v-5h5"/>',
    send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
    globe: '<circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',
    monitor: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>',
    more: '<circle cx="5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="19" cy="12" r="1.3"/>',
    mail: '<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
    bold: '<path d="M6 12h9a4 4 0 0 1 0 8H6V4h8a4 4 0 0 1 0 8"/>',
    italic: '<path d="M19 4h-9M14 20H5M15 4 9 20"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    olist: '<path d="M10 6h11M10 12h11M10 18h11M4 6h1v4M4 10h2M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>',
    quote: '<path d="M3 21c3 0 7-1 7-8V5c0-1.2-.8-2-2-2H4c-1.2 0-2 .8-2 2v6c0 1.1.9 2 2 2h3c0 3-1 4-4 5zM15 21c3 0 7-1 7-8V5c0-1.2-.8-2-2-2h-4c-1.2 0-2 .8-2 2v6c0 1.1.9 2 2 2h3c0 3-1 4-4 5z"/>',
    eraser: '<path d="m7 21-4.3-4.3a1 1 0 0 1 0-1.4l10-10a1 1 0 0 1 1.4 0l5.6 5.6a1 1 0 0 1 0 1.4L13 19"/><path d="M22 21H7M5 11l9 9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/>',
    megaphone: '<path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/>',
    rocket: '<path d="M4.5 16.5c-1.5 1.3-2 5-2 5s3.7-.5 5-2c.7-.8.7-2.1-.1-2.9a2.2 2.2 0 0 0-2.9-.1zM12 15l-3-3a22 22 0 0 1 2-3.9A12.9 12.9 0 0 1 22 2c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2z"/><path d="M9 12H4s.5-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.5 4-2c1.1-1.6 0-5 0-5"/>',
    star: '<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z"/>',
    heading: '<path d="M6 12h12M6 20V4M18 20V4"/>',
    undo: '<path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8M10 12h4"/>',
    reply: '<path d="m9 17-5-5 5-5"/><path d="M20 18v-2a4 4 0 0 0-4-4H4"/>',
    sparkle: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>',
    chart: '<path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>',
    tag: '<path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4z"/><circle cx="7.5" cy="7.5" r="1"/>',
    wrench: '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.8-3.8a6 6 0 0 1-7.9 7.9l-6.9 6.9a2.1 2.1 0 0 1-3-3l6.9-6.9a6 6 0 0 1 7.9-7.9z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.5 6.5h.01"/>'
  };
  var icon = function (n, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#a-' + n + '"/></svg>'; };
  var sprite = '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + Object.keys(I).map(function (k) {
    return '<symbol id="a-' + k + '" viewBox="0 0 24 24">' + I[k] + "</symbol>";
  }).join("") + "</defs></svg>";
  /* sprite ditaruh di luar <body> agar tidak hilang saat isi body diganti */
  var mountSprite = function () {
    if (!document.getElementById("admin-sprite")) { var h = document.createElement("div"); h.id = "admin-sprite"; h.hidden = true; h.innerHTML = sprite; document.documentElement.appendChild(h); }
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mountSprite); else mountSprite();
  var siteIcon = function (n, cls) { return '<svg class="icon' + (cls ? " " + cls : "") + '" aria-hidden="true"><use href="#i-' + esc(n) + '"/></svg>'; };

  var el = function (html) { var t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------------------------------------------------------------- toast */
  var toastBox;
  function toast(msg, opt) {
    opt = opt || {};
    if (opt.type === "bad" && /^Versi tampilan/.test(msg)) opt = { title: "Mode tampilan saja" };   /* standalone pratinjau */
    if (!toastBox) { toastBox = el('<div class="toasts" role="status" aria-live="polite"></div>'); document.body.appendChild(toastBox); }
    var t = el('<div class="toast' + (opt.type === "bad" ? " toast--bad" : "") + '">' + icon(opt.type === "bad" ? "alert" : "check") + "<div>" +
      (opt.title ? "<b>" + esc(opt.title) + "</b>" : "") + "<span>" + esc(msg) + '</span></div><button type="button" aria-label="Tutup">' + icon("x", "icon--sm") + "</button></div>");
    toastBox.appendChild(t);
    var kill = function () { t.style.transition = "opacity .2s"; t.style.opacity = "0"; setTimeout(function () { t.remove(); }, 200); };
    t.querySelector("button").onclick = kill; setTimeout(kill, opt.ms || (opt.type === "bad" ? 7000 : 3800));
  }

  /* ---------------------------------------------------------------- modal */
  var focusables = 'a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"]),[contenteditable="true"]';
  function trap(root, e) {
    if (e.key !== "Tab") return;
    var f = $$(focusables, root).filter(function (x) { return x.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  }
  function modal(o) {
    var prev = document.activeElement;
    var wrap = el('<div class="modal-wrap"><div class="scrim"></div><div class="modal' + (o.wide ? " modal--wide" : "") + (o.cls ? " " + o.cls : "") + '" role="dialog" aria-modal="true" aria-labelledby="mh"></div></div>');
    var m = wrap.querySelector(".modal");
    m.innerHTML = (o.raw ? "" : '<div class="modal-head">' + (o.icon ? '<span class="modal-icon' + (o.tone ? " modal-icon--" + o.tone : "") + '">' + icon(o.icon) + "</span>" : "") +
      '<div><h2 id="mh">' + esc(o.title) + "</h2>" + (o.text ? "<p>" + esc(o.text) + "</p>" : "") + '</div></div><div class="modal-body"></div><div class="modal-foot"></div>');
    var body = o.raw ? m : m.querySelector(".modal-body");
    if (typeof o.body === "string") body.innerHTML = o.body; else if (o.body) body.appendChild(o.body);
    if (!o.body && !o.raw) body.remove();
    var foot = m.querySelector(".modal-foot");
    var close = function (val) {
      document.removeEventListener("keydown", onKey); wrap.querySelector(".scrim").classList.remove("is-in"); m.classList.remove("is-in");
      setTimeout(function () { wrap.remove(); if (prev && prev.focus) prev.focus(); }, 180);
      if (o.onClose) o.onClose(val);
    };
    (o.actions || []).forEach(function (a) {
      var b = el('<button type="button" class="btn btn--' + (a.kind || "secondary") + '">' + (a.icon ? icon(a.icon) : "") + esc(a.label) + "</button>");
      b.onclick = function () {
        if (!a.onClick) return close(a.value);
        var r = a.onClick(b, close);
        if (r && r.then) { b.classList.add("is-busy"); r.then(function (v) { if (v !== false) close(a.value); }, function (e) { b.classList.remove("is-busy"); toast(e.message, { type: "bad" }); }).then(function () { b.classList.remove("is-busy"); }); }
        else if (r !== false) close(a.value);
      };
      foot.appendChild(b);
    });
    if (foot && !foot.children.length) foot.remove();
    var onKey = function (e) { if (e.key === "Escape") close(); trap(m, e); };
    document.addEventListener("keydown", onKey);
    wrap.querySelector(".scrim").onclick = function () { close(); };
    document.body.appendChild(wrap);
    requestAnimationFrame(function () { wrap.querySelector(".scrim").classList.add("is-in"); m.classList.add("is-in");
      var f = $(o.focus || "input,textarea,select", m) || $$(".modal-foot .btn", m).pop(); if (f) f.focus(); });
    return { el: m, close: close };
  }
  function confirmBox(o) {
    return new Promise(function (resolve) {
      modal({ title: o.title, text: o.text, icon: o.icon || (o.danger ? "trash" : "info"), tone: o.danger ? "danger" : o.tone, body: o.body,
        actions: [{ label: o.cancel || "Batal", kind: "ghost", value: false }, { label: o.ok || "Lanjutkan", kind: o.danger ? "danger-solid" : "primary", value: true }],
        onClose: function (v) { resolve(!!v); } });
    });
  }

  /* ---------------------------------------------------------------- menu popover */
  function popover(anchor, items) {
    var old = $(".pop"); if (old) old.remove();
    var p = el('<div class="pop" role="menu"></div>');
    items.forEach(function (it) {
      if (it === "-") { p.appendChild(el("<hr>")); return; }
      var b = el('<button type="button" role="menuitem"' + (it.danger ? ' class="danger"' : "") + ">" + (it.icon ? icon(it.icon) : "") + esc(it.label) + "</button>");
      b.onclick = function () { p.remove(); it.onClick(); };
      p.appendChild(b);
    });
    document.body.appendChild(p);
    var r = anchor.getBoundingClientRect(), pw = p.offsetWidth, ph = p.offsetHeight;
    var top = r.bottom + 6 + window.scrollY; if (r.bottom + ph + 12 > innerHeight) top = r.top - ph - 6 + window.scrollY;
    p.style.top = top + "px"; p.style.left = Math.max(8, Math.min(r.right - pw, innerWidth - pw - 8)) + window.scrollX + "px";
    var first = p.querySelector("button"); if (first) first.focus();
    setTimeout(function () {
      var off = function (e) { if (!p.contains(e.target)) { p.remove(); document.removeEventListener("pointerdown", off); document.removeEventListener("keydown", esc2); } };
      var esc2 = function (e) { if (e.key === "Escape") { p.remove(); anchor.focus(); document.removeEventListener("keydown", esc2); } };
      document.addEventListener("pointerdown", off); document.addEventListener("keydown", esc2);
    });
  }

  /* ---------------------------------------------------------------- akses data via path "a.b.0.c" */
  var getP = function (o, p) { return String(p).split(".").reduce(function (x, k) { return x == null ? x : x[k]; }, o); };
  var setP = function (o, p, v) {
    var ks = String(p).split("."), last = ks.pop(), t = o;
    ks.forEach(function (k, i) { if (t[k] == null) t[k] = /^\d+$/.test(ks[i + 1] || last) ? [] : {}; t = t[k]; });
    t[last] = v;
  };

  /* ---------------------------------------------------------------- aset website (CSS, ikon) untuk pratinjau */
  var site = { ready: null, css: "", sprite: "", icons: [], pages: {} };
  function loadSite() {
    if (site.ready) return site.ready;
    if (global.PKP_SITE) {                                    /* versi standalone: aset website tertanam */
      var E = global.PKP_SITE;
      site.cssText = E.css; site.sprite = E.sprite; site.pages = E.pages || {};
      site.icons = (site.sprite.match(/id="i-([a-z0-9-]+)"/g) || []).map(function (s) { return s.slice(6, -1); });
      var hd = document.createElement("div"); hd.id = "site-sprite"; hd.hidden = true; hd.innerHTML = site.sprite; document.documentElement.appendChild(hd);
      site.ready = Promise.resolve();
      return site.ready;
    }
    site.ready = fetch(A.siteRoot() + "index.html", { cache: "no-store" }).then(function (r) { return r.text(); }).then(function (h) {
      site.pages.index = h;
      var css = h.match(/<link rel="stylesheet" href="(assets\/css\/[^"]+)"/); site.css = css ? css[1] : "assets/css/style.css";
      var sp = h.match(/<svg width="0" height="0"[\s\S]*?<\/svg>/); site.sprite = sp ? sp[0] : "";
      site.icons = (site.sprite.match(/id="i-([a-z0-9-]+)"/g) || []).map(function (s) { return s.slice(6, -1); });
      var holder = document.createElement("div"); holder.id = "site-sprite"; holder.hidden = true; holder.innerHTML = site.sprite; document.documentElement.appendChild(holder);
    }).catch(function () { site.icons = []; });
    return site.ready;
  }
  function pageHtml(name) {
    if (site.pages[name]) return Promise.resolve(site.pages[name]);
    if (global.PKP_SITE) return Promise.reject(new Error("tidak tersedia"));
    return fetch(A.siteRoot() + name + ".html", { cache: "no-store" }).then(function (r) { if (!r.ok) throw new Error(); return r.text(); }).then(function (h) { site.pages[name] = h; return h; });
  }
  A.site = site; A.loadSite = loadSite; A.pageHtml = pageHtml;

  /* pratinjau satu bagian halaman, dirender dengan CSS asli website */
  function Preview(host, spec) {
    var mode = "desktop", frame, browser, stage, lastHtml = "";
    host.innerHTML = '<div class="preview-bar"><b>Tampilan di website</b><span class="live">Langsung</span><span class="spacer"></span>' +
      '<div class="seg" role="group" aria-label="Ukuran layar"><button type="button" data-m="desktop" aria-pressed="true">' + icon("monitor", "icon--sm") + 'Desktop</button><button type="button" data-m="mobile" aria-pressed="false">' +
      icon("smartphone", "icon--sm") + "Mobile</button></div></div>" +
      '<div class="preview-stage"><div class="browser"><div class="browser-bar"><i></i><i></i><i></i><span></span></div><iframe title="Pratinjau" tabindex="-1"></iframe></div></div>';
    frame = host.querySelector("iframe"); browser = host.querySelector(".browser"); stage = host.querySelector(".preview-stage");
    if (innerWidth < 720) { mode = "mobile"; $$("[data-m]", host).forEach(function (x) { x.setAttribute("aria-pressed", x.dataset.m === "mobile"); }); }
    host.querySelector(".browser-bar span").textContent = "pkp.co.id/" + (spec.page === "index" ? "" : spec.page + ".html");
    $$("[data-m]", host).forEach(function (b) { b.onclick = function () { mode = b.dataset.m; $$("[data-m]", host).forEach(function (x) { x.setAttribute("aria-pressed", x === b); }); fit(); }; });
    function fit() {
      var W = mode === "mobile" ? 390 : 1280, avail = stage.clientWidth - 36, k = Math.min(1, avail / W);
      browser.style.width = W + "px"; browser.style.transform = "scale(" + k + ")"; browser.style.transformOrigin = "top left";
      browser.style.marginLeft = Math.max(0, (avail - W * k) / 2) + "px";
      var d = frame.contentDocument, hgt = (d && d.documentElement && d.documentElement.scrollHeight) || 400;
      frame.style.height = hgt + "px"; browser.style.height = hgt + 30 + "px";
      stage.style.height = ""; browser.parentNode.style.height = (hgt + 30) * k + 36 + "px";
    }
    var ro = new ResizeObserver(function () { fit(); }); ro.observe(stage);
    function render(content) {
      return Promise.all([loadSite(), pageHtml(spec.page)]).then(function (r) {
        var doc = new DOMParser().parseFromString(r[1], "text/html");
        PKPRender.applyPage(doc, content, spec.page);
        var node = spec.selector ? doc.querySelector(spec.selector) : null;
        if (node && spec.closest) node = node.closest(spec.closest) || node;
        var html = node ? node.outerHTML : '<div style="padding:40px;font:14px system-ui;color:#6F8296">Bagian ini sedang disembunyikan dari website.</div>';
        if (node && node.hasAttribute("hidden")) html = '<div style="padding:40px;font:14px system-ui;color:#6F8296">Bagian ini sedang disembunyikan dari website.</div>';
        if (spec.wrap) html = spec.wrap(html);
        if (html === lastHtml) return;
        lastHtml = html;
        if (global.PKP_SITE) html = html.replace(/(<img\b[^>]*\bsrc=")([^"]+)"/g, function (m, a, src) { return a + (A.assetUrl(src) || src) + '"'; });
        var src = '<!doctype html><html lang="id"><head><meta charset="utf-8"><base href="' + A.siteRoot() + '">' + (site.cssText ? "<style>" + site.cssText + "</style>" : '<link rel="stylesheet" href="' + site.css + '">') +
          '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap">' +
          "<style>body{margin:0}.page-hero,.hero{padding-top:56px!important}[hidden]{display:none!important}</style></head><body>" + site.sprite + html + "</body></html>";
        frame.onload = function () { fit(); setTimeout(fit, 300); };
        frame.srcdoc = src;
      }).catch(function () {
        host.querySelector(".preview-stage").innerHTML = '<div class="empty"><span class="item-icon">' + icon("monitor") + '</span><b>Pratinjau tidak tersedia</b><p>Halaman website tidak dapat dibaca. Buka SuperAdmin melalui server (bukan langsung dari file) agar pratinjau tampil.</p></div>';
      });
    }
    return { render: u.debounce(render, 220), renderNow: render, destroy: function () { ro.disconnect(); } };
  }

  /* ---------------------------------------------------------------- laci editor */
  function drawer(o) {
    var prev = document.activeElement, dirty = false;
    var scrim = el('<div class="scrim"></div>');
    var d = el('<aside class="drawer' + (o.preview ? "" : " drawer--narrow") + '" role="dialog" aria-modal="true" aria-labelledby="dh">' +
      '<div class="drawer-head"><button type="button" class="btn btn--ghost btn--icon" data-close aria-label="Tutup">' + icon("x") + '</button><h2 id="dh"></h2><span class="dh-badge"></span><span class="spacer"></span>' +
      (o.preview ? '<button type="button" class="btn btn--secondary btn--sm show-prev hidden-lg" data-toggle-prev>' + icon("eye", "icon--sm") + "Pratinjau</button>" : "") +
      (o.headActions || "") + "</div>" +
      '<div class="drawer-body"><form class="drawer-form form" novalidate></form>' + (o.preview ? '<section class="preview" aria-label="Pratinjau"></section>' : "") + "</div>" +
      '<div class="drawer-foot"><span class="hint">' + icon("info", "icon--sm") + ' Tersimpan sebagai draf — tampil di website setelah <b>Publikasikan</b>.</span>' +
      '<button type="button" class="btn btn--ghost" data-close>Batal</button><button type="submit" class="btn btn--primary" data-save>' + icon("check") + esc(o.saveLabel || "Simpan perubahan") + "</button></div></aside>");
    d.querySelector("#dh").textContent = o.title;
    if (o.badge) d.querySelector(".dh-badge").innerHTML = o.badge;
    var form = d.querySelector("form");
    if (typeof o.form === "string") form.innerHTML = o.form; else if (o.form) form.appendChild(o.form);
    var tp = d.querySelector("[data-toggle-prev]");
    if (tp) { tp.onclick = function () { d.classList.toggle("show-preview"); }; if (innerWidth > 1200) tp.classList.add("hidden"); }
    document.body.appendChild(scrim); document.body.appendChild(d);
    document.body.style.overflow = "hidden";
    requestAnimationFrame(function () { scrim.classList.add("is-in"); d.classList.add("is-in"); });
    var api = {
      el: d, form: form, setDirty: function (v) { dirty = v !== false; },
      close: function (force) {
        var go = function () {
          document.removeEventListener("keydown", onKey); scrim.classList.remove("is-in"); d.classList.remove("is-in");
          document.body.style.overflow = "";
          setTimeout(function () { scrim.remove(); d.remove(); if (api.preview) api.preview.destroy(); if (prev && prev.focus) prev.focus(); }, 280);
          if (o.onClose) o.onClose();
        };
        if (dirty && !force) confirmBox({ title: "Tutup tanpa menyimpan?", text: "Perubahan di formulir ini akan hilang.", ok: "Tutup", danger: true, icon: "alert" }).then(function (y) { if (y) go(); });
        else go();
      }
    };
    if (o.preview) api.preview = Preview(d.querySelector(".preview"), o.preview);
    $$("[data-close]", d).forEach(function (b) { b.onclick = function () { api.close(); }; });
    scrim.onclick = function () { api.close(); };
    var save = d.querySelector("[data-save]");
    var doSave = function () {
      if (o.validate) { var err = o.validate(); if (err) { toast(err, { type: "bad" }); return; } }
      save.classList.add("is-busy");
      Promise.resolve(o.onSave()).then(function (r) { save.classList.remove("is-busy"); if (r !== false) { dirty = false; api.close(true); } },
        function (e) { save.classList.remove("is-busy"); toast(e.message, { type: "bad", title: "Belum tersimpan" }); });
    };
    save.onclick = doSave;
    form.onsubmit = function (e) { e.preventDefault(); doSave(); };
    var onKey = function (e) {
      if (e.key === "Escape" && !$(".modal-wrap")) api.close();
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); doSave(); }
      if (!$(".modal-wrap")) trap(d, e);
    };
    document.addEventListener("keydown", onKey);
    setTimeout(function () { var f = $("input,textarea,select", form); if (f) f.focus({ preventScroll: true }); }, 320);
    return api;
  }

  /* ---------------------------------------------------------------- form terikat data */
  var F = {
    text: function (path, label, o) {
      o = o || {};
      var input = '<input class="input' + (o.mono ? " input--mono" : "") + '" id="f-' + path + '" data-path="' + path + '"' + (o.type ? ' type="' + o.type + '"' : ' type="text"') +
        (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : "") + (o.max ? ' data-max="' + o.max + '"' : "") + (o.required ? " required" : "") + (o.list ? ' list="' + o.list + '"' : "") + ">";
      return '<div class="field' + (o.cls ? " " + o.cls : "") + '"><label for="f-' + path + '">' + esc(label) + (o.optional ? ' <span class="opt">opsional</span>' : "") +
        (o.max ? '<span class="counter" data-for="' + path + '"></span>' : "") + "</label>" +
        (o.prefix ? '<div class="input-group"><span class="prefix">' + esc(o.prefix) + "</span>" + input + "</div>" : input) +
        (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    textarea: function (path, label, o) {
      o = o || {};
      return '<div class="field' + (o.cls ? " " + o.cls : "") + '"><label for="f-' + path + '">' + esc(label) + (o.optional ? ' <span class="opt">opsional</span>' : "") +
        (o.max ? '<span class="counter" data-for="' + path + '"></span>' : "") + '</label><textarea class="textarea" id="f-' + path + '" data-path="' + path + '" rows="' + (o.rows || 4) + '"' +
        (o.max ? ' data-max="' + o.max + '"' : "") + (o.min ? ' data-min="' + o.min + '"' : "") + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : "") + (o.html ? ' data-html="inline"' : "") + "></textarea>" +
        (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    select: function (path, label, opts, o) {
      o = o || {};
      return '<div class="field' + (o.cls ? " " + o.cls : "") + '"><label for="f-' + path + '">' + esc(label) + '</label><select class="select" id="f-' + path + '" data-path="' + path + '">' +
        opts.map(function (x) { return '<option value="' + esc(x[0]) + '">' + esc(x[1]) + "</option>"; }).join("") + "</select>" + (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    toggle: function (path, label, o) {
      o = o || {};
      return '<div class="field' + (o.cls ? " " + o.cls : "") + '"><label class="switch"><input type="checkbox" data-path="' + path + '"' + (o.invert ? ' data-invert="1"' : "") + '><span class="track"></span>' + esc(label) + "</label>" +
        (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    tags: function (path, label, o) {
      o = o || {};
      return '<div class="field"><span class="field-label">' + esc(label) + (o.optional ? ' <span class="opt">opsional</span>' : "") + '</span><div class="tags" data-tags="' + path + '"><input type="text" aria-label="' + esc(label) +
        '" placeholder="' + esc(o.placeholder || "Ketik lalu tekan Enter") + '"></div>' + (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    image: function (path, label, o) {
      o = o || {};
      return '<div class="field"><span class="field-label">' + esc(label) + (o.optional ? ' <span class="opt">opsional</span>' : "") + '</span><div class="uploader" data-image="' + path + '" data-kind="' + (o.kind || "photo") +
        '" data-folder="' + (o.folder || "media") + '" data-maxw="' + (o.maxW || 1760) + '"' + (o.alt === false ? ' data-noalt="1"' : "") + "></div>" + (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    icon: function (path, label) {
      return '<div class="field"><span class="field-label">' + esc(label) + '</span><button type="button" class="icon-pick" data-icon="' + path + '"><span class="ib"></span><span class="nm"></span>' + icon("chevdown", "icon--sm") + "</button></div>";
    },
    repeater: function (path, label, o) {
      return '<div class="field"><span class="field-label">' + esc(label) + (o.hintTop ? ' <span class="opt">' + esc(o.hintTop) + "</span>" : "") + '</span><div class="repeater" data-repeater="' + path + '" data-rid="' + (o.id || path) + '"></div>' +
        (o.hint ? '<span class="hint">' + o.hint + "</span>" : "") + "</div>";
    },
    rich: function (path) {
      return '<div class="rte"><div class="rte-bar" role="toolbar" aria-label="Format teks">' +
        '<button type="button" data-cmd="formatBlock" data-val="P" title="Paragraf">P</button><button type="button" data-cmd="formatBlock" data-val="H2" title="Subjudul">H2</button><button type="button" data-cmd="formatBlock" data-val="H3" title="Sub-subjudul">H3</button><span class="sep"></span>' +
        '<button type="button" data-cmd="bold" title="Tebal (Ctrl+B)">' + icon("bold", "icon--sm") + '</button><button type="button" data-cmd="italic" title="Miring (Ctrl+I)">' + icon("italic", "icon--sm") + '</button><button type="button" data-cmd="link" title="Tautan">' + icon("link", "icon--sm") + "</button><span class=\"sep\"></span>" +
        '<button type="button" data-cmd="insertUnorderedList" title="Daftar">' + icon("list", "icon--sm") + '</button><button type="button" data-cmd="insertOrderedList" title="Daftar bernomor">' + icon("olist", "icon--sm") + '</button><button type="button" data-cmd="formatBlock" data-val="BLOCKQUOTE" title="Kutipan">' + icon("quote", "icon--sm") + "</button><span class=\"sep\"></span>" +
        '<button type="button" data-cmd="removeFormat" title="Hapus format">' + icon("eraser", "icon--sm") + '</button></div><div class="rte-area" contenteditable="true" data-rich="' + path + '" data-placeholder="Tulis isi artikel di sini…" role="textbox" aria-multiline="true" aria-label="Isi artikel"></div>' +
        '<div class="rte-foot"><span data-words>0 kata</span><span data-read>± 1 menit baca</span></div></div>';
    }
  };

  /* repeater: definisi kolom per baris */
  var REPEATERS = {};
  function defineRepeater(id, def) { REPEATERS[id] = def; }

  function bindForm(root, model, onChange) {
    var change = function () { if (onChange) onChange(); };
    var counter = function (inp) {
      var c = root.querySelector('.counter[data-for="' + inp.dataset.path + '"]'); if (!c) return;
      var n = inp.value.length, max = +inp.dataset.max, min = +(inp.dataset.min || 0);
      c.textContent = n + "/" + max; c.className = "counter " + (n > max ? "is-bad" : min && n < min ? "is-warn" : n ? "is-ok" : "");
    };
    $$("[data-path]", root).forEach(function (inp) {
      if (inp.dataset.bound) return;
      inp.dataset.bound = "1";
      var v = getP(model, inp.dataset.path);
      if (inp.type === "checkbox") inp.checked = inp.dataset.invert ? v === false : v !== false && !!(v === undefined ? true : v);
      else inp.value = v == null ? "" : v;
      if (inp.dataset.max) counter(inp);
      inp.addEventListener(inp.type === "checkbox" || inp.tagName === "SELECT" ? "change" : "input", function () {
        var val = inp.type === "checkbox" ? (inp.dataset.invert ? !inp.checked : inp.checked) : inp.type === "number" ? +inp.value : inp.value;
        if (inp.dataset.html === "inline") val = inp.value;
        setP(model, inp.dataset.path, val);
        if (inp.dataset.max) counter(inp);
        change();
      });
      if (inp.dataset.html === "inline") inp.addEventListener("blur", function () { var s = A.sanitize(inp.value, true); if (s !== inp.value) { inp.value = s; setP(model, inp.dataset.path, s); change(); } });
    });
    $$("[data-tags]", root).forEach(function (box) {
      if (box.dataset.bound) return; box.dataset.bound = "1";
      var path = box.dataset.tags, inp = box.querySelector("input");
      var draw = function () {
        $$(".chip", box).forEach(function (c) { c.remove(); });
        (getP(model, path) || []).forEach(function (t, i) {
          var c = el('<span class="chip">' + esc(t) + '<button type="button" aria-label="Hapus ' + esc(t) + '">' + icon("x") + "</button></span>");
          c.querySelector("button").onclick = function () { var a = (getP(model, path) || []).slice(); a.splice(i, 1); setP(model, path, a); draw(); change(); inp.focus(); };
          box.insertBefore(c, inp);
        });
      };
      var add = function () {
        var vals = inp.value.split(/[,;]/).map(function (s) { return s.trim(); }).filter(Boolean);
        if (!vals.length) return;
        setP(model, path, (getP(model, path) || []).concat(vals)); inp.value = ""; draw(); change();
      };
      inp.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(); }
        if (e.key === "Backspace" && !inp.value) { var a = (getP(model, path) || []).slice(); a.pop(); setP(model, path, a); draw(); change(); }
      });
      inp.addEventListener("blur", add);
      box.addEventListener("click", function (e) { if (e.target === box) inp.focus(); });
      draw();
    });
    $$("[data-image]", root).forEach(function (box) { if (!box.dataset.bound) { box.dataset.bound = "1"; imageField(box, model, change); } });
    $$("[data-icon]", root).forEach(function (btn) {
      if (btn.dataset.bound) return; btn.dataset.bound = "1";
      var path = btn.dataset.icon;
      var draw = function () { var v = getP(model, path) || ""; btn.querySelector(".ib").innerHTML = v ? siteIcon(v) : ""; btn.querySelector(".nm").textContent = v || "Pilih ikon"; };
      btn.onclick = function () { iconPicker(getP(model, path)).then(function (v) { if (v) { setP(model, path, v); draw(); change(); } }); };
      loadSite().then(draw); draw();
    });
    $$("[data-repeater]", root).forEach(function (box) { if (!box.dataset.bound) { box.dataset.bound = "1"; repeater(box, model, change); } });
    $$("[data-rich]", root).forEach(function (area) { if (!area.dataset.bound) { area.dataset.bound = "1"; richField(area, model, change); } });
  }

  function repeater(box, model, change) {
    var path = box.dataset.repeater, def = REPEATERS[box.dataset.rid];
    var draw = function () {
      var list = getP(model, path) || [];
      box.innerHTML = "";
      var ul = el('<ul class="sortable card" style="overflow:hidden"></ul>');
      list.forEach(function (it, i) {
        var li = el('<li class="item" style="align-items:flex-start;padding-top:12px"><button type="button" class="handle" aria-label="Geser untuk mengurutkan" title="Seret untuk mengurutkan (atau Alt+↑/↓)">' + icon("grip") + "</button>" +
          '<div class="item-main" style="display:grid;gap:10px">' + def.fields(path + "." + i, it, i) + '</div><div class="item-actions"><button type="button" class="btn btn--ghost btn--icon btn--sm" data-del aria-label="Hapus baris">' + icon("trash", "icon--sm") + "</button></div></li>");
        li.querySelector("[data-del]").onclick = function () { var a = (getP(model, path) || []).slice(); a.splice(i, 1); setP(model, path, a); draw(); change(); };
        ul.appendChild(li);
      });
      if (list.length) box.appendChild(ul);
      var add = el('<button type="button" class="btn btn--secondary btn--sm" style="margin-top:' + (list.length ? 10 : 0) + 'px">' + icon("plus", "icon--sm") + esc(def.addLabel || "Tambah") + "</button>");
      add.onclick = function () { var a = (getP(model, path) || []).slice(); a.push(typeof def.empty === "function" ? def.empty() : u.clone(def.empty)); setP(model, path, a); draw(); change();
        var last = box.querySelector(".item:last-child input, .item:last-child textarea"); if (last) last.focus(); };
      if (!def.max || list.length < def.max) box.appendChild(add);
      bindForm(box, model, change);
      sortable(ul, { onMove: function (from, to) { var a = (getP(model, path) || []).slice(); a.splice(to, 0, a.splice(from, 1)[0]); setP(model, path, a); draw(); change(); } });
    };
    draw();
  }

  function richField(area, model, change) {
    var path = area.dataset.rich, wrap = area.closest(".rte");
    area.innerHTML = getP(model, path) || "";
    var stats = function () {
      var w = (area.innerText || "").trim().split(/\s+/).filter(Boolean).length;
      wrap.querySelector("[data-words]").textContent = w + " kata";
      wrap.querySelector("[data-read]").textContent = "± " + Math.max(1, Math.round(w / 200)) + " menit baca";
      return w;
    };
    var sync = u.debounce(function () { setP(model, path, A.sanitize(area.innerHTML)); stats(); change(); }, 250);
    area.addEventListener("input", sync);
    area.addEventListener("paste", function (e) {
      e.preventDefault();
      var html = (e.clipboardData || window.clipboardData).getData("text/html"), text = (e.clipboardData || window.clipboardData).getData("text/plain");
      var clean = html ? A.sanitize(html) : esc(text).split(/\n{2,}/).map(function (p) { return "<p>" + p.replace(/\n/g, "<br>") + "</p>"; }).join("");
      document.execCommand("insertHTML", false, clean);
    });
    $$("[data-cmd]", wrap).forEach(function (b) {
      b.addEventListener("mousedown", function (e) { e.preventDefault(); });
      b.onclick = function () {
        var cmd = b.dataset.cmd;
        if (cmd === "link") {
          var url = prompt("Alamat tautan (https://… atau produk.html):", "https://");
          if (url && url !== "https://") document.execCommand("createLink", false, url);
        } else document.execCommand(cmd, false, b.dataset.val ? "<" + b.dataset.val + ">" : null);
        area.focus(); sync();
      };
    });
    stats();
    area.getWords = stats;
  }

  /* pengunggah gambar: kompres ke WebP, tampilkan penghematan */
  function imageField(box, model, change) {
    var path = box.dataset.image, kind = box.dataset.kind, noalt = box.dataset.noalt;
    var draw = function (busy, note) {
      var im = getP(model, path) || {}, has = im && im.src;
      box.innerHTML = '<div class="up-preview' + (kind === "cover" ? " up-preview--cover" : "") + '" style="' + (kind === "app" ? "aspect-ratio:3/5" : kind === "logo" ? "aspect-ratio:2/1" : "") + '">' +
        (has ? '<img src="' + esc(A.imgUrl(im.src)) + '" alt="">' : '<div class="ph">' + icon("image", "icon--lg") + "Belum ada gambar</div>") + "</div>" +
        '<div class="up-drop"><p><b>Seret gambar ke sini</b> atau</p><div class="row"><label class="btn btn--secondary btn--sm">' + icon("upload", "icon--sm") + (has ? "Ganti gambar" : "Pilih file") +
        '<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden></label>' + (has ? '<button type="button" class="btn btn--ghost btn--sm" data-rm>' + icon("trash", "icon--sm") + "Hapus</button>" : "") + "</div>" +
        (kind === "logo" ? '<label class="switch" style="font-weight:500"><input type="checkbox" data-white checked><span class="track"></span>Hapus latar putih otomatis</label>' : "") +
        (busy ? '<div class="up-progress"><i></i></div><span class="hint">Mengompres & mengunggah…</span>' : '<span class="hint">' + (note || "PNG/JPG/WebP. Otomatis dikompres ke WebP" + (kind === "logo" ? ", dirapikan & diskalakan agar seimbang dengan logo lain." : ".")) + "</span>") +
        (has && !noalt ? '<div class="field" style="width:100%"><label for="alt-' + path + '" style="font-weight:600">Teks alternatif <span class="opt">untuk SEO & pembaca layar</span></label><input class="input" id="alt-' + path + '" data-alt value="' + esc(im.alt || "") + '" placeholder="Jelaskan isi gambar"></div>' : "") + "</div>";
      var file = box.querySelector("input[type=file]"); file.onchange = function () { if (file.files[0]) handle(file.files[0]); };
      var rm = box.querySelector("[data-rm]"); if (rm) rm.onclick = function () { setP(model, path, null); draw(); change(); };
      var alt = box.querySelector("[data-alt]"); if (alt) alt.oninput = function () { var x = getP(model, path) || {}; x.alt = alt.value; setP(model, path, x); change(); };
      var drop = box.querySelector(".up-drop");
      ["dragenter", "dragover"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.add("is-over"); }); });
      ["dragleave", "drop"].forEach(function (t) { drop.addEventListener(t, function (e) { e.preventDefault(); drop.classList.remove("is-over"); }); });
      drop.addEventListener("drop", function (e) { var f = e.dataTransfer.files[0]; if (f) handle(f); });
    };
    var handle = function (f) {
      var white = box.querySelector("[data-white]"), removeWhite = white ? white.checked : false;
      var maxW = +box.dataset.maxw;
      draw(true);
      A.processImage(f, kind === "logo" ? { logo: true, removeWhite: removeWhite } : { maxW: maxW, flatten: kind === "cover" })
        .then(function (res) { return A.uploadImage(res, box.dataset.folder).then(function (up) { return [res, up]; }); })
        .then(function (r) {
          var res = r[0], up = r[1], old = getP(model, path) || {};
          var val = kind === "logo" ? { src: up.src, w: res.display.w, h: res.display.h } : { src: up.src, alt: old.alt || res.name.replace(/[-_]+/g, " "), w: res.w, h: res.h };
          if (kind === "app") { val.w = 217; val.h = Math.round(217 * res.h / res.w); }
          if (kind === "photo" && maxW >= 1760) { val.w = Math.round(res.w / 2); val.h = Math.round(res.h / 2); }
          setP(model, path, val);
          draw(false, "Dikompres " + u.bytes(res.before) + " → <b>" + u.bytes(res.after) + "</b> (" + res.w + "×" + res.h + " px)");
          change();
        }, function (e) { draw(false); toast(e.message, { type: "bad", title: "Gambar gagal diproses" }); });
    };
    draw();
  }

  /* pemilih ikon dari sprite website */
  function iconPicker(current) {
    return loadSite().then(function () {
      return new Promise(function (resolve) {
        var picked = null;
        var body = el('<div><div class="search" style="max-width:none;margin-bottom:12px">' + icon("search") + '<input class="input" placeholder="Cari ikon…" aria-label="Cari ikon"></div><div class="icon-grid"></div></div>');
        var grid = body.querySelector(".icon-grid");
        var draw = function (q) {
          grid.innerHTML = site.icons.filter(function (n) { return !q || n.indexOf(q) >= 0; }).map(function (n) {
            return '<button type="button" data-n="' + n + '" aria-pressed="' + (n === current) + '">' + siteIcon(n) + "<span>" + n + "</span></button>";
          }).join("") || '<p class="muted">Ikon tidak ditemukan.</p>';
        };
        draw("");
        body.querySelector("input").oninput = function (e) { draw(e.target.value.trim().toLowerCase()); };
        var m = modal({ title: "Pilih ikon", text: "Ikon yang sama dengan yang dipakai di website.", body: body, wide: true, onClose: function () { resolve(picked); } });
        grid.addEventListener("click", function (e) { var b = e.target.closest("button[data-n]"); if (b) { picked = b.dataset.n; m.close(); } });
      });
    });
  }

  /* ---------------------------------------------------------------- daftar bisa diurutkan (seret / Alt+panah) */
  function sortable(list, o) {
    if (!list) return;
    var items = function () { return Array.prototype.slice.call(list.children).filter(function (x) { return !x.classList.contains("drop-line") && !x.hasAttribute("data-static"); }); };
    list.addEventListener("keydown", function (e) {
      var h = e.target.closest(o.handleSel || ".handle"); if (!h || !e.altKey || ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].indexOf(e.key) < 0) return;
      e.preventDefault();
      var all = items(), it = h.closest(o.itemSel || ".item, .logo-card"), i = all.indexOf(it), j = i + (e.key === "ArrowUp" || e.key === "ArrowLeft" ? -1 : 1);
      if (j < 0 || j >= all.length) return;
      o.onMove(i, j);
      setTimeout(function () { var n = items()[j]; var hh = n && n.querySelector(o.handleSel || ".handle"); if (hh) hh.focus(); }, 400);
    });
    list.addEventListener("pointerdown", function (e) {
      var h = e.target.closest(o.handleSel || ".handle"); if (!h || !list.contains(h) || e.button !== 0) return;
      var it = h.closest(o.itemSel || ".item, .logo-card"); if (!it || it.parentNode !== list) return;
      e.preventDefault();
      var all = items(), from = all.indexOf(it), to = from, grid = o.grid;
      it.classList.add("is-dragging");
      var line = grid ? null : el('<li class="drop-line" aria-hidden="true"></li>');
      var move = function (ev) {
        var cur = items();
        if (grid) {
          var t = document.elementFromPoint(ev.clientX, ev.clientY), card = t && t.closest(o.itemSel || ".logo-card");
          cur.forEach(function (c) { c.classList.toggle("is-over", c === card && c !== it); });
          if (card && cur.indexOf(card) >= 0) to = cur.indexOf(card);
        } else {
          to = cur.length - 1;
          for (var i = 0; i < cur.length; i++) { var r = cur[i].getBoundingClientRect(); if (ev.clientY < r.top + r.height / 2) { to = i; break; } }
          var ref = cur[to]; if (to === cur.length - 1 && ev.clientY > cur[to].getBoundingClientRect().top + cur[to].getBoundingClientRect().height / 2) ref = null;
          if (ref) list.insertBefore(line, ref); else list.appendChild(line);
          if (!ref) to = cur.length; if (to > from) to--;
        }
      };
      var up = function () {
        document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", up);
        it.classList.remove("is-dragging"); if (line) line.remove(); items().forEach(function (c) { c.classList.remove("is-over"); });
        if (to !== from && to >= 0) o.onMove(from, to);
      };
      document.addEventListener("pointermove", move); document.addEventListener("pointerup", up);
    });
  }

  A.ui = { I: I, icon: icon, siteIcon: siteIcon, el: el, $: $, $$: $$, toast: toast, modal: modal, confirm: confirmBox, popover: popover, drawer: drawer, F: F,
    bindForm: bindForm, defineRepeater: defineRepeater, sortable: sortable, getP: getP, setP: setP, iconPicker: iconPicker, Preview: Preview };
})(window);
