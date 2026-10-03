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
| Yönetici | admin@7sanat.com.tr | admin123 |
| Sekreter | sekreter@7sanat.com.tr | sekreter123 |
| Öğretmen | ayse@7sanat.com.tr (diğerleri: ad@7sanat.com.tr) | ogretmen123 |
| Kasa | kasa@7sanat.com.tr | kasa123 |
| Veli | Veli telefon numarası | Kayıtta üretilen 6 haneli şifre |
| Öğrenci | isimsoyisim@7sanat.com.tr (aynı isimde 2., 3. kişi: isimsoyisim2, isimsoyisim3) | İlk şifre: TC'nin ilk 6 hanesi — ilk girişte değiştirilir |

Demo verisinde öğrencilerin ilk şifresi `123456`'dır. Giriş ekranındaki "Öğrenci" düğmesi şifresi önceden belirlenmiş bir demo öğrenciyi doldurur.

## Ders kayıtları ve materyaller
- Öğretmen, Yoklama & Ders sayfasında öğrenciye (grup derslerinde gruba) dokunarak tek pencerede şunları girer: yoklama (geldi / gelmedi / mazeretli + telafi talebi), gelişim puanı, değerlendirme, müfredat konuları, işlenenler, ödev ve materyaller.
- Materyaller `data/dosyalar/` klasörüne kaydedilir. Her format kabul edilir, dosya başına üst sınır 25 MB'dır.
- Piyano müfredatı MEB Talim ve Terbiye Kurulu "Piyano Kursu Programı"ndan (18.09.2015, Sayı 86) aktarılmıştır: 8 seviye, seviye başına 33 hafta. Yönetici → Müfredat sayfasından düzenlenebilir; diğer branşlar için de buradan müfredat oluşturulur.

Canlıya almadan önce: `index.html` içinde `DEMO_MODU = false` yapın (giriş ekranındaki demo kısayolları ve demo ders kayıtları gizlenir) ve demo şifreleri değiştirin.
