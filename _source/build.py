#!/usr/bin/env python3
"""Static site builder: merakit header/footer/ikon ke setiap halaman.
Sintaks di fragment halaman:
  {{i:nama}}        -> ikon SVG dari sprite
  {{inc:nama}}      -> isi partials/nama.html
  {{gen:nama[:arg]}}-> blok yang dihasilkan fungsi Python (logo, blog, dsb.)
Baris pertama fragment: <!-- title=...|desc=...|nav=... -->
"""
import re, pathlib, html

ROOT = pathlib.Path(__file__).parent
OUT = ROOT.parent
# Alamat domain website (tanpa garis miring di akhir). Ganti jika domain berbeda,
# lalu jalankan ulang build.py agar canonical, sitemap.xml, dan robots.txt ikut berubah.
SITE_URL = "https://www.pkp.co.id"
SITE_NAME = "PT. Prawathiya Karsa Pradiptha"
# Google Analytics 4 (Measurement ID). Kosongkan ("") untuk mematikan.
GA_MEASUREMENT_ID = "G-JJ6KE69XJN"
# Google Search Console — metode "Tag HTML": isi kode dari content="..." (bukan seluruh tag), lalu build ulang.
# Boleh dikosongkan bila verifikasi memakai metode Google Analytics atau DNS.
GSC_VERIFICATION = ""

# ---------------------------------------------------------------- icons
ICONS = {
 "arrow-right": '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
 "arrow-up-right": '<path d="M7 7h10v10"/><path d="M7 17 17 7"/>',
 "chevron-down": '<path d="m6 9 6 6 6-6"/>',
 "check": '<path d="M20 6 9 17l-5-5"/>',
 "menu": '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
 "x": '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
 "layers": '<path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"/><path d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"/><path d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"/>',
 "database": '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
 "grid": '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>',
 "heart-pulse": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/><path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27"/>',
 "users": '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
 "file-text": '<path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/>',
 "smartphone": '<rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>',
 "briefcase": '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
 "shield": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
 "shield-check": '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/>',
 "plug": '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z"/>',
 "code": '<path d="m16 18 6-6-6-6"/><path d="m8 6-6 6 6 6"/>',
 "phone": '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
 "message-circle": '<path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>',
 "scan": '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01"/><path d="M15 9h.01"/>',
 "mail": '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
 "instagram": '<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><path d="M17.5 6.5h.01"/>',
 "maximize": '<path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>',
 "globe": '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
 "map-pin": '<path d="M20 10c0 4.99-5.54 10.19-7.4 11.8a1 1 0 0 1-1.2 0C9.54 20.19 4 14.99 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>',
 "server": '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><path d="M6 6h.01"/><path d="M6 18h.01"/>',
 "cloud": '<path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/>',
 "network": '<rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/>',
 "cpu": '<rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/>',
 "monitor": '<rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/>',
 "laptop": '<path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16"/>',
 "key": '<path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/>',
 "refresh": '<path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/>',
 "activity": '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
 "wrench": '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',
 "sliders": '<path d="M21 4h-7"/><path d="M10 4H3"/><path d="M21 12h-9"/><path d="M8 12H3"/><path d="M21 20h-5"/><path d="M12 20H3"/><path d="M14 2v4"/><path d="M8 10v4"/><path d="M16 18v4"/>',
 "target": '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
 "graduation": '<path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/>',
 "trending-up": '<path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/>',
 "award": '<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',
 "calendar": '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
 "clock": '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
 "search": '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
 "building": '<rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
 "lock": '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
 "zap": '<path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/>',
 "link": '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
 "image": '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
 "home": '<path d="M4 20V10.5L12 4l8 6.5V20"/><path d="M10 20v-5h4v5"/>',
 "send": '<path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z"/><path d="m21.854 2.147-10.94 10.939"/>',
 "loader": '<path d="M21 12a9 9 0 1 1-6.219-8.56"/>',
 "external": '<path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>',
 "headset": '<path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm0 0a9 9 0 1 1 18 0m0 0v5a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3Z"/><path d="M21 16v2a4 4 0 0 1-4 4h-5"/>',
 "bar-chart": '<path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>',
 "bot": '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
 "heart": '<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',
 "store": '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
 "credit-card": '<rect width="20" height="14" x="2" y="5" rx="2"/><path d="M2 10h20"/>',
 "pause": '<rect x="14" y="4" width="4" height="16" rx="1"/><rect x="6" y="4" width="4" height="16" rx="1"/>',
 "play": '<path d="M6 3l14 9-14 9z"/>',
 "fingerprint": '<path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4"/><path d="M14 13.12c0 2.38 0 6.38-1 8.88"/><path d="M17.29 21.02c.12-.6.43-2.3.5-3.02"/><path d="M2 12a10 10 0 0 1 18-6"/><path d="M2 16h.01"/><path d="M21.8 16c.2-2 .131-5.354 0-6"/><path d="M5 19.5C5.5 18 6 15 6 12a6 6 0 0 1 .34-2"/><path d="M8.65 22c.21-.66.45-1.32.57-2"/><path d="M9 6.8a6 6 0 0 1 9 5.2v2"/>',
 "id-card": '<rect width="20" height="16" x="2" y="4" rx="2"/><circle cx="8" cy="11" r="2"/><path d="M5 16a3 3 0 0 1 6 0"/><path d="M14 10h4"/><path d="M14 14h4"/>',
 "eye": '<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/><circle cx="12" cy="12" r="3"/>',
 "gauge": '<path d="m12 14 4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/>',
 "upload": '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
 "compass": '<circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z"/>',
 "handshake": '<path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-2"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/>',
}
SPRITE = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' + "".join(
    f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items()) + "</defs></svg>"

def icon(name, cls="icon"):
    assert name in ICONS, name
    return f'<svg class="{cls}" aria-hidden="true"><use href="#i-{name}"/></svg>'

# ---------------------------------------------------------------- data
PRODUCTS = [
 ("fincore", "Beyond Fincore +", "Loan & Financing", "layers", "Core system pembiayaan multiguna"),
 ("icolls", "iColls — Integrated Collection System", "Collection Management", "database", "Otomasi penugasan & collectibility"),
 ("semeru", "Semeru ERP", "Enterprise Resource Planning", "grid", "ERP open source berbasis iDempiere"),
 ("klinikcare", "KlinikCare", "Healthcare", "heart-pulse", "Manajemen klinik terintegrasi SATUSEHAT"),
 ("harmony", "Harmony HR", "Human Resource", "users", "HRIS end-to-end hingga payroll"),
 ("emeterai", "E-Meterai", "Digital Document", "file-text", "Meterai elektronik resmi"),
]
EXTRA_PRODUCTS = [
 ("mobile", "Mobile Application", "smartphone", "8 aplikasi mobile siap pakai"),
 ("messaging", "Beyond Messaging Service", "message-circle", "SMS Blast & WhatsApp BeeZap"),
 ("callcenter", "Call Center & Telecommunication", "headset", "Inbound, outbound & SIP trunk"),
 ("ekyc", "E-KYC", "scan", "Verifikasi identitas digital"),
]
SERVICES = [
 ("it-professional", "IT Professional Services", "briefcase", "Penyediaan talenta IT profesional"),
 ("it-managed", "IT Managed Services", "shield", "Network, server & cloud terkelola"),
 ("system-integration", "System Integration", "plug", "PPOB & payment gateway"),
 ("app-dev", "Application Development", "code", "Website & mobile apps"),
 ("infrastructure", "Infrastructure & Services", "server", "Hardware, cabling & transformasi"),
]

PARTNERS = [("Telkom Indonesia", "#E42313"), ("Telkomsigma", "#C8102E"), ("Finnet", "#D71920"), ("XL Axiata", "#0A4DA2"),
 ("Hewlett Packard Enterprise", "#01A982"), ("Veeam", "#00B336"), ("Indosat Ooredoo", "#F7B500"), ("ESET", "#0096A1"),
 ("Smartfren", "#E4007C"), ("1Engage", "#E5234A"), ("Tencent Cloud", "#0052D9"), ("Biznet", "#1B4F9C"),
 ("Faspay", "#F58220"), ("Tri", "#8E1F7C"), ("Sarana Pactindo", "#0F6E5A"), ("Doitpay", "#2A5BD7"), ("DPS Cloud", "#1C8AD1")]
CLIENTS = ["FIFGROUP", "SIMGROUP", "Sehati", "Dika Sinar Sejahtera", "Morena Rent", "Indomobil Finance", "AstraPay",
 "Nusa Prima Motor", "Nusa Perkasa Makmur", "KSP MAS", "Sinar Mentari Makmur", "Daya Karunia Makmur", "Daya Karunia Mandiri",
 "APJAPI", "SKA", "Bintang Indah Gemerlap", "Pengen Umroh", "MNC Finance", "KAS", "CMA", "MNC Guna Usaha Indonesia",
 "Indonesia Marketing Association", "Mega Capital Sekuritas", "MCF", "Kiss", "Koperasi Sehati Syariah",
 "Woori Finance Indonesia", "BIG", "Prime Travelindo", "Tobadihon Mandiri",
 "Kusuma 8", "Petra Sukses Utama", "Bintang Orbit Semesta", "Ganesha Bina Utama"]
CLIENT_COLORS = ["#0A4DA2", "#C8102E", "#0F6E5A", "#E28E0A", "#1A6FAA", "#8E1F7C", "#01A982"]

UNSPLASH = "https://images.unsplash.com/photo-{}?auto=format&fit=crop&w={}&q=70"
POSTS = [
 # (cat, title, excerpt, date, link label, unsplash id)
 ("product", "Mengapa Perusahaan Multifinance Perlu Sistem Loan", "Alasan sistem loan management terintegrasi kini menjadi kebutuhan, bukan lagi pilihan.", "2 Jul 2026", "Baca selengkapnya", "1554224155-6726b3ff858f"),
 ("insight", "Inovasi Terbaru dalam Dunia Fintech", "Mengenal berbagai inovasi yang mengubah wajah layanan keuangan digital.", "15 Agu 2026", "Jelajahi topik lengkap", "1563986768609-322da13575f3"),
 ("insight", "Mengoptimalkan Analisis Data untuk Bisnis", "Strategi terbaik memanfaatkan big data demi keuntungan kompetitif.", "30 Sep 2026", "Pelajari selengkapnya", "1551288049-bebda4e38f71"),
 ("insight", "Strategi Pemasaran Digital yang Efektif", "Tips dan trik memaksimalkan kampanye digital di era milenial.", "12 Okt 2026", "Baca artikel lengkap", "1460925895917-afdab827c52f"),
 ("insight", "Membangun Budaya Kerja Positif", "Cara menciptakan lingkungan kerja yang mendukung produktivitas dan kebahagiaan.", "5 Nov 2026", "Simak selengkapnya", "1522071820081-009f0129c71c"),
 ("insight", "Teknik Manajemen Waktu untuk Profesional", "Metode efektif agar waktu kerja lebih efisien dan terorganisir.", "20 Nov 2026", "Pelajari caranya", "1484480974693-6ca0a78fb36b"),
 ("product", "Tren Terbaru dalam Desain Produk Digital", "Inovasi yang menginspirasi pengalaman pengguna lebih baik.", "1 Des 2026", "Baca lebih lanjut", "1581291518857-4e27b48ff24e"),
 ("insight", "Meningkatkan Kepuasan Pelanggan Melalui Layanan", "Pendekatan personal untuk membangun loyalitas pelanggan.", "10 Des 2026", "Selengkapnya di sini", "1556745757-8d76bdb6984b"),
 ("insight", "Melindungi Data Perusahaan dari Ancaman Siber", "Langkah penting menjaga keamanan informasi di era digital.", "25 Des 2026", "Baca artikel lengkap", "1550751827-4bd374c3f58b"),
 ("product", "Peran E-KYC dalam Mempercepat Onboarding Nasabah", "Verifikasi identitas digital memangkas waktu onboarding dari hari menjadi menit.", "28 Mei 2026", "Baca selengkapnya", "1556742049-0cfed4f6a45d"),
 ("insight", "5 Tren Transformasi Digital Enterprise di Indonesia", "Gambaran arah investasi teknologi perusahaan besar tahun ini.", "14 Mei 2026", "Baca selengkapnya", "1451187580459-43490279c0fa"),
 ("product", "Strategi Integrasi ERP untuk Perusahaan Multi-Industri", "Menyatukan data lintas unit bisnis tanpa mengorbankan fleksibilitas.", "30 Apr 2026", "Baca selengkapnya", "1454165804606-c3d57bc86b40"),
]

# ---------------------------------------------------------------- generators
import json
def _load_logos(group):
    f = ROOT / "assets" / group / "manifest.json"
    return {v["name"]: dict(v, slug=k, group=group) for k, v in json.loads(f.read_text()).items()} if f.exists() else {}
PARTNER_LOGOS = _load_logos("partners")
CLIENT_LOGOS = _load_logos("clients")

def partner_mark(name, color, logos=None):
    """Logo (gambar) bila tersedia, jika belum ada tampilkan nama sebagai teks."""
    L = (PARTNER_LOGOS if logos is None else logos).get(name)
    if L:
        return (f'<img class="partner-logo" src="assets/img/{L["group"]}/{L["slug"]}.webp" alt="{html.escape(name)}" '
                f'width="{L["w"]}" height="{L["h"]}" loading="lazy" decoding="async">')
    return f'<span class="logo-word" style="--c:{color}">{html.escape(name)}</span>'

def g_partners(arg=None):
    return "\n".join(f'<li class="logo-tile">{partner_mark(n, c)}</li>' for n, c in PARTNERS)

def g_clients(arg=None):
    return "\n".join(f'<li class="logo-tile">{partner_mark(n, CLIENT_COLORS[i % len(CLIENT_COLORS)], CLIENT_LOGOS)}</li>'
                     for i, n in enumerate(CLIENTS))

def _marquee(items, logos=False):
    mark = (lambda n, c: partner_mark(n, c)) if logos else (lambda n, c: f'<span class="logo-word" style="--c:{c}">{html.escape(n)}</span>')
    tiles = "".join(f'<div class="logo-tile">{mark(n, c)}</div>' for n, c in items)
    dup = "".join(f'<div class="logo-tile" aria-hidden="true">{mark(n, c)}</div>' for n, c in items)
    return tiles + dup

def g_marquee_partners(arg=None):
    return _marquee(PARTNERS, logos=True)

def g_marquee_clients(arg=None):
    return _marquee([(n, CLIENT_COLORS[i % len(CLIENT_COLORS)]) for i, n in enumerate(CLIENTS[:18])])

def post_card(p, idx):
    cat, title, ex, date, label, uid = p
    catlabel = "Product" if cat == "product" else "Insight"
    return f'''<article class="post-card" data-cat="{cat}">
  <a class="post-thumb ph" href="blog-detail.html" tabindex="-1" aria-hidden="true">
    <span class="tag tag--amber">{catlabel}</span>
    {icon("home", "icon ph-ic")}
    <img src="{UNSPLASH.format(uid, 720)}" alt="{html.escape(title)}" loading="lazy" width="720" height="700">
  </a>
  <div class="post-meta"><span>Admin PKP</span><span><time>{date}</time></span></div>
  <h3><a href="blog-detail.html">{html.escape(title)}</a></h3>
  <p>{html.escape(ex)}</p>
  <a class="link-arrow" href="blog-detail.html">{label} {icon("arrow-right")}<span class="sr-only">: {html.escape(title)}</span></a>
</article>'''

def g_posts(arg):
    n = int(arg)
    return "\n".join(post_card(p, i) for i, p in enumerate(POSTS[:n]))

def g_posts_home(arg=None):
    return "\n".join(post_card(p, i) for i, p in enumerate(POSTS[:3]))

GEN = {"partners": g_partners, "clients": g_clients, "marquee-partners": g_marquee_partners,
       "marquee-clients": g_marquee_clients, "posts": g_posts, "posts-home": g_posts_home}

# ---------------------------------------------------------------- layout
NAV = [("tentang", "Tentang", "tentang.html"), ("produk", "Produk", "produk.html"), ("layanan", "Layanan", "layanan.html"),
       ("partner", "Partner", "partner.html"), ("karir", "Karir", "karir.html"), ("training", "Training", "training.html"),
       ("blog", "Blog", "blog.html")]

def dd_product():
    items = "".join(f'<a href="produk.html#{k}"><span class="dd-icon">{icon(ic)}</span><span><strong>{n.split(" — ")[0]}</strong><small>{d}</small></span></a>'
                    for k, n, _, ic, d in PRODUCTS)
    items += "".join(f'<a href="produk.html#{k}"><span class="dd-icon">{icon(ic)}</span><span><strong>{n}</strong><small>{d}</small></span></a>'
                     for k, n, ic, d in EXTRA_PRODUCTS)
    return f'<div class="dropdown dropdown--wide">{items}<div class="dropdown-foot"><a href="produk.html">Lihat semua produk {icon("arrow-right")}</a></div></div>'

def dd_service():
    items = "".join(f'<a href="layanan.html#{k}"><span class="dd-icon">{icon(ic)}</span><span><strong>{n}</strong><small>{d}</small></span></a>'
                    for k, n, ic, d in SERVICES)
    return f'<div class="dropdown">{items}</div>'

def header(active):
    # Navbar tanpa dropdown: semua menu berupa tautan biasa
    cur = lambda key: ' aria-current="page"' if key == active else ""
    links = "".join(f'<li class="nav-item"><a class="nav-link" href="{href}"{cur(key)}>{label}</a></li>' for key, label, href in NAV)
    drawer_links = "".join(f'<a href="{href}"{cur(key)}>{label}</a>' for key, label, href in NAV)
    return f'''<a class="skip-link" href="#main">Langsung ke konten</a>
<header class="site-header">
  <div class="container nav">
    <a class="brand" href="index.html" aria-label="PKP — Beranda"><span class="brand-logo" role="img" aria-label="PKP — Prawathiya Karsa Pradiptha"></span></a>
    <nav aria-label="Navigasi utama"><ul class="nav-menu">{links}</ul></nav>
    <a class="btn btn--ghost-light nav-cta" href="kontak.html"{' aria-current="page"' if active == "kontak" else ""}>Hubungi Kami</a>
    <button class="burger" type="button" aria-label="Buka menu" aria-expanded="false" aria-controls="drawer">{icon("menu")}</button>
  </div>
</header>
<div class="drawer" id="drawer" aria-hidden="true">
  <div class="drawer-backdrop" data-close-drawer></div>
  <div class="drawer-panel" role="dialog" aria-modal="true" aria-label="Menu">
    <div class="drawer-top">
      <a class="brand" href="index.html"><span class="brand-logo" role="img" aria-label="PKP — Prawathiya Karsa Pradiptha"></span></a>
      <button class="drawer-close" type="button" aria-label="Tutup menu" data-close-drawer>{icon("x")}</button>
    </div>
    <nav class="drawer-nav" aria-label="Navigasi mobile"><a href="index.html"{' aria-current="page"' if active == "home" else ""}>Beranda</a>{drawer_links}</nav>
    <div class="drawer-cta">
      <a class="btn btn--primary btn--block" href="kontak.html">Hubungi Kami {icon("arrow-right")}</a>
      <div class="drawer-contact" data-cms="drawer-contact"><a href="tel:+622184311636">(021) 84311636</a><a href="mailto:marketing@pkp.co.id">marketing@pkp.co.id</a></div>
    </div>
  </div>
</div>'''

def cta_band():
    return f'''<section class="cta-band" aria-labelledby="cta-title">
  <div class="container" data-reveal>
    <h2 id="cta-title">Siap Bertransformasi Bersama PKP?</h2>
    <p>Mari diskusikan kebutuhan IT bisnis Anda bersama tim profesional kami.</p>
    <a class="btn btn--dark" href="kontak.html">Mulai Konsultasi {icon("arrow-right")}</a>
  </div>
</section>'''

def footer():
    return f'''<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-brand">
        <span class="brand-logo" role="img" aria-label="PKP — Prawathiya Karsa Pradiptha"></span>
        <p>PT. Prawathiya Karsa Pradiptha — Enterprise Business Solution, IT Professional Service, IT Managed Service, Mobile Application, dan Call Center Service sejak 2012.</p>
      </div>
      <nav class="footer-col" aria-label="Navigasi footer">
        <h2>Navigasi</h2>
        <ul><li><a href="tentang.html">Tentang Kami</a></li><li><a href="produk.html">Produk</a></li><li><a href="layanan.html">Layanan</a></li><li><a href="partner.html">Partner</a></li><li><a href="karir.html">Karir</a></li><li><a href="training.html">Training</a></li></ul>
      </nav>
      <nav class="footer-col" aria-label="Produk unggulan">
        <h2>Produk</h2>
        <ul><li><a href="produk.html#fincore">Beyond Fincore +</a></li><li><a href="produk.html#icolls">iColls</a></li><li><a href="produk.html#semeru">Semeru ERP</a></li><li><a href="produk.html#klinikcare">KlinikCare</a></li><li><a href="produk.html#harmony">Harmony HR</a></li><li><a href="blog.html">Media &amp; Informasi</a></li></ul>
      </nav>
      <div class="footer-col">
        <h2>Kontak Kami</h2>
        <ul class="contact-list" data-cms="footer-contact">
          <li><span class="ci">{icon("phone")}</span><a href="tel:+622184311636">(021) 84311636</a></li>
          <li><span class="ci">{icon("instagram")}</span><a href="https://www.instagram.com/beyondtechid" target="_blank" rel="noopener">@beyondtechid<span class="sr-only"> di Instagram (membuka tab baru)</span></a></li>
          <li><span class="ci">{icon("mail")}</span><a href="mailto:marketing@pkp.co.id">marketing@pkp.co.id</a></li>
          <li><span class="ci">{icon("map-pin")}</span><span>Kawasan Niaga Citra Gran. Blok R7 No. 32, Jl. Alternatif Transyogi, Cibubur 17433</span></li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom"><span>© <span data-year>2026</span> PT. Prawathiya Karsa Pradiptha. All rights reserved.</span><span>ISO 9001:2015 Certified</span></div>
  </div>
</footer>'''

def page_url(stem):
    return f"{SITE_URL}/" if stem == "index" else f"{SITE_URL}/{stem}.html"

ORG_ID = f"{SITE_URL}/#organization"

def _ld(obj):
    import json
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "</script>"

def org_ld():
    return {
        "@context": "https://schema.org", "@type": "Organization", "@id": ORG_ID,
        "name": "PT. Prawathiya Karsa Pradiptha", "alternateName": "PKP", "url": f"{SITE_URL}/",
        "logo": f"{SITE_URL}/assets/img/apple-touch-icon.png", "image": f"{SITE_URL}/assets/img/og-image.jpg",
        "description": "Enterprise Business Solution, IT Professional Service, IT Managed Service, Mobile Application, dan Call Center Service sejak 2012.",
        "sameAs": ["https://www.instagram.com/beyondtechid"],
        "foundingDate": "2012", "email": "marketing@pkp.co.id", "telephone": "+62-21-84311636",
        "address": {"@type": "PostalAddress", "streetAddress": "Kawasan Niaga Citra Gran Blok R7 No. 32, Jl. Alternatif Transyogi",
                    "addressLocality": "Cibubur", "postalCode": "17433", "addressCountry": "ID"},
        "contactPoint": {"@type": "ContactPoint", "telephone": "+62-21-84311636", "email": "marketing@pkp.co.id",
                         "contactType": "sales", "areaServed": "ID", "availableLanguage": ["id", "en"]},
        "hasCredential": {"@type": "EducationalOccupationalCredential", "name": "ISO 9001:2015 Quality Management System"},
        "knowsAbout": ["Core Finance System", "Loan Management System", "Collection System", "ERP", "HRIS",
                       "Mobile Application", "Call Center", "E-KYC", "E-Meterai", "IT Managed Service", "System Integration"],
    }

def breadcrumb_ld(body, stem):
    """BreadcrumbList dari breadcrumb yang tampil di halaman (agar selalu sama dengan yang dilihat pengunjung)."""
    m = re.search(r'<ol class="breadcrumb"[^>]*>(.*?)</ol>', body, re.S)
    if not m:
        return None
    items = []
    for i, li in enumerate(re.findall(r"<li[^>]*>(.*?)</li>", m.group(1), re.S), 1):
        a = re.search(r'href="([\w-]+)\.html"', li)
        name = html.unescape(re.sub(r"<[^>]+>", "", li)).strip()
        url = page_url(a.group(1)) if a else page_url(stem)
        items.append({"@type": "ListItem", "position": i, "name": name, "item": url})
    return {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": items}

def article_ld(body, meta, stem):
    h1 = re.search(r"<h1[^>]*>(.*?)</h1>", body, re.S)
    t = re.search(r'<time datetime="([^"]+)"', body)
    img = re.search(r'<img[^>]+src="(https?://[^"]+)"', body)
    obj = {"@context": "https://schema.org", "@type": "BlogPosting",
           "headline": html.unescape(re.sub(r"<[^>]+>", "", h1.group(1))).strip() if h1 else meta.get("title"),
           "description": meta.get("desc", ""), "inLanguage": "id-ID",
           "mainEntityOfPage": page_url(stem),
           "author": {"@type": "Organization", "name": "PT. Prawathiya Karsa Pradiptha", "@id": ORG_ID},
           "publisher": {"@id": ORG_ID}}
    if t:
        obj["datePublished"] = t.group(1)
    if img:
        obj["image"] = html.unescape(img.group(1))
    return obj

def structured_data(body, meta, stem):
    out = []
    if stem == "index":
        out.append(org_ld())
        out.append({"@context": "https://schema.org", "@type": "WebSite", "@id": f"{SITE_URL}/#website", "url": f"{SITE_URL}/",
                    "name": "PT. Prawathiya Karsa Pradiptha", "alternateName": "PKP", "inLanguage": "id-ID", "publisher": {"@id": ORG_ID}})
    else:
        bc = breadcrumb_ld(body, stem)
        if bc:
            out.append(bc)
    if meta.get("type") == "article":
        out.append(article_ld(body, meta, stem))
    if stem == "kontak":
        out.append({"@context": "https://schema.org", "@type": "ContactPage", "url": page_url(stem),
                    "name": meta.get("seo", meta.get("title")), "about": {"@id": ORG_ID}})
    return "\n".join(_ld(o) for o in out)


# ---------------------------------------------------------------- layar transisi antar halaman
_LOGOGRAM = (ROOT / "assets" / "logogram.svg").read_text().replace('xmlns="http://www.w3.org/2000/svg" ', '').replace('<svg ', '<svg class="rl-logo" ', 1)
LOADER = f"""<div class="route-loader" id="route-loader" data-mpa aria-hidden="true">
  <div class="rl-grid"></div>
  <div class="rl-core">
    <svg class="rl-orbit" viewBox="0 0 200 200">
      <circle class="rl-track" cx="100" cy="100" r="92"/>
      <circle class="rl-arc" cx="100" cy="100" r="92"/>
      <circle class="rl-arc rl-arc--in" cx="100" cy="100" r="80"/>
      <g class="rl-nodes"><circle cx="100" cy="8" r="3.2"/><circle cx="192" cy="100" r="2.4"/><circle cx="35" cy="165" r="2.4"/></g>
    </svg>
    {_LOGOGRAM.strip()}
  </div>
  <div class="rl-caption"><span class="rl-prompt">&gt;_</span> memuat <span class="rl-path">/</span><span class="rl-caret"></span></div>
  <div class="rl-bar"><i></i></div>
</div>
<script>/* lanjutkan layar transisi dari halaman sebelumnya (dipasang oleh main.js saat klik menu) */
try{{var s=JSON.parse(sessionStorage.getItem("pkp-rl")||"null");sessionStorage.removeItem("pkp-rl");if(s&&Date.now()-s.t<5000&&!matchMedia("(prefers-reduced-motion: reduce)").matches){{var l=document.getElementById("route-loader");l.classList.add("is-active","is-resume");l.querySelector(".rl-path").textContent=s.p}}}}catch(e){{}}</script>"""

ASSET = {"css": "assets/css/style.css", "js": "assets/js/main.js"}

def minify_assets():
    """Buat style.min.css & main.min.js dari file yang mudah dibaca (style.css & main.js).
    Hanya spasi & komentar yang dibuang, jadi tampilan dan animasi tidak berubah.
    Butuh: pip install rcssmin rjsmin  (tanpa itu, halaman memakai file asli)."""
    import hashlib
    try:
        import rcssmin, rjsmin
    except ImportError:
        print("! rcssmin/rjsmin belum terpasang — halaman memakai style.css & main.js (tidak di-minify)")
        return
    for key, src, fn in (("css", "assets/css/style.css", rcssmin.cssmin), ("js", "assets/js/main.js", rjsmin.jsmin)):
        code = (OUT / src).read_text()
        mini = fn(code)
        if key == "css":
            mini = "/* PKP Company Profile — versi minify dari style.css (edit style.css lalu jalankan build.py) */\n" + mini
        else:
            mini = "/* PKP Company Profile — versi minify dari main.js (edit main.js lalu jalankan build.py) */\n" + mini
        dst = src.replace(".css", ".min.css").replace(".js", ".min.js")
        (OUT / dst).write_text(mini)
        ver = hashlib.md5(mini.encode()).hexdigest()[:8]
        ASSET[key] = f"{dst}?v={ver}"
        print(f"minify {src}: {len(code)/1024:.1f} KB -> {len(mini)/1024:.1f} KB")

def ga_tag():
    if not GA_MEASUREMENT_ID:
        return ""
    return f"""<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id={GA_MEASUREMENT_ID}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){{dataLayer.push(arguments);}}
  gtag('js', new Date());

  gtag('config', '{GA_MEASUREMENT_ID}');
</script>"""

FONT_CSS = "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,400..800&display=swap"

def page(meta, body, active, stem="index"):
    title = meta.get("title", "PKP")
    desc = meta.get("desc", "")
    full_title = meta.get("seo") or (f"{title} — PT. Prawathiya Karsa Pradiptha" if active != "home" else "PKP — Partner Terpercaya Transformasi Digital Bisnis Anda")
    cta = "" if meta.get("cta") == "no" else cta_band()
    noindex = meta.get("robots") == "noindex"
    url = page_url(stem)
    seo = ('<meta name="robots" content="noindex, follow">' if noindex else
           f'<meta name="robots" content="index, follow, max-image-preview:large">\n<link rel="canonical" href="{url}">\n<meta property="og:url" content="{url}">')
    ld = "" if noindex else structured_data(body, meta, stem)
    og_type = "article" if meta.get("type") == "article" else "website"
    gsc = f'<meta name="google-site-verification" content="{html.escape(GSC_VERIFICATION)}">\n' if (GSC_VERIFICATION and stem == "index") else ""
    return f'''<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
{ga_tag()}
<title>{html.escape(full_title)}</title>
<meta name="description" content="{html.escape(desc)}">
<meta name="theme-color" content="#0A2C46">
{gsc}{seo}
<meta property="og:title" content="{html.escape(full_title)}">
<meta property="og:description" content="{html.escape(desc)}">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="{SITE_NAME}">
<meta property="og:locale" content="id_ID">
<meta property="og:image" content="{SITE_URL}/assets/img/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="PKP — Partner Terpercaya Transformasi Digital Bisnis Anda">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="assets/img/favicon.png" type="image/png" sizes="64x64">
<link rel="icon" href="assets/img/favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="manifest" href="site.webmanifest">
{ld}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<!-- Font dimuat tanpa memblokir render (teks tampil dulu dengan font sistem, lalu berganti ke Inter) -->
<link rel="preload" as="style" href="{FONT_CSS}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="{FONT_CSS}"></noscript>
<link rel="stylesheet" href="{ASSET['css']}">
</head>
<body>
{LOADER}
{SPRITE}
{header(active)}
<main id="main">
{body}
{cta}
</main>
{footer()}
<script src="{ASSET['js']}" defer></script>
</body>
</html>
'''

def expand(text):
    def rep(m):
        kind, rest = m.group(1), m.group(2)
        if kind == "i":
            return icon(rest)
        if kind == "inc":
            return expand((ROOT / "partials" / f"{rest}.html").read_text())
        if kind == "gen":
            name, _, arg = rest.partition(":")
            return GEN[name](arg or None)
        if kind == "img":
            uid, _, w = rest.partition(":")
            return UNSPLASH.format(uid, w or 1200)
        raise ValueError(kind)
    prev = None
    while prev != text:
        prev = text
        text = re.sub(r"\{\{(i|inc|gen|img):([^}]+)\}\}", rep, text)
    return text

# ---------------------------------------------------------------- integrasi SuperAdmin (CMS)
# Setelah konten dipublikasikan lewat SuperAdmin (admin/), isi bagian bertanda data-cms di halaman
# adalah milik CMS. build.py tetap boleh dijalankan untuk perubahan struktur/desain: bagian CMS,
# judul & deskripsi SEO diambil dari halaman yang sudah ada sehingga hasil kerja admin tidak hilang.
def cms_published():
    f = OUT / "admin" / "data" / "published" / "content.php"
    if not f.exists():
        return None
    s = f.read_text()
    if s.startswith("<?php"):
        s = s.split("\n", 1)[1]
    try:
        return json.loads(s)
    except ValueError:
        return None

def _element_span(doc, key):
    """(awal_isi, akhir_isi, tag_pembuka) elemen ber-data-cms=key, dengan penghitungan tag bersarang."""
    m = re.search(r'<([a-z0-9]+)\b[^>]*\bdata-cms="' + re.escape(key) + r'"[^>]*>', doc)
    if not m:
        return None
    tag, i, depth = m.group(1), m.end(), 1
    pat = re.compile(r"<(/?)" + tag + r"\b[^>]*?(/?)>", re.I)
    for t in pat.finditer(doc, i):
        if t.group(2):
            continue
        depth += -1 if t.group(1) else 1
        if depth == 0:
            return m.end(), t.start(), m.group(0)
    return None

def preserve_cms(old, new):
    for key in dict.fromkeys(re.findall(r'data-cms="([a-z0-9-]+)"', new)):
        a, b = _element_span(old, key), _element_span(new, key)
        if not a or not b:
            continue
        if key == "contact-map":                     # hanya atribut src/title
            src = re.search(r'\ssrc="([^"]*)"', a[2])
            if src:
                new = new.replace(b[2], re.sub(r'\ssrc="[^"]*"', ' src="' + src.group(1) + '"', b[2]), 1)
            continue
        if key == "contact-form":
            rec = re.search(r'data-recipient="([^"]*)"', a[2])
            if rec and "data-recipient" not in b[2]:
                new = new.replace(b[2], b[2][:-1] + ' data-recipient="' + rec.group(1) + '">', 1)
            continue
        new = new[:b[0]] + old[a[0]:a[1]] + new[b[1]:]
    for sec in re.findall(r'data-cms-section="([a-z0-9-]+)"', new):
        o = re.search(r'<section\b[^>]*data-cms-section="' + sec + r'"[^>]*>', old)
        n = re.search(r'<section\b[^>]*data-cms-section="' + sec + r'"[^>]*>', new)
        if o and n and (" hidden" in o.group(0)) != (" hidden" in n.group(0)):
            new = new.replace(n.group(0), n.group(0)[:-1] + " hidden>" if " hidden" in o.group(0) else n.group(0).replace(" hidden", ""), 1)
    for pat in (r"<title>.*?</title>", r'<meta name="description" content="[^"]*">', r'<meta property="og:title" content="[^"]*">',
                r'<meta property="og:description" content="[^"]*">', r'<meta name="google-site-verification" content="[^"]*">'):
        o, n = re.search(pat, old, re.S), re.search(pat, new, re.S)
        if o and n:
            new = new.replace(n.group(0), o.group(0), 1)
    return new

def main():
    global GA_MEASUREMENT_ID, GSC_VERIFICATION, SITE_URL
    OUT.mkdir(parents=True, exist_ok=True)
    minify_assets()
    cms = cms_published()
    if cms:
        st = cms.get("settings") or {}
        GA_MEASUREMENT_ID = st.get("gaId", GA_MEASUREMENT_ID); GSC_VERIFICATION = st.get("gscCode", GSC_VERIFICATION)
        SITE_URL = st.get("siteUrl", SITE_URL) or SITE_URL
        print("CMS aktif: bagian konten, SEO, dan integrasi dipertahankan dari hasil publikasi SuperAdmin")
    for f in sorted((ROOT / "pages").glob("*.html")):
        raw = f.read_text()
        first, _, body = raw.partition("\n")
        m = re.match(r"<!--\s*(.*?)\s*-->", first)
        meta = dict(kv.split("=", 1) for kv in re.split(r"\|(?=[a-z]+=)", m.group(1)))
        active = meta.get("nav", "")
        html_out = page(meta, expand(body), active, f.stem)
        target = OUT / f.name
        if cms and target.exists():
            html_out = preserve_cms(target.read_text(), html_out)
        target.write_text(html_out)
        print("built", f.name)
    write_extras()

def write_extras():
    """File pendukung hosting: robots.txt, sitemap.xml, manifest, ikon, gambar OG."""
    import datetime, shutil
    order = ["index", "tentang", "produk", "layanan", "partner", "karir", "training", "blog", "blog-detail", "kontak"]
    stems = [s for s in order if (ROOT / "pages" / f"{s}.html").exists()]
    pri = {"index": "1.0", "produk": "0.9", "layanan": "0.9", "tentang": "0.8", "kontak": "0.8"}
    today = datetime.date.today().isoformat()
    urls = "".join(
        f"  <url><loc>{page_url(s)}</loc><lastmod>{today}</lastmod><priority>{pri.get(s, '0.6')}</priority></url>\n"
        for s in stems if s != "404")
    for art in sorted(OUT.glob("blog-*.html")):                 # artikel yang diterbitkan lewat SuperAdmin
        if art.name != "blog-detail.html":
            urls += f"  <url><loc>{SITE_URL}/{art.name}</loc><lastmod>{today}</lastmod><priority>0.6</priority></url>\n"
    (OUT / "sitemap.xml").write_text(f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n{urls}</urlset>\n')
    (OUT / "robots.txt").write_text(f"User-agent: *\nAllow: /\nDisallow: /admin/\n\nSitemap: {SITE_URL}/sitemap.xml\n")
    (OUT / "site.webmanifest").write_text('{"name":"PT. Prawathiya Karsa Pradiptha","short_name":"PKP","start_url":"./","display":"standalone","background_color":"#ffffff","theme_color":"#0A2C46","icons":[{"src":"assets/img/favicon.png","sizes":"64x64","type":"image/png"},{"src":"assets/img/apple-touch-icon.png","sizes":"180x180","type":"image/png"}]}\n')
    (OUT / ".nojekyll").write_text("")
    shutil.copyfile(ROOT / "assets" / "htaccess.txt", OUT / ".htaccess")
    img = OUT / "assets" / "img"
    A = ROOT / "assets"
    for src, dst in [("favicon-32.png", "favicon-32.png"), ("favicon-180.png", "apple-touch-icon.png"), ("logo-pkp.png", "logo-pkp.png")]:
        shutil.copyfile(A / src, img / dst)
    if (A / "og-image.jpg").exists():
        shutil.copyfile(A / "og-image.jpg", img / "og-image.jpg")

if __name__ == "__main__":
    main()
