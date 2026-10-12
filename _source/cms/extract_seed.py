#!/usr/bin/env python3
"""Ambil isi website saat ini (hasil build) menjadi data CMS awal: content.json.
Dijalankan sekali saat CMS dipasang. Setelah itu sumber konten = SuperAdmin."""
import json, re, sys, pathlib, datetime
from bs4 import BeautifulSoup, NavigableString

ROOT = pathlib.Path(__file__).resolve().parent.parent           # pkp-src
sys.path.insert(0, str(ROOT))
import build as B

SITE = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else B.OUT
OUT = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else SITE / "admin" / "seed-content.json"

def soup(name):
    return BeautifulSoup((SITE / f"{name}.html").read_text(), "lxml")

def txt(el):
    return el.get_text("", strip=False).strip() if el else ""

def inner(el):
    return el.decode_contents().strip() if el else ""

def icon_of(el):
    u = el.select_one("use") if el else None
    return u["href"].replace("#i-", "") if u else ""

def img(el):
    if not el:
        return None
    return {"src": el["src"], "alt": el.get("alt", ""), "w": int(el.get("width", 0) or 0), "h": int(el.get("height", 0) or 0)}

MONTHS = {"Jan": 1, "Feb": 2, "Mar": 3, "Apr": 4, "Mei": 5, "Jun": 6, "Jul": 7, "Agu": 8, "Sep": 9, "Okt": 10, "Nov": 11, "Des": 12}
def iso_date(s):
    d, m, y = s.split()
    return f"{y}-{MONTHS[m[:3]]:02d}-{int(d):02d}"

uid = lambda prefix, i: f"{prefix}{i + 1:02d}"

# ------------------------------------------------------------------ halaman
index, produk, layanan, partner, tentang = soup("index"), soup("produk"), soup("layanan"), soup("partner"), soup("tentang")
karir, training, blog, detail, kontak = soup("karir"), soup("training"), soup("blog"), soup("blog-detail"), soup("kontak")

# ---------- Hero & statistik
h1 = index.select_one('[data-cms="hero-title"]')
hl = h1.select_one(".text-amber")
before = "".join(str(x) for x in h1.contents[:h1.contents.index(hl)]).strip()
after = "".join(str(x) for x in h1.contents[h1.contents.index(hl) + 1:]).strip()
def stats(el):
    out = []
    for it in el.select("div"):
        st = it.select_one("strong")
        out.append({"value": st.get("data-count", txt(st)), "suffix": st.get("data-suffix", ""),
                    "label": txt(it.select_one("span")), "animate": st.has_attr("data-count")})
    return out
hero = {
    "titleBefore": before, "highlight": txt(hl), "titleAfter": after,
    "lead": txt(index.select_one('[data-cms="hero-lead"]')),
    "ctas": [{"label": txt(a), "url": a["href"], "style": "primary" if "btn--primary" in a["class"] else "ghost"}
             for a in index.select('[data-cms="hero-actions"] a')],
    "stats": stats(index.select_one('[data-cms="hero-stats"]')),
    "trusted": [txt(li) for li in index.select('[data-cms="hero-trusted"] li')],
}

# ---------- Produk
def paragraphs(div):
    return [inner(p) for p in div.find_all("p", recursive=False)]

products = []
tab_meta = {}
for b in index.select('[data-cms="home-tabs"] .ptab'):
    pid = b["aria-controls"]
    panel = index.select_one(f"#{pid}")
    href = panel.select_one(".link-arrow")["href"].split("#")[1]
    tab_meta[href] = {"tabLabel": txt(b.select_one("strong")), "tabCategory": txt(b.select_one("small")),
                      "summary": txt(panel.select_one(".ptab-copy p"))}
nav_labels = {a["href"][1:]: txt(a) for a in produk.select('[data-cms="product-subnav"] a')}
ps_icons = {}
for a in index.select('[data-cms="home-ps-product"] a, [data-cms="home-ps-service"] a'):
    ps_icons[a["href"]] = icon_of(a.select_one(".ps-ic"))

def product_from_row(row, section):
    copy = row.select_one("div[data-reveal]")
    slug = row["id"]
    defs = [{"term": txt(p.select_one("b")), "desc": re.sub(r"^\s*—\s*", "", inner(p).split("</b>", 1)[1]).strip()}
            for p in copy.select(".def-list p")]
    cta = copy.select_one("a.btn")
    media = row.select_one(".showcase-media")
    shot = media.select_one("img.shot")
    mock = media.select_one(".device")
    p = {
        "id": slug, "slug": slug, "section": section,
        "name": txt(copy.select_one("h2")), "navLabel": nav_labels.get(slug, txt(copy.select_one("h2"))),
        "kicker": txt(copy.select_one(".showcase-kicker")),
        "icon": ps_icons.get(f"produk.html#{slug}", "layers"),
        "paragraphs": paragraphs(copy), "definitions": defs,
        "features": [txt(li) for li in copy.select(".pill-list li")],
        "image": img(shot), "mockupHtml": inner(mock) if mock and not shot else "",
        "cta": None, "visible": True, "locked": False,
    }
    if cta:
        label = "".join(x for x in cta.contents if isinstance(x, NavigableString)).strip()
        p["cta"] = {"label": label, "url": cta["href"], "newTab": cta.get("target") == "_blank"}
    p.update(tab_meta.get(slug, {"tabLabel": p["navLabel"], "tabCategory": p["kicker"], "summary": ""}))
    return p

for row in produk.select('[data-cms="products-main"] .showcase-row'):
    products.append(product_from_row(row, "main"))
mh = produk.select_one('[data-cms="mobile-head"]')
products.append({"id": "mobile", "slug": "mobile", "section": "mobile", "name": txt(mh.select_one("h2")), "navLabel": nav_labels["mobile"],
                 "kicker": txt(mh.select_one(".eyebrow")), "icon": ps_icons.get("produk.html#mobile", "smartphone"),
                 "paragraphs": [txt(mh.select_one(".section-lead"))], "visible": True, "locked": True})
for row in produk.select('[data-cms="products-comm"] .showcase-row'):
    products.append(product_from_row(row, "comm"))
ek = produk.select_one('[data-cms="ekyc-intro"]')
products.append({"id": "ekyc", "slug": "ekyc", "section": "ekyc", "name": txt(ek.select_one("h2")), "navLabel": nav_labels["ekyc"],
                 "kicker": txt(ek.select_one(".eyebrow")), "icon": ps_icons.get("produk.html#ekyc", "scan"),
                 "paragraphs": [txt(ek.select_one(".section-lead"))],
                 "ekycFeatures": [{"label": txt(li), "icon": icon_of(li)} for li in ek.select(".kyc-list li")],
                 "visible": True, "locked": True})
for p in products:
    p.setdefault("tabLabel", p["navLabel"]); p.setdefault("tabCategory", p["kicker"]); p.setdefault("summary", "")
    for k, v in (("definitions", []), ("features", []), ("image", None), ("mockupHtml", ""), ("cta", None)):
        p.setdefault(k, v)

apps = []
for i, li in enumerate(produk.select('[data-cms="apps"] li')):
    apps.append({"id": uid("app", i), "name": txt(li.select_one("h3")), "desc": txt(li.select_one("p")),
                 "image": img(li.select_one("img")), "visible": True})

# ---------- Layanan
services = []
for card in layanan.select('[data-cms="services-cards"] .svc-card'):
    services.append({"id": card["id"], "slug": card["id"], "name": txt(card.select_one("h3")), "icon": icon_of(card.select_one(".icon-badge")),
                     "desc": txt(card.select_one("p")), "features": [txt(li) for li in card.select(".pill-list li")], "visible": True})
home_services = []
for card in index.select('[data-cms="home-services"] .svc-card'):
    name = txt(card.select_one("h3"))
    match = next(s for s in services if s["name"] == name)
    home_services.append(match["id"])
    match["homeFeatures"] = [txt(li) for li in card.select(".pill-list li")]
for s in services:
    s.setdefault("homeFeatures", s["features"])

ih = layanan.select_one('[data-cms="infra-head"]')
TONE = {"icon-badge icon-badge--sky": "sky"}
groups = []
for gi, g in enumerate(layanan.select('[data-cms="infra-groups"] details')):
    badge = g.select_one("summary .icon-badge")
    tone = "sky" if "icon-badge--sky" in badge["class"] else ("amber" if "245,166,35" in badge.get("style", "") else "mint")
    items = []
    for ii, it in enumerate(g.select(".infra-item")):
        p = it.select_one("p"); a = p.select_one("a")
        item = {"id": uid(f"inf{gi + 1}-", ii), "title": txt(it.select_one("h4")), "icon": icon_of(it.select_one(".ps-ic")),
                "desc": "".join(str(x) for x in p.contents if x is not a).strip(), "link": None}
        if a:
            item["link"] = {"label": txt(a), "url": a["href"]}
        items.append(item)
    groups.append({"id": uid("grp", gi), "title": txt(g.select_one("summary h3")), "desc": txt(g.select_one("summary p")),
                   "icon": icon_of(badge), "tone": tone, "items": items})
industries = []
for i, c in enumerate(layanan.select('[data-cms="industries"] .industry-card')):
    badge = c.select_one(".icon-badge")
    tone = "sky" if "icon-badge--sky" in badge["class"] else ("dark-mint" if "mint" in badge.get("style", "") else "dark")
    industries.append({"id": uid("ind", i), "title": txt(c.select_one("h3")), "desc": txt(c.select_one("p")), "icon": icon_of(badge), "tone": tone})

# ---------- Partner & klien
def logos(names, manifest, colors):
    out = []
    for i, n in enumerate(names):
        nm, col = (n if isinstance(n, tuple) else (n, colors[i % len(colors)]))
        L = manifest.get(nm)
        out.append({"id": (L["slug"] if L else re.sub(r"[^a-z0-9]+", "-", nm.lower()).strip("-")), "name": nm, "color": col,
                    "logo": {"src": f"assets/img/{L['group']}/{L['slug']}.webp", "w": L["w"], "h": L["h"]} if L else None,
                    "visible": True})
    return out
partners = logos(B.PARTNERS, B.PARTNER_LOGOS, None)
clients = logos(B.CLIENTS, B.CLIENT_LOGOS, B.CLIENT_COLORS)

# ---------- Blog
posts = []
for i, (cat, title, ex, date, label, uidp) in enumerate(B.POSTS):
    posts.append({"id": uid("post", i), "slug": re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:70], "title": title,
                  "category": cat, "excerpt": ex, "date": iso_date(date), "author": "Admin PKP", "linkLabel": label,
                  "cover": {"src": B.UNSPLASH.format(uidp, 720), "alt": title}, "body": "", "topics": [], "readTime": "",
                  "status": "published", "sample": True})
# artikel lengkap dari blog-detail.html
art = detail.select_one('[data-cms="post-article"]')
dt = art.select_one("time")["datetime"]
dimg = art.select_one(".article-cover img")
posts.insert(0, {"id": "post00", "slug": "core-finance-modular", "title": txt(detail.select_one('[data-cms="post-title"]')),
                 "category": "product", "excerpt": "Arsitektur modular membantu lembaga keuangan beradaptasi dengan regulasi yang cepat berubah tanpa membangun ulang seluruh sistem.",
                 "date": dt, "author": "Admin PKP", "linkLabel": "Baca selengkapnya",
                 "cover": {"src": dimg["src"].replace("w=1400", "w=720"), "alt": dimg.get("alt", "")},
                 "body": inner(art.select_one(".article-body")), "topics": [txt(a) for a in detail.select('[data-cms="post-topics"] a')],
                 "readTime": re.sub(r"\s+", " ", txt(art.select(".article-meta span")[-1])).strip(),
                 "status": "draft", "sample": True})
categories = [{"key": b["data-filter"], "label": txt(b)} for b in blog.select('[data-cms="blog-filters"] [data-filter]') if b["data-filter"] != "all"]

# ---------- Karir
departments = [{"key": o["value"], "label": txt(o)} for o in karir.select('[data-cms="job-filter"] option') if o["value"] != "all"]
jobs = []
for i, j in enumerate(karir.select('[data-cms="jobs"] .job')):
    metas = j.select(".meta")
    jobs.append({"id": uid("job", i), "title": txt(j.select_one("h3")), "dept": j["data-dept"], "location": txt(metas[0]),
                 "type": txt(metas[1]), "url": j.select_one("a")["href"], "visible": True})

# ---------- Training
courses = []
for i, c in enumerate(training.select('[data-cms="courses"] .course-card')):
    meta = c.select(".course-meta span")
    a = c.select_one(".card-link")
    courses.append({"id": uid("crs", i), "title": "".join(x for x in a.contents if isinstance(x, NavigableString)).strip(),
                    "category": txt(c.select_one(".tag")), "desc": txt(c.select_one(".course-body p")),
                    "image": img(c.select_one("img")), "duration": txt(meta[0]), "capacity": txt(meta[1]),
                    "url": a["href"], "visible": True})
schedule = []
TAGTONE = lambda el: next((k.replace("tag--", "") for k in el["class"] if k.startswith("tag--")), "mint")
for i, tr in enumerate(training.select('[data-cms="schedule"] tr')):
    td = tr.select("td")
    schedule.append({"id": uid("sch", i), "program": txt(td[0]), "date": txt(td[1]), "duration": txt(td[2]), "format": txt(td[3]),
                     "status": txt(td[4]), "tone": TAGTONE(td[4].select_one(".tag"))})

# ---------- Kontak
ci = kontak.select_one('[data-cms="contact-info"]')
foot = index.select_one('[data-cms="footer-contact"]')
ig = foot.select_one('a[href*="instagram"]')
mapsrc = kontak.select_one('[data-cms="contact-map"]')["src"]
contact = {
    "address": txt(ci.select_one("li span:not(.ci)")),
    "phone": txt(ci.select_one('a[href^="tel:"]')), "phoneHref": ci.select_one('a[href^="tel:"]')["href"].replace("tel:", ""),
    "email": txt(ci.select_one('a[href^="mailto:"]')),
    "website": B.SITE_URL,
    "instagram": {"handle": "".join(x for x in ig.contents if isinstance(x, NavigableString)).strip(), "url": ig["href"]},
    "hours": [{"days": txt(d.select_one("span")), "time": txt(d.select_one("b"))} for d in kontak.select('[data-cms="contact-hours"] > div')],
    "mapQuery": re.search(r"q=([^&]+)", mapsrc).group(1).replace("%20", " "),
    "mapTitle": kontak.select_one('[data-cms="contact-map"]')["title"],
    "formRecipient": (re.search(r'fallbackEmail:\s*"([^"]+)"', (SITE / "assets/js/main.js").read_text()) or [None, ""])[1],
}

# ---------- ISO & statistik
meta = {txt(d.select_one("dt")): txt(d.select_one("dd")) for d in tentang.select('[data-cms="iso-meta"] > div')}
iso = {"standard": meta.get("Standar", ""), "number": meta.get("Nomor sertifikat", ""), "body": meta.get("Lembaga sertifikasi", ""),
       "accreditation": meta.get("Akreditasi", "").replace("·", "·"), "expiry": "2026-08-30",
       "image": {"src": "assets/img/media/cert-iso-9001.webp", "w": 640, "h": 931, "alt": tentang.select_one('[data-cms="iso-doc"] img')["alt"]},
       "imageFull": "assets/img/media/cert-iso-9001-full.webp"}

# ---------- SEO
seo = {}
for f in ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "kontak"]:
    s = soup(f)
    seo[f] = {"title": s.title.get_text(), "description": s.select_one('meta[name="description"]')["content"]}

content = {
    "schema": 1,
    "updatedAt": datetime.datetime.now().isoformat(timespec="seconds"),
    "publishedAt": None,
    "hero": hero,
    "home": {
        "portfolio": {
            "product": [a["href"].split("#")[1] for a in index.select('[data-cms="home-ps-product"] a')],
            "service": [("product:" if a["href"].startswith("produk") else "service:") + a["href"].split("#")[1]
                        for a in index.select('[data-cms="home-ps-service"] a')],
        },
        "featured": list(tab_meta.keys()),
        "services": home_services,
        "postsCount": 3,
    },
    "products": products, "apps": apps,
    "services": services,
    "infrastructure": {"eyebrow": txt(ih.select_one(".eyebrow")), "title": txt(ih.select_one("h2")), "lead": txt(ih.select_one(".section-lead")), "groups": groups},
    "industries": industries,
    "partners": partners, "clients": clients,
    "stats": {"partner": stats(partner.select_one('[data-cms="partner-stats"]')), "about": stats(tentang.select_one('[data-cms="about-stats"]'))},
    "posts": posts, "categories": categories,
    "jobs": jobs, "departments": departments,
    "courses": courses, "schedule": schedule,
    "contact": contact, "iso": iso, "seo": seo,
    "settings": {"gaId": B.GA_MEASUREMENT_ID, "gscCode": B.GSC_VERIFICATION, "siteUrl": B.SITE_URL},
}
# portofolio produk disimpan sebagai referensi bertipe agar seragam
content["home"]["portfolio"]["product"] = ["product:" + s for s in content["home"]["portfolio"]["product"]]

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(content, ensure_ascii=False, indent=1))
print("seed ->", OUT, f"{OUT.stat().st_size / 1024:.0f} KB",
      {k: len(v) for k, v in content.items() if isinstance(v, list)})
