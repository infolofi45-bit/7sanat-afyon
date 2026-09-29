# 7Sanat Afyon — Yönetim Paneli

## Çalıştırma
```
npm install
npm start
```
Tarayıcıda: http://localhost:3000

## Klasör yapısı
- `public/index.html` → Panelin tamamı (arayüz). **API anahtarı içermez.**
- `server.js` → Sunucu: yapay zeka vekili, veri kaydı, silinen kayıt arşivi
- `.env` → **Gizli ayarlar** (OpenAI anahtarı, arşiv anahtarı). Kimseyle paylaşmayın, repoya eklemeyin (.gitignore'da).
- `data/db.json` → Tüm veriler (ilk açılışta demo veriyle oluşur)
- `data/silinen_kayitlar.json` → Silinen öğrenciler (panelde görünmez)
- `mobil/` → iOS ve Android uygulaması (Capacitor). Kurulum için `mobil/BENIOKU-MOBIL.md`

## Silinen kayıtları dışa aktarma (reklam çalışmaları için)
`http://localhost:3000/api/arsiv/disa-aktar?anahtar=ARSIV_ANAHTARI`
(ARSIV_ANAHTARI değeri `.env` dosyasındadır.) Excel'de açılabilen CSV iner.

## Giriş hesapları (demo)
| Rol | Giriş | Şifre |
|---|---|---|
| Yönetici | admin@7sanat.com | admin123 |
| Sekreter | sekreter@7sanat.com | sekreter123 |
| Öğretmen | ayse@7sanat.com (diğerleri: ad@7sanat.com) | ogretmen123 |
| Kasa | kasa@7sanat.com | kasa123 |
| Veli | Veli telefon numarası | Kayıtta üretilen 6 haneli şifre |

Canlıya almadan önce: `index.html` içinde `DEMO_MODU = false` yapın (giriş ekranındaki demo kısayolları gizlenir) ve demo şifreleri değiştirin.
