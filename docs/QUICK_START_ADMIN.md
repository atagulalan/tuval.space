# 🚀 Hızlı Başlangıç: Board Snapshot Güncelleme

## 3 Adımda Başla

### ✅ Adım 1: Service Account Key İndir

1. [Firebase Console](https://console.firebase.google.com/) aç
2. Projenizi seçin
3. ⚙️ **Project Settings** → **Service Accounts**
4. **Generate New Private Key** tıkla
5. İndirilen dosyayı `firebase-service-account.json` olarak **proje root'una** kaydet

```
tuval.space/
├── firebase-service-account.json  ← BURASI!
├── src/
└── package.json
```

### ✅ Adım 2: Test Et

```bash
pnpm admin:update-snapshots --status
```

**Beklenen çıktı:**
```
📊 Board Snapshot Status

✅ Fresh Main Canvas
  ID: abc123
  Size: 100x100
  Last snapshot: 2h ago
```

### ✅ Adım 3: İlk Güncelleme

```bash
pnpm admin:update-snapshots --stale
```

**Beklenen çıktı:**
```
🚀 Board Snapshot Updater

🔄 Rebuilding snapshot for board: Main Canvas
  📝 Found 45 modification batches
  🎨 Applied 1,234 pixel modifications
  ✅ Snapshot updated successfully

✨ Done!
```

## 🎯 Günlük Kullanım

```bash
# Her gün çalıştır (veya otomatik task kur)
pnpm admin:update-snapshots --stale
```

## ⏰ Otomatik Çalıştırma (Önerilen)

### Windows

1. **Win + R** → `taskschd.msc`
2. **Create Basic Task**
3. Name: "Tuval Snapshot Update"
4. Trigger: **Daily, 3:00 AM**
5. Action: **Start a program**
   ```
   Program: C:\Program Files\nodejs\pnpm.cmd
   Arguments: admin:update-snapshots --stale
   Start in: C:\O\GitHub\tuval.space
   ```

## 📖 Komutlar

| Komut | Ne Yapar |
|-------|----------|
| `pnpm admin:update-snapshots --status` | Durumu göster |
| `pnpm admin:update-snapshots --stale` | Eski snapshot'ları güncelle |
| `pnpm admin:update-snapshots` | Tümünü güncelle |
| `pnpm admin:update-snapshots --board=ID` | Belirli board'u güncelle |

## 🐛 Sorun mu var?

### "Service account file not found"
```bash
# Dosyayı kontrol et
dir firebase-service-account.json
```

### "Permission denied"
Firebase Console → Service account'un **Firebase Admin SDK** rolü olmalı

### Başka sorun?
[LOCAL_ADMIN_SETUP_TR.md](./LOCAL_ADMIN_SETUP_TR.md) dökümanına bak

## 📚 Detaylı Dökümanlar

- **[LOCAL_ADMIN_SETUP_TR.md](./LOCAL_ADMIN_SETUP_TR.md)** - Tam rehber (Türkçe) 🇹🇷
- **[ADMIN_SCRIPTS_SETUP.md](./ADMIN_SCRIPTS_SETUP.md)** - Detaylı rehber (English) 🇬🇧
- **[scripts/admin/QUICK_REFERENCE.md](./scripts/admin/QUICK_REFERENCE.md)** - Hızlı referans

## ✅ Tamamlandı!

Artık board snapshot'larını local'den güncelleyebilirsin! 🎉

**Sonraki:** Otomatik task kur ve unutma!








