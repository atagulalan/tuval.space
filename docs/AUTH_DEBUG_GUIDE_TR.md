# 🐛 Auth Debug Rehberi

## Console Log'lar Eklendi ✅

Auth akışının her adımına detaylı console log'lar ekledim. Artık login sürecinin her adımını izleyebilirsiniz.

## 📊 Log Sembolleri

| Sembol | Anlamı |
|--------|--------|
| 🚀 | İşlem başladı |
| ✅ | İşlem başarılı |
| ❌ | Hata oluştu |
| ⚠️ | Uyarı/Bilgi |
| 🔍 | Kontrol ediliyor |
| 📦 | Veri alındı |
| 🔔 | Event tetiklendi |
| 👤 | User işlemi |
| 💾 | State güncellendi |
| 🧹 | Cleanup |

## 🔄 Normal Login Akışı

Başarılı bir login işleminde console'da şu sırayı görmelisiniz:

### 1. Sayfa Yüklendiğinde
```
🎬 [AUTH CONTEXT] useEffect initialized
🔄 [AUTH CONTEXT] Checking redirect result...
🔍 [AUTH] Checking for redirect result...
📦 [AUTH] getRedirectResult returned: null
⚠️ [AUTH] No redirect result (user may not have just signed in)
ℹ️ [AUTH CONTEXT] No redirect result found
👂 [AUTH CONTEXT] Setting up onAuthStateChanged listener
🔔 [AUTH CONTEXT] Auth state changed: null (not signed in)
🚫 [AUTH CONTEXT] No user signed in, clearing state
✨ [AUTH CONTEXT] Setting loading to false
```

### 2. Login Butonuna Tıkladığınızda
```
🔘 [LOGIN BUTTON] User clicked sign in button
⏳ [LOGIN BUTTON] Loading state set to true
🚀 [AUTH] Starting signInWithRedirect...
✅ [AUTH] signInWithRedirect initiated (will redirect now)
🎯 [LOGIN BUTTON] signInWithGoogle completed, redirect should happen now
```

### 3. Google'dan Geri Dönüş (Redirect Sonrası)
```
🎬 [AUTH CONTEXT] useEffect initialized
🔄 [AUTH CONTEXT] Checking redirect result...
🔍 [AUTH] Checking for redirect result...
📦 [AUTH] getRedirectResult returned: [User object]
✅ [AUTH] Redirect successful! User: { uid: "...", email: "...", displayName: "..." }
✅ [AUTH CONTEXT] Redirect sign-in successful: { uid: "...", email: "...", displayName: "..." }
👂 [AUTH CONTEXT] Setting up onAuthStateChanged listener
🔔 [AUTH CONTEXT] Auth state changed: { uid: "...", email: "...", displayName: "..." }
👤 [AUTH CONTEXT] User signed in, fetching Firestore data...
📚 [AUTH CONTEXT] Firestore user data: {...}
```

**İki durumdan biri:**

**Durum A: User Firestore'da var**
```
✅ [AUTH CONTEXT] User exists in Firestore, checking quota...
💾 [AUTH CONTEXT] Setting user state: { username: "...", pixelQuota: ... }
✨ [AUTH CONTEXT] Setting loading to false
```

**Durum B: User Firestore'da yok (ilk login)**
```
⚠️ [AUTH CONTEXT] User NOT in Firestore, needs username registration
✨ [AUTH CONTEXT] Setting loading to false
```

## 🔎 Sorun Tespiti

### Sorun: Redirect sonrası hiçbir şey olmuyor

**Console'da bakın:**
```
📦 [AUTH] getRedirectResult returned: null
```

**Çözüm:**
- Firebase Console'da `localhost` authorized domains'e eklenmiş mi kontrol edin
- Vite config'de `base: '/'` olduğundan emin olun

### Sorun: "No redirect result" mesajı sürekli geliyor

**Bu normaldir!** Bu mesaj, kullanıcının henüz login olmadığını gösterir. Sadece ilk sayfa yüklendiğinde görünür.

### Sorun: Redirect başlıyor ama geri dönüş olmuyor

**Console'da şunu göreceksiniz:**
```
🚀 [AUTH] Starting signInWithRedirect...
✅ [AUTH] signInWithRedirect initiated (will redirect now)
```

**Sonra sayfa Google'a yönleniyor ama geri dönünce:**
```
📦 [AUTH] getRedirectResult returned: null
```

**Çözüm:**
1. Firebase Console > Authentication > Settings > Authorized domains
2. `localhost` eklenmiş mi kontrol edin
3. Browser cache'i temizleyin (Ctrl+Shift+Delete)

### Sorun: Auth çalışıyor ama Firestore hatası

**Console'da:**
```
✅ [AUTH] Redirect successful! User: {...}
❌ [AUTH CONTEXT] Error fetching user data: [Error]
```

**Çözüm:**
- Firestore Rules kontrol edin
- `.env` dosyasında Firebase config'in doğru olduğundan emin olun

## 🧪 Test Adımları

### 1. Dev Server'ı Başlatın
```bash
pnpm run dev
```

### 2. Tarayıcıyı Açın
```
http://localhost:5173/
```

### 3. Console'u Açın
`F12` > Console sekmesi

### 4. Login Butonuna Tıklayın
Console'da log akışını takip edin

### 5. Log'ları Kontrol Edin
Yukarıdaki "Normal Login Akışı" ile karşılaştırın

## 📝 Hangi Log'larda Ne Var?

### `auth.service.ts` - Firebase Auth İşlemleri
- `signInWithGoogle()` - Redirect başlatma
- `handleRedirectResult()` - Redirect sonucunu kontrol etme

### `LoginButton.tsx` - UI Event'leri
- Buton tıklama
- Loading state değişimleri

### `AuthContext.tsx` - State Management
- Auth state değişimleri
- Firestore user data fetch
- User state güncellemeleri

## 🎯 Hızlı Checklist

Login çalışmıyor mu? Console'da şunları kontrol edin:

- [ ] `🎬 [AUTH CONTEXT] useEffect initialized` - Context başladı mı?
- [ ] `🔘 [LOGIN BUTTON] User clicked sign in button` - Buton event'i çalıştı mı?
- [ ] `🚀 [AUTH] Starting signInWithRedirect...` - Redirect başladı mı?
- [ ] `📦 [AUTH] getRedirectResult returned: [User object]` - Redirect sonucu geldi mi?
- [ ] `🔔 [AUTH CONTEXT] Auth state changed: {...}` - Auth state güncellendi mi?
- [ ] `💾 [AUTH CONTEXT] Setting user state: {...}` - User state set edildi mi?

Her adımda ❌ görürseniz, hata mesajını okuyun!

## 🚀 Sonuç

Console log'lar sayesinde auth akışının her adımını görebilirsiniz. Bir sorun varsa, hangi adımda takıldığını kolayca tespit edebilirsiniz!

**İyi debugginglar!** 🐛✨










