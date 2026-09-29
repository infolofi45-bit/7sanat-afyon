# 7Sanat Afyon — iOS ve Android Uygulaması

Uygulama, web panelinin aynısını telefona gömer (Capacitor). Veriler yine kurumun sunucusundan (`server.js`) gelir. Bu yüzden web paneli ve uygulama her zaman aynı verileri görür.

- Uygulama kimliği: `com.yedisanat.afyon`
- Uygulama adı: 7Sanat Afyon
- Panel kodunun tek kaynağı `../public/index.html` dosyasıdır. Oradaki her değişiklik `npm run senkron` ile uygulamaya da geçer.

## 1) Sunucunun telefondan erişilebilir olması

Telefon `localhost`'a bağlanamaz. İki seçenek var:

- **Deneme (aynı Wi-Fi):** Sunucuyu bilgisayarda `npm start` ile çalıştırın. Bilgisayarın yerel IP'sini öğrenin (Windows: `ipconfig`, Mac: Sistem Ayarları > Wi-Fi). Uygulamada adres olarak örneğin `192.168.1.25:3000` girin.
- **Gerçek kullanım:** `server.js`'i internete açık bir sunucuya kurun (VPS, Render, Railway vb.). Bir alan adı ve **https** ile yayınlayın, örneğin `https://panel.7sanatafyon.com`.

Uygulama ilk açılışta sunucu adresini sorar ve telefonda saklar. Adresi giriş ekranının altındaki "Değiştir" ile değiştirebilirsiniz.
Adresi herkese sordurmak istemiyorsanız `public/index.html` içindeki `VARSAYILAN_SUNUCU = ""` satırına adresi yazıp uygulamayı yeniden derleyin.

## 2) Android

**Gerekenler:** [Android Studio](https://developer.android.com/studio) (içinde JDK 21 ve Android SDK gelir) ve Node.js 22.

```
cd mobil
npm install
npm run android        # web dosyalarını hazırlar ve Android Studio'yu açar
```

- Android Studio'da telefonu USB ile bağlayıp ▶ Run'a basın.
- APK dosyası için: **Build > Build App Bundle(s)/APK(s) > Build APK(s)**.
- Google Play için: **Build > Generate Signed App Bundle** (.aab). Play Console hesabı tek seferlik 25$.

**Bilgisayara kurulum yapmadan APK:** Projeyi GitHub'a yükleyin. `.github/workflows/android-apk.yml` her yüklemede APK'yı otomatik derler. APK'yı GitHub > Actions > son çalışma > "7sanat-afyon-apk" kısmından indirin.

## 3) iOS (iPhone / iPad)

**Gerekenler:** Mac bilgisayar, Xcode 16 veya üzeri, Node.js 22. Kendi iPhone'unuzda denemek için ücretsiz Apple ID yeterli. App Store için Apple Developer hesabı gerekir (yıllık 99$).

```
cd mobil
npm install
npm run ios            # web dosyalarını hazırlar ve Xcode'u açar
```

- Xcode'da **App** hedefi > **Signing & Capabilities** > Team olarak Apple hesabınızı seçin.
- iPhone'u bağlayıp ▶ Run'a basın.
- App Store için: **Product > Archive > Distribute App**.

## 4) Güncelleme

Panelde (`public/index.html`) değişiklik yaptıktan sonra:

```
cd mobil
npm run senkron
```

Ardından Android Studio / Xcode'dan yeniden derleyin. Sadece sunucudaki veriler değiştiyse yeniden derlemeye gerek yoktur; uygulama verileri her açılışta sunucudan alır.

## 5) Uygulamaya özel davranışlar

- Giriş bir kez yapılır; uygulama kapatılıp açılınca oturum açık kalır. "Çıkış" ile kapanır.
- Telefonda altta sekme çubuğu çıkar. Yönetici gibi çok sayfalı rollerde "Menü" düğmesi tüm sayfaları açar.
- Android geri tuşu önce açık pencereyi, sonra menüyü kapatır.
- "Excel'e Aktar" telefonun paylaş menüsünü açar (WhatsApp, Drive, e-posta...).
- Yazdır butonları uygulamada gizlidir. Kart basımı için web panelini kullanın.
- Uygulamaya geri dönüldüğünde veriler sunucudan yenilenir.

## 6) Güvenlik notu

Test kolaylığı için uygulama **http** sunuculara da bağlanabiliyor:
- Android: `AndroidManifest.xml` içinde `usesCleartextTraffic`
- iOS: `Info.plist` içinde `NSAllowsArbitraryLoads`

Sunucunuz https olduktan sonra bu iki izni kaldırmanız önerilir. Apple, mağaza incelemesinde bu izni sorgulayabilir.

## İkon ve açılış ekranı

Kaynak görseller `assets/` klasöründe. Değiştirirseniz `npm run ikonlar` tüm boyutları yeniden üretir.
