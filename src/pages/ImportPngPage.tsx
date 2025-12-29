import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { createBoard } from '@/services/board.service';
import { addBoardToUser, canUserCreateBoard } from '@/services/user.service';
import { placeMultiplePixels } from '@/services/pixel.service';
import { validateBoardName } from '@/lib/utils';
import { logPageView } from '@/services/analytics.service';
import { useToast } from '@/hooks/use-toast';
import { useEffect } from 'react';
import { Loading } from '@/components/Loading';

// Convert hex color to RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16),
  ];
}

// Calculate Euclidean distance between two RGB colors
function colorDistance(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

// Find the closest palette color for a given RGB color
function findClosestPaletteColor(
  rgb: [number, number, number],
  palette: { colors: string[] }
): string {
  let closestColor = palette.colors[0];
  let minDistance = Infinity;

  for (const hexColor of palette.colors) {
    const paletteRgb = hexToRgb(hexColor);
    const distance = colorDistance(rgb, paletteRgb);
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = hexColor;
    }
  }

  return closestColor;
}

export const ImportPngPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [boardName, setBoardName] = useState('');
  const [pixelArray, setPixelArray] = useState<string[][] | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [imagePalette, setImagePalette] = useState<string[] | null>(null);
  const [draggedColorIndex, setDraggedColorIndex] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    logPageView('Import PNG Page');
  }, []);

  // K-means clustering to reduce colors to 8
  const kMeans = (colors: string[], k: number, maxIterations = 10): string[] => {
    if (colors.length <= k) {
      return colors;
    }

    // Convert colors to RGB
    const colorRgbs = colors.map((color) => hexToRgb(color));

    // Initialize centroids randomly
    const centroids: [number, number, number][] = [];
    const indices = new Set<number>();
    while (indices.size < k && indices.size < colors.length) {
      const idx = Math.floor(Math.random() * colors.length);
      indices.add(idx);
    }
    indices.forEach((idx) => {
      centroids.push([...colorRgbs[idx]]);
    });

    // K-means iterations
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      // Assign each color to nearest centroid
      const clusters: number[][] = Array(k).fill(0).map(() => []);
      
      colorRgbs.forEach((rgb, idx) => {
        let minDistance = Infinity;
        let nearestCentroid = 0;
        
        centroids.forEach((centroid, cIdx) => {
          const distance = colorDistance(rgb, centroid);
          if (distance < minDistance) {
            minDistance = distance;
            nearestCentroid = cIdx;
          }
        });
        
        clusters[nearestCentroid].push(idx);
      });

      // Update centroids (average of assigned colors)
      let centroidsChanged = false;
      clusters.forEach((cluster, cIdx) => {
        if (cluster.length === 0) return; // Skip empty clusters
        
        let sumR = 0, sumG = 0, sumB = 0;
        cluster.forEach((colorIdx) => {
          const rgb = colorRgbs[colorIdx];
          sumR += rgb[0];
          sumG += rgb[1];
          sumB += rgb[2];
        });
        
        const newCentroid: [number, number, number] = [
          Math.round(sumR / cluster.length),
          Math.round(sumG / cluster.length),
          Math.round(sumB / cluster.length),
        ];
        
        // Check if centroid changed
        const oldCentroid = centroids[cIdx];
        if (colorDistance(oldCentroid, newCentroid) > 0.1) {
          centroidsChanged = true;
        }
        
        centroids[cIdx] = newCentroid;
      });

      // If centroids didn't change, we've converged
      if (!centroidsChanged) {
        break;
      }
    }

    // Convert centroids back to hex colors
    return centroids.map((centroid) => {
      const [r, g, b] = centroid;
      return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    });
  };

  // Extract unique colors from image
  const extractImageColors = (image: HTMLImageElement): string[] => {
    const width = image.width;
    const height = image.height;

    // Create temporary canvas to read pixel data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('Canvas context alınamadı');
    }

    // Draw image to canvas
    tempCtx.drawImage(image, 0, 0);

    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Collect unique colors
    const colorSet = new Set<string>();
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];
        
        // Skip fully transparent pixels
        if (a < 128) continue;
        
        // Convert to hex
        const hex = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
        colorSet.add(hex);
      }
    }

    // Convert to array
    return Array.from(colorSet);
  };

  // Draw preview when pixelArray or imageDimensions change
  useEffect(() => {
    if (pixelArray && imageDimensions && previewCanvasRef.current) {
      const canvas = previewCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const { width, height } = imageDimensions;
        canvas.width = width;
        canvas.height = height;

        // Create ImageData from pixelArray
        const imageData = new ImageData(width, height);
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const color = pixelArray[y][x];
            const rgb = hexToRgb(color);
            imageData.data[idx] = rgb[0];
            imageData.data[idx + 1] = rgb[1];
            imageData.data[idx + 2] = rgb[2];
            imageData.data[idx + 3] = 255;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      }
    }
  }, [pixelArray, imageDimensions]);

  const processImage = async (image: HTMLImageElement) => {
    const width = image.width;
    const height = image.height;

    setImageDimensions({ width, height });

    // Extract unique colors from image
    const uniqueColors = extractImageColors(image);
    
    // Reduce to 8 colors using k-means
    const reducedPalette = kMeans(uniqueColors, 8);
    setImagePalette(reducedPalette);

    // Create palette object for color matching
    const palette = {
      colors: reducedPalette,
    };

    // Create temporary canvas to read pixel data
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = width;
    tempCanvas.height = height;
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      throw new Error('Canvas context alınamadı');
    }

    // Draw image to canvas
    tempCtx.drawImage(image, 0, 0);

    // Get pixel data
    const imageData = tempCtx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Process each pixel
    const outputArray: string[][] = [];
    const outputImageData = new ImageData(width, height);

    for (let y = 0; y < height; y++) {
      const row: string[] = [];
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3];

        let color: string;
        let rgb: [number, number, number];

        // Skip fully transparent pixels (use white as background)
        if (a < 128) {
          color = '#FFFFFF';
          rgb = [255, 255, 255];
        } else {
          // Find closest palette color from reduced palette
          color = findClosestPaletteColor([r, g, b], palette);
          rgb = hexToRgb(color);
        }

        // Set output pixel
        outputImageData.data[idx] = rgb[0];
        outputImageData.data[idx + 1] = rgb[1];
        outputImageData.data[idx + 2] = rgb[2];
        outputImageData.data[idx + 3] = 255; // Full opacity

        row.push(color);
      }
      outputArray.push(row);
    }

    setPixelArray(outputArray);
    // Canvas drawing will be handled by useEffect
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an image file
    if (!file.type.startsWith('image/')) {
      setError('Lütfen bir resim dosyası seçin (jpg, png, vb.)');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setPixelArray(null);
    setImageDimensions(null);
    setImagePalette(null);

    try {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        image.onload = () => {
          resolve();
        };
        image.onerror = () => {
          reject(new Error('Resim yüklenemedi'));
        };
        image.src = imageUrl;
      });

      await processImage(image);

      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resim işlenirken bir hata oluştu');
      setPixelArray(null);
      setImageDimensions(null);
      setImagePalette(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateBoard = async () => {
    if (!user) {
      setError('Lütfen önce giriş yapın');
      navigate('/login');
      return;
    }

    if (!pixelArray || !imageDimensions) {
      setError('Lütfen önce bir resim yükleyin');
      return;
    }

    const nameValidation = validateBoardName(boardName);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Geçersiz board adı');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      // Check if user can create board
      const canCreate = await canUserCreateBoard(user.uid);
      if (!canCreate) {
        setError('Maksimum board sayısına ulaştınız');
        setIsCreating(false);
        return;
      }

      // Create board with custom palette
      const board = await createBoard(
        user.uid,
        user.username,
        boardName,
        imageDimensions.width,
        imageDimensions.height,
        true, // isPublic
        false, // isSpecialEvent
        undefined, // specialEventPixels
        imagePalette || undefined // customPalette (convert null to undefined)
      );

      // Add board to user
      await addBoardToUser(user.uid, board);

      // Prepare pixels for placement
      const pixelsToPlace: { x: number; y: number; color: string }[] = [];
      for (let y = 0; y < pixelArray.length; y++) {
        for (let x = 0; x < pixelArray[y].length; x++) {
          const color = pixelArray[y][x];
          // Skip white pixels (background)
          if (color !== '#FFFFFF') {
            pixelsToPlace.push({ x, y, color });
          }
        }
      }

      // Place pixels on board
      if (pixelsToPlace.length > 0) {
        const result = await placeMultiplePixels(
          board.id,
          user.uid,
          user.username,
          pixelsToPlace
        );

        if (!result.success) {
          throw new Error(result.error || 'Pixel yerleştirme hatası');
        }
      }

      toast({
        title: 'Board oluşturuldu!',
        description: `"${boardName}" başarıyla oluşturuldu ve ${pixelsToPlace.length} pixel yerleştirildi.`,
      });

      // Navigate to board
      navigate(`/board/${board.name}`);
    } catch (err) {
      console.error('Board creation error:', err);
      setError(err instanceof Error ? err.message : 'Board oluşturulurken bir hata oluştu');
    } finally {
      setIsCreating(false);
    }
  };

  if (authLoading) {
    return <Loading />;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background-dark text-white font-['Space_Grotesk',sans-serif]">
        <header className="sticky top-0 z-50 w-full border-b border-solid border-border-dark bg-background-dark/80 backdrop-blur-md">
          <div className="flex items-center justify-between whitespace-nowrap px-4 py-3 max-w-[1200px] mx-auto w-full">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
              <img src="/logo.svg" alt="tuval.space logo" className="size-8" />
              <h2 className="text-lg font-bold leading-tight tracking-tight">tuval.space</h2>
            </div>
            <Button variant="ghost" onClick={() => navigate('/login')}>
              Giriş Yap
            </Button>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <h1 className="text-3xl font-bold mb-4">Giriş Gerekli</h1>
          <p className="text-muted-foreground mb-8">
            PNG yükleyerek board oluşturmak için lütfen giriş yapın.
          </p>
          <Button onClick={() => navigate('/login')}>Giriş Yap</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-dark text-white font-['Space_Grotesk',sans-serif]">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-solid border-border-dark bg-background-dark/80 backdrop-blur-md">
        <div className="flex items-center justify-between whitespace-nowrap px-4 py-3 max-w-[1200px] mx-auto w-full">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.svg" alt="tuval.space logo" className="size-8" />
            <h2 className="text-lg font-bold leading-tight tracking-tight">tuval.space</h2>
          </div>
          <Button variant="ghost" onClick={() => navigate('/')}>
            Ana Sayfa
          </Button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">PNG'den Board Oluştur</h1>
          <p className="text-muted-foreground">
            Bir PNG resmi yükleyin ve otomatik olarak bir board oluşturun
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-input">PNG Dosyası</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleFileSelect}
                    disabled={isProcessing || isCreating}
                    className="flex-1"
                  />
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
                {isProcessing && (
                  <p className="text-sm text-muted-foreground mt-2">İşleniyor...</p>
                )}
              </div>

              {pixelArray && imageDimensions && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="board-name">Board Adı</Label>
                    <Input
                      id="board-name"
                      type="text"
                      placeholder="örnek: my-artwork"
                      value={boardName}
                      onChange={(e) => setBoardName(e.target.value)}
                      disabled={isCreating}
                    />
                    <p className="text-xs text-muted-foreground">
                      3-30 karakter, sadece harf, rakam, tire ve alt çizgi
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Boyutlar</Label>
                    <p className="text-sm text-muted-foreground">
                      {imageDimensions.width} × {imageDimensions.height} piksel
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Toplam: {imageDimensions.width * imageDimensions.height} piksel
                    </p>
                  </div>

                  {imagePalette && (
                    <div className="space-y-2">
                      <Label>Palet (8 Renk) - Sürükleyerek sıralayın</Label>
                      <div className="flex flex-wrap gap-1.5 p-2 rounded-lg bg-slate-800 border border-slate-700">
                        {imagePalette.map((color, idx) => (
                          <div
                            key={idx}
                            draggable
                            onDragStart={() => setDraggedColorIndex(idx)}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.dataTransfer.dropEffect = 'move';
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              if (draggedColorIndex !== null && draggedColorIndex !== idx) {
                                const newPalette = [...imagePalette];
                                const [removed] = newPalette.splice(draggedColorIndex, 1);
                                newPalette.splice(idx, 0, removed);
                                setImagePalette(newPalette);
                                
                                // Update pixel array with new palette order
                                if (pixelArray) {
                                  const updatedArray = pixelArray.map((row) =>
                                    row.map((oldColor) => {
                                      // Find old index
                                      const oldIndex = imagePalette.indexOf(oldColor);
                                      if (oldIndex === -1) return oldColor;
                                      
                                      // Map to new index
                                      let newIndex = oldIndex;
                                      if (draggedColorIndex < idx) {
                                        // Moving forward
                                        if (oldIndex === draggedColorIndex) {
                                          newIndex = idx;
                                        } else if (oldIndex > draggedColorIndex && oldIndex <= idx) {
                                          newIndex = oldIndex - 1;
                                        }
                                      } else {
                                        // Moving backward
                                        if (oldIndex === draggedColorIndex) {
                                          newIndex = idx;
                                        } else if (oldIndex >= idx && oldIndex < draggedColorIndex) {
                                          newIndex = oldIndex + 1;
                                        }
                                      }
                                      
                                      return newPalette[newIndex];
                                    })
                                  );
                                  setPixelArray(updatedArray);
                                }
                              }
                              setDraggedColorIndex(null);
                            }}
                            onDragEnd={() => setDraggedColorIndex(null)}
                            className={`w-8 h-8 rounded border-2 cursor-move transition-transform ${
                              draggedColorIndex === idx
                                ? 'border-primary opacity-50 scale-110'
                                : 'border-slate-600 hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                            title={`${idx}: ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleCreateBoard}
                    disabled={isCreating || !boardName.trim()}
                    className="w-full"
                  >
                    {isCreating ? 'Oluşturuluyor...' : 'Board Oluştur'}
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <div>
              <Label>Ön İzleme</Label>
              <div className="mt-2 border border-slate-700 rounded-lg p-4 bg-slate-900 overflow-auto max-h-[600px] flex items-center justify-center">
                <canvas
                  ref={previewCanvasRef}
                  className="border border-slate-600 rounded"
                  style={{
                    imageRendering: 'pixelated',
                    maxWidth: '100%',
                    height: 'auto',
                    display: pixelArray ? 'block' : 'none',
                  }}
                />
                {!pixelArray && (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="mb-2">Henüz resim yüklenmedi</p>
                    <p className="text-sm">PNG dosyası seçin</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

