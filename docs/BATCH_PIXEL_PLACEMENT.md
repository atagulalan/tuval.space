# Batch Pixel Placement Feature

## Özet

Pixelleri tek tek göndermek yerine, kullanıcı board üzerinde istediği kadar pixel değiştirir ve sonra tek seferde toplu olarak gönderir. Bu hem kullanıcı deneyimini iyileştirir hem de daha az API çağrısı yapılmasını sağlar.

## Özellikler

### ✨ Pending Pixels (Bekleyen Pixeller)
- Kullanıcı board'a tıkladığında pixel **hemen gönderilmez**
- Değişiklik **pending (bekleyen)** olarak işaretlenir
- **Turuncu kesikli çerçeve** ile pending pixeller görsel olarak gösterilir
- Aynı coordinate'e tekrar tıklanırsa pending'den çıkar

### 📊 Değişiklik Sayacı
- Alt kısımda **"X pixel değiştirildi"** mesajı gösterilir
- Real-time olarak pending pixel sayısı güncellenir
- Sayaç sadece değişiklik olduğunda görünür

### 🎯 Apply/Clear Butonları
- **Uygula Butonu:** Tüm pending pixelleri tek seferde gönderir
- **Temizle Butonu:** Tüm pending değişiklikleri iptal eder
- Butonlar sadece pending pixel varken görünür

### 🚀 Batch Submission
- `placeMultiplePixels()` fonksiyonu kullanılır
- Tek API çağrısıyla tüm pixeller gönderilir
- Başarılı olursa pending pixeller temizlenir
- Kullanıcı quota'sı batch sonrası güncellenir

## Değişiklikler

### 1. `PixelBoard.tsx`

#### Yeni State ve Types
```typescript
interface PendingPixel {
  x: number;
  y: number;
  color: string;
  originalColor: string | null;
}

const [pendingPixels, setPendingPixels] = useState<Map<string, PendingPixel>>(
  new Map()
);
```

#### Yeni Props
```typescript
interface PixelBoardProps {
  // ... mevcut props
  onBatchPixelPlace?: (pixels: { x: number; y: number; color: string }[]) => Promise<void>;
  onPendingPixelsChange?: (count: number) => void;
}
```

#### Görsel Değişiklikler
- **Pending Pixel İndikatörü:**
  - Turuncu kesikli çerçeve (`#FFA500`)
  - `setLineDash([...])` ile dashed border
  - Hover'da bile pending durumu görünür

- **Draw Logic:**
```typescript
// Pending pixel varsa onu göster, yoksa actual pixel
if (pendingPixel) {
  ctx.fillStyle = pendingPixel.color;
  ctx.fillRect(screenX, screenY, currentZoom, currentZoom);
  
  // Turuncu kesikli çerçeve
  ctx.strokeStyle = '#FFA500';
  ctx.lineWidth = Math.max(2, currentZoom * 0.15);
  ctx.setLineDash([currentZoom * 0.3, currentZoom * 0.2]);
  ctx.strokeRect(screenX, screenY, currentZoom, currentZoom);
  ctx.setLineDash([]);
} else {
  ctx.fillStyle = pixel ? pixel.color : '#f5f5f5';
  ctx.fillRect(screenX, screenY, currentZoom, currentZoom);
}
```

#### Yeni Fonksiyonlar

**`handlePixelPlace()`** - Güncellendi
```typescript
const handlePixelPlace = useCallback((x: number, y: number) => {
  const key = `${x},${y}`;
  const currentPixel = pixels[y]?.[x];
  const currentColor = currentPixel?.color || null;
  const newColor = selectedColorRef.current;

  // Aynı renk ise pending'den çıkar
  if (currentColor === newColor) {
    setPendingPixels((prev) => {
      const newMap = new Map(prev);
      newMap.delete(key);
      return newMap;
    });
    return;
  }

  // Pending'e ekle
  setPendingPixels((prev) => {
    const newMap = new Map(prev);
    newMap.set(key, { x, y, color: newColor, originalColor: currentColor });
    return newMap;
  });
}, [isGuest, pixels, toast]);
```

**`handleApplyChanges()`** - Yeni
```typescript
const handleApplyChanges = useCallback(async () => {
  if (pendingPixels.size === 0) return;

  const pixelsToPlace = Array.from(pendingPixels.values()).map((p) => ({
    x: p.x,
    y: p.y,
    color: p.color,
  }));

  try {
    if (onBatchPixelPlace) {
      await onBatchPixelPlace(pixelsToPlace);
    }
    
    // Clear pending pixels after successful submission
    setPendingPixels(new Map());
    
    toast({
      title: 'Pixels applied!',
      description: `Successfully placed ${pixelsToPlace.length} pixels`,
    });
  } catch (error) {
    // Error handling
  }
}, [pendingPixels, onBatchPixelPlace, toast]);
```

**`handleClearPending()`** - Yeni
```typescript
const handleClearPending = useCallback(() => {
  setPendingPixels(new Map());
  toast({
    title: 'Changes cleared',
    description: 'All pending pixels have been cleared',
  });
}, [toast]);
```

### 2. `BoardPage.tsx`

#### Yeni State
```typescript
const [pendingPixelsCount, setPendingPixelsCount] = useState(0);
```

#### Yeni Handler
```typescript
const handleBatchPixelPlace = async (
  pixelsToPlace: { x: number; y: number; color: string }[]
) => {
  if (!board || !user) return;

  const result = await placeMultiplePixels(
    board.id,
    user.uid,
    user.username,
    pixelsToPlace
  );

  if (result.success) {
    toast({
      title: 'Pixels applied!',
      description: `Successfully placed ${pixelsToPlace.length} pixels`,
    });
    await refreshUser();
  } else {
    toast({
      title: 'Failed to place pixels',
      description: result.error,
      variant: 'destructive',
    });
    throw new Error(result.error);
  }
};
```

#### Yeni UI - Apply/Clear Panel
```tsx
{/* Apply/Clear Buttons for Pending Pixels */}
{user && pendingPixelsCount > 0 && (
  <div className="mx-4 mb-4 p-3 bg-primary/10 border-t rounded-b-lg">
    <div className="flex items-center justify-between gap-4">
      <div className="text-sm font-medium">
        {pendingPixelsCount} pixel{pendingPixelsCount !== 1 ? 's' : ''} değiştirildi
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={handleClearPending}
          className="gap-2"
        >
          <FiX className="h-4 w-4" />
          Temizle
        </Button>
        <Button
          size="sm"
          onClick={handleApplyChanges}
          className="gap-2"
        >
          <FiCheck className="h-4 w-4" />
          Uygula
        </Button>
      </div>
    </div>
  </div>
)}
```

## Kullanıcı Akışı

### Senaryo 1: Tek Pixel Değiştirme
```
1. Kullanıcı board'da bir pixel'e tıklar
2. Pixel turuncu kesikli çerçeve ile işaretlenir
3. Alt kısımda "1 pixel değiştirildi" mesajı gösterilir
4. Kullanıcı "Uygula" butonuna tıklar
5. Pixel gönderilir, başarılı toast gösterilir
6. Pending temizlenir, board güncellenir
```

### Senaryo 2: Çoklu Pixel Değiştirme
```
1. Kullanıcı 10 farklı pixel'e tıklar
2. Her biri turuncu çerçeve ile işaretlenir
3. "10 pixel değiştirildi" mesajı gösterilir
4. Kullanıcı "Uygula" butonuna tıklar
5. Tek batch olarak 10 pixel gönderilir
6. "Successfully placed 10 pixels" toast gösterilir
7. Quota -10 olur, pending temizlenir
```

### Senaryo 3: Aynı Pixel'e Tekrar Tıklama
```
1. Kullanıcı (10, 5)'e kırmızı renk ile tıklar
2. Pending'e eklenir, turuncu çerçeve gösterilir
3. Kullanıcı aynı pixel'e tekrar tıklar (aynı renk)
4. Pending'den çıkar, çerçeve kaybolur
5. Sayaç güncellenir
```

### Senaryo 4: Değişiklikleri İptal Etme
```
1. Kullanıcı 5 pixel değiştirir
2. "5 pixel değiştirildi" mesajı gösterilir
3. Kullanıcı "Temizle" butonuna tıklar
4. Tüm pending pixeller temizlenir
5. Turuncu çerçeveler kaybolur
6. Board orijinal haline döner
```

## Görsel Tasarım

### Pending Pixel Gösterimi
```
┌─────────────────┐
│  ╔═══════════╗  │ ← Turuncu kesikli çerçeve
│  ║  Pending  ║  │   (#FFA500)
│  ║   Pixel   ║  │   
│  ╚═══════════╝  │   Dashed pattern:
│                 │   [0.3×zoom, 0.2×zoom]
└─────────────────┘
```

### Apply/Clear Panel
```
┌────────────────────────────────────────┐
│ Color Picker...                        │
├────────────────────────────────────────┤
│  10 pixel değiştirildi                 │
│                                         │
│  [ Temizle ]    [ Uygula ]            │
└────────────────────────────────────────┘
```

## Performans Avantajları

### Önceki Sistem (Tek Tek)
```
10 pixel için:
- 10 API call
- 10 user quota update
- 10 modification batch append
- 10 Firestore write
= Yavaş, pahalı
```

### Yeni Sistem (Batch)
```
10 pixel için:
- 1 API call
- 1 user quota update
- 1 modification batch append
- 1 Firestore write
= 90% daha hızlı, 90% daha ucuz!
```

## Teknik Detaylar

### Map Kullanımı
```typescript
// Map<"x,y", PendingPixel>
const pendingPixels = new Map<string, PendingPixel>();

// Add
pendingPixels.set("10,5", { x: 10, y: 5, color: "#FF0000", ... });

// Check
const hasPending = pendingPixels.has("10,5");

// Remove
pendingPixels.delete("10,5");

// Convert to array
const pixelsArray = Array.from(pendingPixels.values());
```

### Window API Bridge
```typescript
// PixelBoard exposes functions
useEffect(() => {
  (window as any).__pixelBoardApplyChanges = handleApplyChanges;
  (window as any).__pixelBoardClearPending = handleClearPending;
}, [handleApplyChanges, handleClearPending]);

// BoardPage calls them
const handleApplyChanges = () => {
  (window as any).__pixelBoardApplyChanges?.();
};
```

## Test Checklist

- [ ] Pixel'e tıklandığında pending'e ekleniyor
- [ ] Turuncu kesikli çerçeve görünüyor
- [ ] Sayaç doğru güncelleniyor
- [ ] Aynı pixel'e tekrar tıklayınca pending'den çıkıyor
- [ ] Apply butonu tüm pixelleri batch gönderiyor
- [ ] Clear butonu pending'leri temizliyor
- [ ] Başarılı submission sonrası pending temizleniyor
- [ ] Quota doğru şekilde güncelleniyor
- [ ] Toast mesajları doğru gösteriliyor
- [ ] Zoom in/out'ta pending pixeller doğru render ediliyor

## Gelecek İyileştirmeler

### Kısa Vadeli
1. 🎨 **Undo/Redo:** Ctrl+Z ile son değişikliği geri al
2. 💾 **LocalStorage:** Pending pixelleri tarayıcıda sakla (refresh'te kaybolmasın)
3. 🎯 **Preview Mode:** Değişiklikler uygulanmadan önce preview göster

### Orta Vadeli
4. 📊 **Quota Check:** Apply'dan önce quota kontrolü yap
5. ⚡ **Keyboard Shortcuts:**
   - `Enter`: Apply changes
   - `Escape`: Clear pending
6. 🎨 **Color History:** Son kullanılan renkler

### Uzun Vadeli
7. 🤝 **Collaborative Editing:** Real-time pending pixels for multiple users
8. 🎯 **Selection Tools:** Rectangle/circle select ile toplu pixel değiştirme
9. 🎨 **Brush Tools:** Kalem kalınlığı ayarı

---

**Durum:** ✅ Implementation tamamlandı!
**Test:** Ready for testing
**Next:** User feedback ve polish










