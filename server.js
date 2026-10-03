const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

/* ================================================================== */
/*  Gizli ayarlar .env dosyasından okunur (paket gerektirmez).          */
/*  API anahtarı ARTIK HTML'de değil — sadece sunucuda, .env içinde.    */
/*  .env dosyası .gitignore'da; paylaşmayın, repoya eklemeyin.          */
/* ================================================================== */
(function envYukle() {
  const envYolu = path.join(__dirname, ".env");
  if (!fs.existsSync(envYolu)) return;
  fs.readFileSync(envYolu, "utf8").split(/\r?\n/).forEach((satir) => {
    const m = satir.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || satir.trim().startsWith("#")) return;
    let deger = m[2].trim().replace(/^["']|["']$/g, "");
    if (process.env[m[1]] === undefined) process.env[m[1]] = deger;
  });
})();

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const ARSIV_ANAHTARI = process.env.ARSIV_ANAHTARI || "";

const VERI_KLASORU = path.join(__dirname, "data");
const DB_DOSYA = path.join(VERI_KLASORU, "db.json");
const ARSIV_DOSYA = path.join(VERI_KLASORU, "silinen_kayitlar.json");
if (!fs.existsSync(VERI_KLASORU)) fs.mkdirSync(VERI_KLASORU, { recursive: true });

function jsonOku(dosya, varsayilan) {
  try { return JSON.parse(fs.readFileSync(dosya, "utf8")); } catch (e) { return varsayilan; }
}
function jsonYaz(dosya, veri) {
  const gecici = dosya + ".tmp";
  fs.writeFileSync(gecici, JSON.stringify(veri, null, 2), "utf8");
  fs.renameSync(gecici, dosya); // yarım yazılmış dosya oluşmasın
}

let kayit = jsonOku(DB_DOSYA, { surum: 0, db: null });

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));
app.use(express.static(path.join(__dirname, "public")));

/* ---------------- Veri tabanı (tek JSON dosyası) ---------------- */
app.get("/api/db", (req, res) => res.json(kayit));

app.put("/api/db", (req, res) => {
  const { db, surum } = req.body || {};
  if (!db || typeof db !== "object") return res.status(400).json({ error: "db alanı gerekli." });
  // Başka bir kullanıcı arada kaydettiyse üzerine yazma — istemci yenilesin
  if (kayit.db && surum !== kayit.surum) return res.status(409).json(kayit);
  kayit = { surum: (kayit.surum || 0) + 1, db };
  jsonYaz(DB_DOSYA, kayit);
  res.json({ surum: kayit.surum });
});

/* ------- Silinen kayıt arşivi: panelde görünmez, arkada saklanır ------- */
app.post("/api/arsiv", (req, res) => {
  const kayitlar = jsonOku(ARSIV_DOSYA, []);
  kayitlar.push({ ...req.body, arsivlenme: new Date().toISOString() });
  jsonYaz(ARSIV_DOSYA, kayitlar);
  res.json({ ok: true });
});

// Reklam çalışmaları için dışa aktarma: /api/arsiv/disa-aktar?anahtar=ARSIV_ANAHTARI
app.get("/api/arsiv/disa-aktar", (req, res) => {
  if (!ARSIV_ANAHTARI || req.query.anahtar !== ARSIV_ANAHTARI) return res.status(403).send("Yetkisiz.");
  const kayitlar = jsonOku(ARSIV_DOSYA, []);
  const basliklar = ["Silinme Tarihi", "Öğrenci", "Yaş", "Branş", "Kayıt Tarihi", "Veli Adı", "Veli Telefon", "Kart Tipi", "Toplam Ödenen", "Silen"];
  const hucre = (v) => `"${String(v === undefined || v === null ? "" : v).replace(/"/g, '""')}"`;
  const satirlar = kayitlar.map((k) => {
    const o = k.ogrenci || {};
    const odenen = (o.odemeler || []).reduce((a, p) => a + (p.tutar || 0), 0);
    return [k.silinmeTarihi, o.ad, o.yas, o.brans, o.kayitTarihi, o.veli && o.veli.ad, o.veli && o.veli.tel, k.kart && k.kart.tip, odenen, k.silen].map(hucre).join(";");
  });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="silinen_kayitlar.csv"');
  res.send("﻿" + [basliklar.map(hucre).join(";"), ...satirlar].join("\n"));
});

/* ------- Ders materyalleri (nota, ders notu vb. — her format) ------- */
const DOSYA_KLASORU = path.join(VERI_KLASORU, "dosyalar");
const DOSYA_SINIRI = 25 * 1024 * 1024; // 25 MB
if (!fs.existsSync(DOSYA_KLASORU)) fs.mkdirSync(DOSYA_KLASORU, { recursive: true });
const gecerliId = (id) => /^[a-z0-9-]{4,64}$/.test(id);

app.post("/api/dosya", express.raw({ type: () => true, limit: DOSYA_SINIRI }), (req, res) => {
  if (!req.body || !req.body.length) return res.status(400).json({ error: "Dosya boş." });
  let ad = "dosya";
  try { ad = decodeURIComponent(req.get("X-Dosya-Adi") || "dosya"); } catch (e) {}
  ad = ad.replace(/[\\/\r\n"]/g, "_").slice(0, 200);
  const id = Date.now().toString(36) + "-" + require("crypto").randomBytes(6).toString("hex");
  const meta = { ad, mime: req.get("Content-Type") || "application/octet-stream", boyut: req.body.length, tarih: new Date().toISOString() };
  fs.writeFileSync(path.join(DOSYA_KLASORU, id), req.body);
  fs.writeFileSync(path.join(DOSYA_KLASORU, id + ".json"), JSON.stringify(meta));
  res.json({ id, ...meta });
});

app.get("/api/dosya/:id", (req, res) => {
  const id = req.params.id;
  if (!gecerliId(id)) return res.status(400).send("Geçersiz dosya.");
  const yol = path.join(DOSYA_KLASORU, id);
  const meta = jsonOku(yol + ".json", null);
  if (!meta || !fs.existsSync(yol)) return res.status(404).send("Dosya bulunamadı.");
  res.setHeader("Content-Type", meta.mime);
  res.setHeader("Content-Disposition", `${req.query.indir ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(meta.ad)}`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Yüklenen HTML/SVG dosyaları panelin adresinde kod çalıştıramasın
  res.setHeader("Content-Security-Policy", "default-src 'none'; img-src 'self' data:; style-src 'unsafe-inline'; sandbox");
  res.sendFile(yol);
});

/* Demo için örnek materyaller (ilk açılışta bir kez oluşturulur) */
(function demoDosyalar() {
  const yaz = (id, ad, mime, icerik) => {
    if (fs.existsSync(path.join(DOSYA_KLASORU, id))) return;
    fs.writeFileSync(path.join(DOSYA_KLASORU, id), icerik);
    fs.writeFileSync(path.join(DOSYA_KLASORU, id + ".json"), JSON.stringify({ ad, mime, boyut: Buffer.byteLength(icerik), tarih: new Date().toISOString() }));
  };
  const cizgiler = (y) => [0, 1, 2, 3, 4].map((i) => `<line x1="20" x2="780" y1="${y + i * 12}" y2="${y + i * 12}" stroke="#222" stroke-width="1.2"/>`).join("");
  const notalar = (y, dizi) => dizi.map((n, i) => `<ellipse cx="${110 + i * 80}" cy="${y + 48 - n * 6}" rx="9" ry="6.5" fill="#111" transform="rotate(-20 ${110 + i * 80} ${y + 48 - n * 6})"/><line x1="${118 + i * 80}" x2="${118 + i * 80}" y1="${y + 46 - n * 6}" y2="${y + 6 - n * 6}" stroke="#111" stroke-width="1.6"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="330" viewBox="0 0 800 330"><rect width="800" height="330" fill="#fff"/>
<text x="400" y="40" font-family="serif" font-size="24" text-anchor="middle">Do Pozisyonu Etüdü (Örnek)</text>
${cizgiler(80)}${notalar(80, [0, 1, 2, 3, 4, 3, 2, 1, 0])}${cizgiler(200)}${notalar(200, [4, 3, 2, 1, 0, 1, 2, 3, 4])}
<text x="400" y="320" font-family="sans-serif" font-size="12" fill="#888" text-anchor="middle">7Sanat Afyon — demo materyali</text></svg>`;
  yaz("demo-nota", "Do Pozisyonu Etüdü.svg", "image/svg+xml", svg);
  yaz("demo-not", "Ders Notu - Oturuş ve El Pozisyonu.txt", "text/plain; charset=utf-8",
    "7SANAT AFYON — PİYANO DERS NOTU (ÖRNEK)\n\n1. Oturuş: Tabureye önden yarısına kadar otur, ayaklar yere tam bassın.\n2. Kollar: Dirsekler tuşlarla aynı hizada, omuzlar gevşek.\n3. El: Bir top tutar gibi yuvarlak; parmak uçlarıyla çal.\n4. Bu hafta: Do pozisyonunda 5 parmak egzersizini günde 10 dakika çalış.\n");
})();

/* ---------------- Yapay zeka vekil (proxy) ---------------- */
app.post("/api/ai", async (req, res) => {
  const { system, user } = req.body || {};
  if (!system || !user) return res.status(400).json({ error: "system ve user alanları gerekli." });
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API anahtarı tanımlı değil. Proje klasöründeki .env dosyasına OPENAI_API_KEY=... satırını ekleyin." });
  }
  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
        max_tokens: 1000,
      }),
    });
    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) return res.status(resp.status).json({ error: (data.error && data.error.message) || "OpenAI isteği başarısız." });
    res.json({ text: data.choices?.[0]?.message?.content || "" });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Dosya çok büyükse vb. anlaşılır hata döndür
app.use((err, req, res, next) => {
  if (err && err.type === "entity.too.large") return res.status(413).json({ error: "Dosya 25 MB sınırını aşıyor." });
  res.status(err.status || 500).json({ error: err.message || "Sunucu hatası" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`7Sanat Afyon sunucusu çalışıyor: http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) console.log("UYARI: OPENAI_API_KEY tanımlı değil — AI özellikleri çalışmayacak.");
});
