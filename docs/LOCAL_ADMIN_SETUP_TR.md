# Local Firebase Admin Snapshot Güncelleme - Türkçe Rehber

## 🎯 Özet

Cloud Functions kullanmadan, **local bilgisayarınızdan** Firebase Admin SDK ile board snapshot'larını güncelleyebilirsiniz.

## 📦 Neler Eklendi?

### 1. Admin Script
- **Dosya:** `scripts/admin/snapshot-updater.ts`
- **Görev:** Board snapshot'larını event sourcing ile günceller
- **Dil:** TypeScript (Node.js)

### 2. NPM Scripts
```json
"admin:build": "tsc --project tsconfig.admin.json"
"admin:update-snapshots": "pnpm admin:build && node dist/admin/admin/snapshot-updater.js"
```

### 3. Yeni Paketler
- `firebase-admin` - Firebase Admin SDK
- `dotenv` - Environment variables
- `@types/node` - Node.js type definitions

### 4. Konfigürasyon
- `tsconfig.admin.json` - Admin script için TypeScript config
- `.gitignore` - Service account güvenliği için güncellendi
- `.env.example` - Environment variable örnekleri

### 5. Dökümanlar
- `ADMIN_SCRIPTS_SETUP.md` - Detaylı kurulum rehberi
- `scripts/admin/README.md` - Script kullanım rehberi
- `scripts/admin/example-usage.sh` - Linux/Mac örnek script
- `scripts/admin/example-usage.bat` - Windows örnek script

## 🚀 Hızlı Başlangıç (3 Adım)

### Adım 1: Service Account Key İndirin

1. [Firebase Console](https://console.firebase.google.com/) → Projeniz
2. **Project Settings** → **Service Accounts**
3. **Generate New Private Key** → İndir
4. Dosyayı proje root'una `firebase-service-account.json` olarak kaydet

```
tuval.space/
├── firebase-service-account.json  ← Burası!
├── src/
└── package.json
```

### Adım 2: Bağımlılıkları Yükle

```bash
pnpm install
```

### Adım 3: İlk Çalıştırma

```bash
# Durumu kontrol et
pnpm admin:update-snapshots --status

# Eski snapshot'ları güncelle
pnpm admin:update-snapshots --stale
```

## 📖 Kullanım Komutları

### Durum Kontrolü
```bash
pnpm admin:update-snapshots --status
```

**Çıktı:**
```
📊 Board Snapshot Status

✅ Fresh Main Canvas
  ID: abc123
  Size: 100x100
  Last snapshot: 2h ago

⚠️  Stale Test Board
  ID: def456
  Size: 50x50
  Last snapshot: 30h ago
```

### Eski Snapshot'ları Güncelle (Önerilen)
```bash
pnpm admin:update-snapshots --stale
```

24 saatten eski snapshot'ları günceller. **Günlük kullanım için ideal.**

### Tüm Board'ları Güncelle
```bash
pnpm admin:update-snapshots
```

İlk kurulum veya major değişikliklerden sonra kullanın.

### Belirli Board'u Güncelle
```bash
pnpm admin:update-snapshots --board=BOARD_ID
```

### Yardım
```bash
pnpm admin:update-snapshots --help
```

## ⏰ Otomatik Çalıştırma

### Windows Task Scheduler

1. **Win + R** → `taskschd.msc`
2. **Create Basic Task**
3. Name: "Tuval.space Snapshot Update"
4. Trigger: **Daily**, **3:00 AM**
5. Action: **Start a program**
   - Program: `C:\Program Files\nodejs\pnpm.cmd`
   - Arguments: `admin:update-snapshots --stale`
   - Start in: `C:\O\GitHub\tuval.space`
6. **Finish**

### Linux/Mac Cron

```bash
crontab -e
```

Şunu ekle:
```cron
0 3 * * * cd /path/to/tuval.space && pnpm admin:update-snapshots --stale
```

## 🔍 Teknik Detaylar

### Event Sourcing Pattern

```
┌─────────────────────────────────────────────────────────┐
│                    Pixel Placement                       │
│                                                          │
│  User → modifications collection (1 write)              │
│         ✅ Çok hızlı, ucuz                               │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Board Display                         │
│                                                          │
│  1. Load snapshot (pixels collection)                   │
│  2. Get delta (modifications since snapshot)            │
│  3. Apply delta to snapshot                             │
│  4. Show to user                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                 Snapshot Update (Bu Script)              │
│                                                          │
│  1. Replay all modifications (event sourcing)           │
│  2. Calculate current state                             │
│  3. Write to pixels collection                          │
│  4. Update lastSnapshotAt timestamp                     │
└─────────────────────────────────────────────────────────┘
```

### Snapshot Freshness

| Durum | Yaş | Performans | Aksiyon |
|-------|-----|------------|---------|
| ✅ Fresh | < 24 saat | Normal | Güncelleme gerekmez |
| ⚠️ Stale | > 24 saat | Biraz yavaş | Güncelle |
| ❌ Missing | Yok | Çok yavaş | Mutlaka güncelle |

### Firestore Yapısı

```
boards/
  {boardId}/
    - name, width, height, etc.
    
    modifications/  ← Event Source (Append-only)
      {batchId}/
        - userId, username
        - pixels: [{ x, y, color, timestamp }]
        - batchStartTime, batchEndTime
    
Board document alanları:
  - snapshot: { '0': '#FF0000', '150': '#00FF00' }  ← Sparse renk haritası (sadece dolu pikseller)
  - lastSnapshotAt  ← Freshness indicator
```

## 📊 Performans

### Write (Pixel Placement)
- **Önceki:** 2-4 writes per pixel
- **Şimdi:** 1 write per pixel
- **İyileşme:** 50-75% daha hızlı, ucuz

### Read (Board Display)
- **Fresh snapshot:** Çok hızlı (az delta)
- **Stale snapshot:** Biraz yavaş (çok delta)
- **No snapshot:** Yavaş (tüm modifications)

### Snapshot Update (Bu Script)

| Board | Modifications | Süre |
|-------|---------------|------|
| 50x50 | ~100 batches | 2-5s |
| 100x100 | ~500 batches | 5-15s |
| 200x200 | ~2000 batches | 15-30s |
| 500x500 | ~5000 batches | 30-60s |

## 🔒 Güvenlik

### ✅ Güvenli
- Service account key `.gitignore`'da
- Admin SDK sadece local'de çalışır
- Firestore Security Rules bypass edilir (admin yetkisi)

### ⚠️ Dikkat
- Service account key'i **ASLA** commit etmeyin
- Service account key'i **ASLA** paylaşmayın
- Production database'de dikkatli kullanın
- Key'i düzenli olarak rotate edin

## 🐛 Sorun Giderme

### "Service account file not found"

```bash
# Kontrol et
ls firebase-service-account.json

# Yoksa Firebase Console'dan tekrar indir
```

### "Permission denied"

Firebase Console → Project Settings → Service Accounts → **Firebase Admin SDK** rolü olmalı

### "Board not found"

```bash
# Board ID'leri listele
pnpm admin:update-snapshots --status
```

### Script çalışmıyor

```bash
# Bağımlılıkları yeniden yükle
pnpm install

# Manuel build
pnpm admin:build

# Hata logunu oku
```

## 💡 Best Practices

### 1. İlk Kurulum
```bash
# Tüm board'ları güncelle
pnpm admin:update-snapshots
```

### 2. Günlük Bakım
```bash
# Sadece stale olanları güncelle
pnpm admin:update-snapshots --stale
```

### 3. Monitoring
```bash
# Düzenli status kontrol
pnpm admin:update-snapshots --status
```

### 4. Zamanlama
- ✅ Gece çalıştır (03:00 ideal)
- ❌ Peak saatlerde çalıştırma
- ✅ Otomatik scheduled task kur

## 📁 Dosya Yapısı

```
tuval.space/
├── firebase-service-account.json     # Service account key (GİZLİ!)
├── .gitignore                        # Service account ignore edildi
├── package.json                      # Admin scripts eklendi
├── tsconfig.admin.json               # Admin TypeScript config
├── ADMIN_SCRIPTS_SETUP.md            # Detaylı rehber
├── LOCAL_ADMIN_SETUP_TR.md           # Bu dosya
└── scripts/
    └── admin/
        ├── README.md                 # Script dökümanı
        ├── snapshot-updater.ts       # Ana script
        ├── example-usage.sh          # Linux/Mac örnek
        └── example-usage.bat         # Windows örnek
```

## 🔗 İlgili Dökümanlar

1. **[ADMIN_SCRIPTS_SETUP.md](./ADMIN_SCRIPTS_SETUP.md)** - Detaylı kurulum rehberi
2. **[scripts/admin/README.md](./scripts/admin/README.md)** - Script kullanım rehberi
3. **[SNAPSHOT_DELTA_OPTIMIZATION.md](./SNAPSHOT_DELTA_OPTIMIZATION.md)** - Teknik detaylar
4. **[EVENT_SOURCING_IMPLEMENTATION.md](./EVENT_SOURCING_IMPLEMENTATION.md)** - Event sourcing

## ✅ Checklist

Kurulum tamamlandı mı?

- [ ] `firebase-admin`, `dotenv`, `@types/node` yüklendi
- [ ] `firebase-service-account.json` proje root'unda
- [ ] `firebase-service-account.json` `.gitignore`'da
- [ ] `pnpm admin:update-snapshots --status` çalışıyor
- [ ] İlk snapshot update yapıldı
- [ ] Otomatik scheduled task kuruldu (opsiyonel)

## 🎓 Örnek Senaryo

### Senaryo: İlk Kurulum

```bash
# 1. Service account key'i indir ve kaydet
# (Firebase Console'dan)

# 2. Durumu kontrol et
pnpm admin:update-snapshots --status
# Çıktı: ❌ No snapshot (hepsi için)

# 3. Tüm board'ları güncelle
pnpm admin:update-snapshots
# Çıktı: ✅ Updated: 3

# 4. Tekrar kontrol et
pnpm admin:update-snapshots --status
# Çıktı: ✅ Fresh (hepsi için)

# 5. Otomatik task kur (Windows Task Scheduler)
# Her gün 03:00'te: pnpm admin:update-snapshots --stale
```

### Senaryo: Günlük Bakım

```bash
# Her gün otomatik çalışır (Task Scheduler)
pnpm admin:update-snapshots --stale

# Veya manuel çalıştır
pnpm admin:update-snapshots --stale
```

### Senaryo: Problem Giderme

```bash
# 1. Belirli board'da sorun var
pnpm admin:update-snapshots --status
# Çıktı: ⚠️ Stale Test Board (def456)

# 2. Sadece o board'u güncelle
pnpm admin:update-snapshots --board=def456

# 3. Kontrol et
pnpm admin:update-snapshots --status
# Çıktı: ✅ Fresh Test Board
```

## 🆘 Destek

Sorun yaşarsanız:

1. Bu dökümanı oku
2. [ADMIN_SCRIPTS_SETUP.md](./ADMIN_SCRIPTS_SETUP.md) oku
3. Log mesajlarını incele
4. GitHub Issues'da sorun aç

## 🎉 Sonuç

Artık cloud functions kullanmadan, local bilgisayarınızdan board snapshot'larını güncelleyebilirsiniz!

**Avantajlar:**
- ✅ Kolay kurulum
- ✅ Tam kontrol
- ✅ Maliyet tasarrufu (cloud functions yok)
- ✅ Anında çalıştırma
- ✅ Debug kolay

**Dezavantajlar:**
- ⚠️ Manuel veya scheduled task gerekli
- ⚠️ Local bilgisayar açık olmalı (scheduled task için)

**Alternatif:** Cloud Functions kullanmak isterseniz, ayrı bir döküman hazırlayabiliriz.

---

**Hazırlayan:** Cursor AI Assistant  
**Tarih:** 22 Aralık 2025  
**Versiyon:** 1.0  
**Dil:** Türkçe

