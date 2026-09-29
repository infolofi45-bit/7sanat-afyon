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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`7Sanat Afyon sunucusu çalışıyor: http://localhost:${PORT}`);
  if (!OPENAI_API_KEY) console.log("UYARI: OPENAI_API_KEY tanımlı değil — AI özellikleri çalışmayacak.");
});
