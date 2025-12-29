# Firebase Admin Scripts Kurulum Rehberi

Bu rehber, Firebase Admin SDK kullanarak local'den board snapshot'larını güncellemenizi sağlar.

## 🚀 Hızlı Başlangıç

### 1. Service Account Oluşturma

Firebase Admin SDK'nın çalışması için bir service account key'e ihtiyacınız var:

1. [Firebase Console](https://console.firebase.google.com/) açın
2. Projenizi seçin (tuval.space)
3. Sol menüden **⚙️ Project Settings** (Proje Ayarları) tıklayın
4. **Service Accounts** sekmesine gidin
5. **Generate New Private Key** (Yeni Özel Anahtar Oluştur) butonuna tıklayın
6. Açılan dialogda **Generate Key** (Anahtar Oluştur) onaylayın
7. İndirilen JSON dosyasını proje root klasörüne taşıyın
8. Dosya adını `firebase-service-account.json` olarak değiştirin

```bash
# Dosya yapısı şöyle olmalı:
tuval.space/
├── firebase-service-account.json  ← Burası!
├── src/
├── scripts/
└── package.json
```

⚠️ **ÇOK ÖNEMLİ:** Bu dosya hassas bilgiler içerir! Asla Git'e commit etmeyin. Zaten `.gitignore`'a eklenmiştir.

### 2. Bağımlılıkları Kontrol Etme

Gerekli paketler zaten yüklendi:

```bash
pnpm install  # Eğer yeni clone ettiyseniz
```

### 3. İlk Çalıştırma

Tüm board'ların snapshot durumunu kontrol edin:

```bash
pnpm admin:update-snapshots --status
```

Çıktı örneği:
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

## 📖 Kullanım Örnekleri

### Tüm Board'ları Güncelle

```bash
pnpm admin:update-snapshots
```

Bu komut tüm board'ların snapshot'larını yeniden oluşturur. İlk kurulumda veya major değişikliklerden sonra kullanın.

### Sadece Eski Snapshot'ları Güncelle (Önerilen)

```bash
pnpm admin:update-snapshots --stale
```

24 saatten eski snapshot'ları günceller. Günlük rutin bakım için idealdir.

### Belirli Bir Board'u Güncelle

```bash
pnpm admin:update-snapshots --board=BOARD_ID
```

Board ID'sini `--status` komutu ile öğrenebilirsiniz.

### Yardım

```bash
pnpm admin:update-snapshots --help
```

## ⏰ Otomatik Güncelleme (Önerilen)

Snapshot'ların güncel kalması için otomatik güncelleme kurmanız önerilir.

### Windows Task Scheduler ile

1. **Task Scheduler**'ı açın (Görev Zamanlayıcı)
2. Sağ taraftan **Create Basic Task** (Temel Görev Oluştur) seçin
3. İsim: "Tuval.space Snapshot Update"
4. Trigger: **Daily** (Günlük), saat **03:00**
5. Action: **Start a program** (Program başlat)
6. Program/script: `C:\Program Files\nodejs\pnpm.cmd`
7. Add arguments: `admin:update-snapshots --stale`
8. Start in: `C:\O\GitHub\tuval.space`
9. **Finish** (Bitir)

### Linux/Mac Cron Job ile

```bash
# Crontab'ı düzenle
crontab -e

# Şu satırı ekle (her gün 03:00'te çalışır)
0 3 * * * cd /path/to/tuval.space && pnpm admin:update-snapshots --stale >> /tmp/snapshot-update.log 2>&1
```

### Manuel Çalıştırma

Herhangi bir zamanda manuel olarak çalıştırabilirsiniz:

```bash
# Hemen şimdi tüm stale snapshot'ları güncelle
pnpm admin:update-snapshots --stale
```

## 🔍 Nasıl Çalışır?

### Event Sourcing Pattern

Sistem **event sourcing** kullanır:

1. **Write (Pixel Placement):**
   - Kullanıcı pixel yerleştirdiğinde sadece `modifications` collection'a yazılır
   - Çok hızlı ve ucuz (1 write operation)

2. **Read (Board Display):**
   - Son snapshot load edilir
   - Snapshot'tan sonraki değişiklikler (delta) alınır
   - Delta snapshot üzerine uygulanır
   - Kullanıcıya gösterilir

3. **Snapshot Update (Bu Script):**
   - Tüm modifications replay edilir
   - Güncel durum hesaplanır
   - `pixels` collection'a yazılır
   - `lastSnapshotAt` timestamp güncellenir

### Snapshot Freshness

- **Fresh (Taze):** < 24 saat eski → Normal performans
- **Stale (Bayat):** > 24 saat eski → Daha fazla delta, biraz yavaş
- **Missing (Yok):** Snapshot yok → Tüm modifications replay edilir

## 📊 Performans

| Board Boyutu | Modification Sayısı | Süre (tahmini) |
|--------------|---------------------|----------------|
| 50x50        | ~100 batches        | 2-5 saniye     |
| 100x100      | ~500 batches        | 5-15 saniye    |
| 200x200      | ~2000 batches       | 15-30 saniye   |
| 500x500      | ~5000 batches       | 30-60 saniye   |

## 🐛 Sorun Giderme

### "Service account file not found"

**Sorun:** `firebase-service-account.json` bulunamıyor

**Çözüm:**
```bash
# Dosyanın doğru yerde olduğunu kontrol edin
ls firebase-service-account.json

# Eğer yoksa, Firebase Console'dan tekrar indirin
```

### "Permission denied"

**Sorun:** Service account yetkisi yok

**Çözüm:**
1. Firebase Console > Project Settings > Service Accounts
2. Service account'un **Firebase Admin SDK** rolüne sahip olduğunu kontrol edin
3. Gerekirse yeni bir key oluşturun

### "Board not found"

**Sorun:** Belirtilen board ID yanlış

**Çözüm:**
```bash
# Mevcut board'ları listele
pnpm admin:update-snapshots --status
```

### Script çalışmıyor

**Sorun:** TypeScript compile hatası

**Çözüm:**
```bash
# Bağımlılıkları yeniden yükle
pnpm install

# Manuel build dene
pnpm admin:build

# Hata mesajını kontrol et
```

## 🔒 Güvenlik

- ✅ `firebase-service-account.json` `.gitignore`'da
- ✅ Admin SDK sadece local'de çalışır
- ✅ Firestore Security Rules'ı bypass eder (admin yetkisi)
- ⚠️ Service account key'i kimseyle paylaşmayın
- ⚠️ Production database'de dikkatli kullanın

## 📝 Logging

Script çalışırken detaylı log verir:

```
🚀 Board Snapshot Updater

📋 Found 3 boards

🔄 Rebuilding snapshot for board: Main Canvas (abc123)
  📐 Dimensions: 100x100
  📝 Found 45 modification batches
  🎨 Applied 1,234 pixel modifications
  ✅ Snapshot updated successfully (100 rows)

📊 Summary:
  ✅ Updated: 2
  ⏭️  Skipped: 1

✨ Done!
```

Bu logları monitoring için kullanabilirsiniz.

## 🎯 Best Practices

1. **İlk kurulumda:** Tüm board'ları güncelle
   ```bash
   pnpm admin:update-snapshots
   ```

2. **Günlük bakımda:** Sadece stale olanları güncelle
   ```bash
   pnpm admin:update-snapshots --stale
   ```

3. **Problem durumunda:** Belirli board'u güncelle
   ```bash
   pnpm admin:update-snapshots --board=BOARD_ID
   ```

4. **Monitoring:** Düzenli olarak status kontrol et
   ```bash
   pnpm admin:update-snapshots --status
   ```

## 🔗 İlgili Dökümanlar

- [SNAPSHOT_DELTA_OPTIMIZATION.md](./SNAPSHOT_DELTA_OPTIMIZATION.md) - Teknik detaylar
- [scripts/admin/README.md](./scripts/admin/README.md) - Script detayları
- [EVENT_SOURCING_IMPLEMENTATION.md](./EVENT_SOURCING_IMPLEMENTATION.md) - Event sourcing açıklaması

## 💡 İpuçları

- Snapshot update işlemi read-heavy, write-heavy değil
- Firestore read maliyetini düşünün (özellikle büyük board'larda)
- Peak saatlerde (gündüz) değil, gece çalıştırın (03:00 ideal)
- İlk çalıştırmada tüm board'ları güncelleyin
- Sonrasında sadece `--stale` kullanın

## 🆘 Destek

Sorun yaşarsanız:

1. Bu dökümanı baştan sona okuyun
2. Sorun Giderme bölümünü kontrol edin
3. Log mesajlarını inceleyin
4. GitHub Issues'da sorun açın

---

**Hazırlayan:** Cursor AI Assistant
**Tarih:** Aralık 2025
**Versiyon:** 1.0








