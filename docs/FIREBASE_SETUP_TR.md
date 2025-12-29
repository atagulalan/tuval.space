# Firebase Kurulum Rehberi (Türkçe)

## Adım 1: Firebase Projesi Oluşturun

1. **Firebase Console'a gidin:** https://console.firebase.google.com/
2. **"Proje ekle"** butonuna tıklayın
3. Proje adı: `tuval-space` (veya istediğiniz bir isim)
4. Google Analytics'i devre dışı bırakın (isteğe bağlı)
5. **"Proje oluştur"** butonuna tıklayın

## Adım 2: Web Uygulaması Ekleyin

1. Firebase Console'da projenize tıklayın
2. **Proje Ayarları** (⚙️ dişli ikonu) > **Genel** sekmesi
3. Aşağı kaydırın ve **"Uygulamalarınız"** bölümünde
4. **Web ikonu** (`</>`) tıklayın
5. Uygulama takma adı girin: `tuval.space`
6. **"Uygulamayı kaydet"** butonuna tıklayın

## Adım 3: Firebase Yapılandırmasını Kopyalayın

Firebase şu şekilde bir kod gösterecek:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "tuval-space.firebaseapp.com",
  projectId: "tuval-space",
  storageBucket: "tuval-space.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Adım 4: .env Dosyası Oluşturun

Proje klasöründe `.env` adında yeni bir dosya oluşturun:

```bash
# Windows PowerShell'de:
New-Item -Path .env -ItemType File
```

## Adım 5: Firebase Anahtarlarını Ekleyin

`.env` dosyasını açın ve Firebase yapılandırmanızdan aldığınız değerleri ekleyin:

```env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=tuval-space.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tuval-space
VITE_FIREBASE_STORAGE_BUCKET=tuval-space.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456

# Uygulama Ayarları (bunlar olduğu gibi kalabilir)
VITE_DEFAULT_PIXEL_QUOTA=100
VITE_MAX_PIXEL_ACCUMULATION=3
VITE_MAX_BOARDS_PER_USER=10
VITE_MAX_BOARD_PIXELS=400000
VITE_CHANGE_MERGE_WINDOW_HOURS=8
```

## Adım 6: Authentication'ı Etkinleştirin

1. Firebase Console'da **Authentication** bölümüne gidin
2. **"Başlayın"** butonuna tıklayın
3. **Oturum açma yöntemi** sekmesine gidin
4. **Google** seçeneğine tıklayın
5. **"Etkinleştir"** düğmesini açın
6. Destek e-postası seçin
7. **"Kaydet"** butonuna tıklayın

## Adım 7: Firestore Veritabanı Oluşturun

1. Firebase Console'da **Firestore Database** bölümüne gidin
2. **"Veritabanı oluştur"** butonuna tıklayın
3. **"Üretim modunda başlat"** seçin
4. Konum seçin (kullanıcılarınıza en yakın)
5. **"Etkinleştir"** butonuna tıklayın

## Adım 8: Güvenlik Kurallarını Yükleyin

### Seçenek A: Firebase CLI ile (Önerilen)

```bash
# Firebase CLI'yi yükleyin
npm install -g firebase-tools

# Firebase'e giriş yapın
firebase login

# Projeyi başlatın
firebase init firestore

# Kuralları yükleyin
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Seçenek B: Manuel

1. Firebase Console'da **Firestore Database** > **Kurallar**
2. `firestore.rules` dosyasının içeriğini kopyalayın
3. Kural editörüne yapıştırın
4. **"Yayınla"** butonuna tıklayın

## Adım 9: Yerel Olarak Test Edin

```bash
# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

Tarayıcınızda http://localhost:5173 adresini açın

## Adım 10: GitHub'a Yetkilendir

Eğer GitHub Pages'e deploy edecekseniz:

1. Firebase Console > **Authentication** > **Settings** > **Authorized domains**
2. GitHub Pages domain'inizi ekleyin: `yourusername.github.io`
3. **"Ekle"** butonuna tıklayın

## ⚠️ Önemli Güvenlik Notları

- ✅ `.env` dosyası `.gitignore` içinde (Git'e eklenmez)
- ✅ Firebase API anahtarları public olabilir (güvenlik kuralları sunucu tarafında)
- ❌ `.env` dosyasını ASLA Git'e commit etmeyin
- ❌ API anahtarlarını public olarak paylaşmayın

## 🎯 Tamamlandı!

Artık projeniz Firebase ile çalışmaya hazır. Herhangi bir sorun yaşarsanız:

1. Firebase Console'da hata loglarını kontrol edin
2. Tarayıcı console'unu kontrol edin (F12)
3. `.env` dosyasındaki değerlerin doğru olduğundan emin olun

## 📚 Daha Fazla Bilgi

- Detaylı deployment rehberi: `DEPLOYMENT.md`
- Proje dökümantasyonu: `README.md`
- Hızlı başlangıç: `QUICK_START.md`

---

**İyi çalışmalar!** 🚀











