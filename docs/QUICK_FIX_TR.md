# ⚡ HIZLI ÇÖZÜM - Login Sorunu

## 🔴 Sorun
Login çalışmıyor çünkü Firebase'de `localhost` yetkili değil.

## ✅ Çözüm (2 Dakika)

### 1️⃣ Firebase Console'a Git
🔗 https://console.firebase.google.com/

### 2️⃣ Projeyi Seç
`tuval.space` projesini aç

### 3️⃣ Authentication > Settings
Sol menü: **Build** > **Authentication** > **Settings**

### 4️⃣ Authorized domains Bölümü
Sayfayı aşağı kaydır, **Authorized domains** bul

### 5️⃣ localhost Ekle
- **Add domain** tıkla
- `localhost` yaz
- **Add** tıkla

### 6️⃣ Test Et
- Tarayıcıyı yenile: http://localhost:5173/tuval.space/
- **Sign in with Google** tıkla
- ✅ Artık çalışmalı!

---

## 📋 Kontrol Listesi

Firebase Console'da bu domain'ler olmalı:
- [x] `localhost`
- [x] `tuvalspace.firebaseapp.com`
- [x] `tuval.space` (varsa)

---

## 🐛 Hala Çalışmıyorsa?

### A) Cache Temizle
`Ctrl + Shift + Delete` > Cache temizle

### B) 127.0.0.1 Kullan
- Firebase'e `127.0.0.1` de ekle
- `http://127.0.0.1:5173/tuval.space/` kullan

### C) .env Kontrol Et
```env
VITE_FIREBASE_AUTH_DOMAIN=tuvalspace.firebaseapp.com
```

Bu değer doğru olmalı!

---

## ℹ️ Neden Bu Sorun Oluyor?

Firebase, güvenlik için sadece yetkili domain'lerden gelen auth isteklerini kabul eder.

Localhost geliştirme ortamı olduğu için varsayılan olarak listede yok, manuel eklemeniz gerekiyor.

---

## 💡 İpucu

Bu ayarı bir kez yaptınız mı, bir daha yapmanıza gerek yok. Tüm Firebase projelerinizde geliştirme yaparken `localhost` eklemeyi unutmayın!


