import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { COLOR_PALETTES, getPaletteById, type ColorPalette } from '@/components/ColorPicker';
import { logPageView } from '@/services/analytics.service';

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
  palette: ColorPalette
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

export const ImportPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalImageRef = useRef<HTMLImageElement | null>(null);
  
  const [selectedPaletteId, setSelectedPaletteId] = useState<string>('classic');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pixelArray, setPixelArray] = useState<string[][] | null>(null);
  const [originalPixelArray, setOriginalPixelArray] = useState<string[][] | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [zoomLevel, setZoomLevel] = useState(2);
  const [colorMapping, setColorMapping] = useState<Map<string, string>>(new Map());
  const [uniqueColors, setUniqueColors] = useState<string[]>([]);
  const [showColorMapping, setShowColorMapping] = useState(false);
  const [customPaletteName, setCustomPaletteName] = useState('');
  const [imagePalette, setImagePalette] = useState<ColorPalette | null>(null);
  const [reducedImagePalette, setReducedImagePalette] = useState<ColorPalette | null>(null);
  const [draggedColor, setDraggedColor] = useState<string | null>(null);
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null);

  useEffect(() => {
    logPageView('Import Page');
  }, []);

  useEffect(() => {
    if (pixelArray && previewCanvasRef.current) {
      drawPreview();
    }
  }, [pixelArray, zoomLevel, colorMapping]);

  // Extract unique colors from originalPixelArray (only once, when image is first processed)
  useEffect(() => {
    if (originalPixelArray && uniqueColors.length === 0) {
      const unique = Array.from(new Set(originalPixelArray.flat()));
      setUniqueColors(unique.sort());
    }
  }, [originalPixelArray]);

  // Update color mapping when palette changes (but keep uniqueColors unchanged)
  // Skip mapping if image-palette is selected (original colors are used)
  useEffect(() => {
    if (uniqueColors.length > 0 && originalPixelArray) {
      // If image-palette is selected, use identity mapping (no color conversion needed)
      if (selectedPaletteId === 'image-palette') {
        const identityMapping = new Map<string, string>();
        uniqueColors.forEach((color) => {
          identityMapping.set(color, color);
        });
        setColorMapping(identityMapping);
        // Pixel array is already correct (original colors), no need to update
        return;
      }

      const palette = selectedPaletteId === 'image-palette-reduced'
        ? reducedImagePalette
        : getPaletteById(selectedPaletteId);
      
      if (palette) {
        // Map each unique color to closest palette color
        const newMapping = new Map<string, string>();
        uniqueColors.forEach((originalColor) => {
          const rgb = hexToRgb(originalColor);
          const closestPaletteColor = findClosestPaletteColor(rgb, palette);
          newMapping.set(originalColor, closestPaletteColor);
        });
        setColorMapping(newMapping);
        
        // Update pixel array with mappings
        const updatedArray = originalPixelArray.map((row) =>
          row.map((color) => newMapping.get(color) || color)
        );
        setPixelArray(updatedArray);
      }
    }
  }, [selectedPaletteId, imagePalette, reducedImagePalette, uniqueColors, originalPixelArray]);

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
    setOriginalPixelArray(null);
    setImageDimensions(null);
    setColorMapping(new Map());
    setUniqueColors([]);
    setShowColorMapping(false);
    setImagePalette(null);
    setReducedImagePalette(null);

    try {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve, reject) => {
        image.onload = () => {
          originalImageRef.current = image;
          resolve();
        };
        image.onerror = () => {
          reject(new Error('Resim yüklenemedi'));
        };
        image.src = imageUrl;
      });

      // Extract image palette first
      const extractedPalette = extractImagePalette(image);
      setImagePalette(extractedPalette);

      // Process image with image palette (use original colors from image)
      setSelectedPaletteId('image-palette');
      await processImageWithCustomPalette(image, extractedPalette, true);

      URL.revokeObjectURL(imageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Resim işlenirken bir hata oluştu');
      setPixelArray(null);
      setImageDimensions(null);
    } finally {
      setIsProcessing(false);
    }
  };

  // Extract unique colors from image and create custom palette
  const extractImagePalette = (image: HTMLImageElement): ColorPalette => {
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

    // Convert to sorted array
    const colors = Array.from(colorSet).sort();

    return {
      id: 'image-palette',
      name: 'Görsel Paleti',
      colors: colors,
    };
  };

  const processImageWithCustomPalette = async (image: HTMLImageElement, palette: ColorPalette, useOriginalColors = false) => {
    const width = image.width;
    const height = image.height;

    setImageDimensions({ width, height });

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

        if (useOriginalColors) {
          // Use original color directly
          color = `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
          rgb = [r, g, b];
        } else {
          // Find closest palette color
          color = findClosestPaletteColor([r, g, b], palette);
          rgb = hexToRgb(color);
        }

        // Set output pixel
        outputImageData.data[idx] = rgb[0];
        outputImageData.data[idx + 1] = rgb[1];
        outputImageData.data[idx + 2] = rgb[2];
        outputImageData.data[idx + 3] = a; // Preserve alpha

        row.push(color);
      }
      outputArray.push(row);
    }

    setPixelArray(outputArray);
    setOriginalPixelArray(outputArray.map((row) => [...row])); // Deep copy

    // Draw to preview canvas
    if (previewCanvasRef.current) {
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext('2d');
      if (previewCtx) {
        previewCanvas.width = width;
        previewCanvas.height = height;
        previewCtx.putImageData(outputImageData, 0, 0);
      }
    }
  };

  // Unused function - kept for potential future use
  // @ts-expect-error - Unused function kept for potential future use
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _processImage = async (image: HTMLImageElement, paletteId: string) => {
    const palette = getPaletteById(paletteId);
    if (!palette) {
      throw new Error(`Palet bulunamadı: ${paletteId}`);
    }

    const width = image.width;
    const height = image.height;

    setImageDimensions({ width, height });

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

        // Find closest palette color
        const closestColor = findClosestPaletteColor([r, g, b], palette);
        const closestRgb = hexToRgb(closestColor);

        // Set output pixel
        outputImageData.data[idx] = closestRgb[0];
        outputImageData.data[idx + 1] = closestRgb[1];
        outputImageData.data[idx + 2] = closestRgb[2];
        outputImageData.data[idx + 3] = a; // Preserve alpha

        row.push(closestColor);
      }
      outputArray.push(row);
    }

    setPixelArray(outputArray);
    setOriginalPixelArray(outputArray.map((row) => [...row])); // Deep copy

    // Draw to preview canvas
    if (previewCanvasRef.current) {
      const previewCanvas = previewCanvasRef.current;
      const previewCtx = previewCanvas.getContext('2d');
      if (previewCtx) {
        previewCanvas.width = width;
        previewCanvas.height = height;
        previewCtx.putImageData(outputImageData, 0, 0);
      }
    }
  };

  const drawPreview = () => {
    if (!pixelArray || !previewCanvasRef.current || !imageDimensions) return;

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = imageDimensions;
    const displayWidth = width * zoomLevel;
    const displayHeight = height * zoomLevel;

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Use nearest neighbor scaling for pixelated effect
    ctx.imageSmoothingEnabled = false;

    // Draw each pixel scaled with color mapping applied
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const originalColor = pixelArray[y][x];
        const mappedColor = colorMapping.get(originalColor) || originalColor;
        ctx.fillStyle = mappedColor;
        ctx.fillRect(x * zoomLevel, y * zoomLevel, zoomLevel, zoomLevel);
      }
    }
  };

  // Get color mappings: original color => mapped color (only calculate when menu is open)
  const colorMappings = useMemo(() => {
    if (!showColorMapping) return [];
    return uniqueColors.map((originalColor) => ({
      originalColor,
      mappedColor: colorMapping.get(originalColor) || originalColor,
    })).sort((a, b) => a.originalColor.localeCompare(b.originalColor));
  }, [showColorMapping, uniqueColors, colorMapping]);

  // Handle single color mapping change
  const handleColorMappingChange = (originalColor: string, newColor: string) => {
    const newMapping = new Map(colorMapping);
    newMapping.set(originalColor, newColor);
    setColorMapping(newMapping);
    
    // Update pixel array with all mappings applied
    if (originalPixelArray) {
      const updatedArray = originalPixelArray.map((row) =>
        row.map((color) => {
          return newMapping.get(color) || color;
        })
      );
      setPixelArray(updatedArray);
    }
  };

  // Handle drag and drop
  const handleDragStart = (color: string) => {
    setDraggedColor(color);
  };

  const handleDragEnd = () => {
    setDraggedColor(null);
    setDragOverGroup(null);
  };

  const handleDragOver = (e: React.DragEvent, groupKey: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverGroup(groupKey);
  };

  const handleDragLeave = () => {
    setDragOverGroup(null);
  };

  const handleDrop = (originalColor: string) => {
    if (draggedColor) {
      handleColorMappingChange(originalColor, draggedColor);
    }
    setDraggedColor(null);
    setDragOverGroup(null);
  };

  const handleResetColorMapping = () => {
    if (originalPixelArray && uniqueColors.length > 0) {
      const palette = selectedPaletteId === 'image-palette' 
        ? imagePalette 
        : selectedPaletteId === 'image-palette-reduced'
        ? reducedImagePalette
        : getPaletteById(selectedPaletteId);
      
      if (palette) {
        // Reset mapping to closest palette colors
        const newMapping = new Map<string, string>();
        uniqueColors.forEach((originalColor) => {
          const rgb = hexToRgb(originalColor);
          const closestPaletteColor = findClosestPaletteColor(rgb, palette);
          newMapping.set(originalColor, closestPaletteColor);
        });
        setColorMapping(newMapping);
        
        // Update pixel array with mappings
        const updatedArray = originalPixelArray.map((row) =>
          row.map((color) => newMapping.get(color) || color)
        );
        setPixelArray(updatedArray);
      } else {
        // Fallback: identity mapping
        const newMapping = new Map<string, string>();
        uniqueColors.forEach((color) => {
          newMapping.set(color, color);
        });
        setColorMapping(newMapping);
        setPixelArray(originalPixelArray.map((row) => [...row]));
      }
    }
  };

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

  // Reduce colors to 8 using k-means
  const reduceTo8Colors = (colors: string[]): string[] => {
    return kMeans(colors, 8);
  };

  const handleCreateReducedPalette = () => {
    if (!imagePalette) {
      setError('Görsel yüklenmemiş');
      return;
    }

    // Reduce image palette to 8 colors
    const reducedColors = reduceTo8Colors(imagePalette.colors);

    // Create new reduced image palette
    const reducedPalette: ColorPalette = {
      id: 'image-palette-reduced',
      name: 'Görsel Paleti (8 Renk)',
      colors: reducedColors,
    };

    // Add as new palette (don't replace imagePalette)
    setReducedImagePalette(reducedPalette);

    // Automatically select and apply the reduced palette
    handlePaletteChange('image-palette-reduced');
  };

  const handleCreateCustomPalette = () => {
    if (!customPaletteName.trim()) {
      setError('Lütfen bir palet ismi girin');
      return;
    }

    const mappedColors = Array.from(new Set(colorMapping.values()));
    
    if (mappedColors.length === 0) {
      setError('En az bir renk olmalı');
      return;
    }

    const customPalette: ColorPalette = {
      id: `custom-${Date.now()}`,
      name: customPaletteName.trim(),
      colors: mappedColors,
    };

    // Download as JSON
    const jsonContent = JSON.stringify(customPalette, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette-${customPalette.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setError(null);
    setCustomPaletteName('');
  };

  const handlePaletteChange = (newPaletteId: string) => {
    if (!originalPixelArray || uniqueColors.length === 0) return;

    setSelectedPaletteId(newPaletteId);
    
    const palette = newPaletteId === 'image-palette' 
      ? imagePalette 
      : newPaletteId === 'image-palette-reduced'
      ? reducedImagePalette
      : getPaletteById(newPaletteId);
    
    if (palette) {
      // Map each unique color to closest palette color
      const newMapping = new Map<string, string>();
      uniqueColors.forEach((originalColor) => {
        const rgb = hexToRgb(originalColor);
        const closestPaletteColor = findClosestPaletteColor(rgb, palette);
        newMapping.set(originalColor, closestPaletteColor);
      });
      setColorMapping(newMapping);
      
      // Update pixel array with mappings
      const updatedArray = originalPixelArray.map((row) =>
        row.map((color) => newMapping.get(color) || color)
      );
      setPixelArray(updatedArray);
    }
  };

  const handleDownloadPNG = () => {
    if (!previewCanvasRef.current) return;

    previewCanvasRef.current.toBlob((blob) => {
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const palette = selectedPaletteId === 'image-palette' 
        ? imagePalette 
        : selectedPaletteId === 'image-palette-reduced'
        ? reducedImagePalette
        : getPaletteById(selectedPaletteId);
      const paletteName = palette?.id || 'custom';
      a.download = `image-${paletteName}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  };

  const handleDownloadJSON = () => {
    if (!pixelArray) return;

    const jsonContent = JSON.stringify(pixelArray, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const palette = selectedPaletteId === 'image-palette' 
      ? imagePalette 
      : selectedPaletteId === 'image-palette-reduced'
      ? reducedImagePalette
      : getPaletteById(selectedPaletteId);
    const paletteName = palette?.id || 'custom';
    a.download = `image-${paletteName}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setPixelArray(null);
    setOriginalPixelArray(null);
    setImageDimensions(null);
    setError(null);
    setColorMapping(new Map());
    setUniqueColors([]);
    setShowColorMapping(false);
    setCustomPaletteName('');
    setImagePalette(null);
    originalImageRef.current = null;
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (previewCanvasRef.current) {
      const ctx = previewCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, previewCanvasRef.current.width, previewCanvasRef.current.height);
      }
    }
  };

  const dimensions = imageDimensions
    ? `${imageDimensions.width} × ${imageDimensions.height}`
    : '—';

  const selectedPalette = selectedPaletteId === 'image-palette' 
    ? imagePalette 
    : selectedPaletteId === 'image-palette-reduced'
    ? reducedImagePalette
    : getPaletteById(selectedPaletteId);

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Resim Palete Uydurma</h1>
          <p className="text-muted-foreground">
            Bir resim yükleyin ve tuval.space renk paletlerinden birine uydurun
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Controls */}
          <div className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-input">Resim Dosyası</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="file-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                    className="flex-1"
                  />
                  {pixelArray && (
                    <Button variant="outline" onClick={handleClear} disabled={isProcessing}>
                      Temizle
                    </Button>
                  )}
                </div>
                {error && (
                  <p className="text-sm text-destructive mt-2">{error}</p>
                )}
                {isProcessing && (
                  <p className="text-sm text-muted-foreground mt-2">İşleniyor...</p>
                )}
              </div>

              {pixelArray && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Renk Eşleme</Label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowColorMapping(!showColorMapping)}
                      >
                        {showColorMapping ? 'Gizle' : 'Göster'}
                      </Button>
                    </div>
                    {showColorMapping && uniqueColors.length > 0 && (
                      <div className="space-y-4 p-4 rounded-lg bg-slate-800 border border-slate-700 max-h-[600px] overflow-y-auto">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium">
                            Renk Eşlemeleri ({uniqueColors.length} renk)
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleResetColorMapping}
                          >
                            Sıfırla
                          </Button>
                        </div>

                        {/* Palette Colors - Drag Source */}
                        {selectedPalette && (
                          <div className="mb-4 pb-4 border-b border-slate-700">
                            <Label className="text-xs mb-2 block">Yeni Palet Renkleri (Sürükle)</Label>
                            <div className="flex flex-wrap gap-2">
                              {selectedPalette.colors.map((color) => (
                                <div
                                  key={color}
                                  draggable
                                  onDragStart={() => handleDragStart(color)}
                                  onDragEnd={handleDragEnd}
                                  className={`w-10 h-10 rounded border-2 cursor-move hover:scale-110 transition-transform ${
                                    draggedColor === color
                                      ? 'border-primary opacity-50'
                                      : 'border-slate-600'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  title={`${color} - Sürükle ve bırak`}
                                />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Color Mappings - Drop Target */}
                        <div className="space-y-3">
                          {colorMappings.map((mapping) => {
                            const mappingKey = mapping.originalColor;
                            const isDragOver = dragOverGroup === mappingKey;
                            return (
                              <div
                                key={mappingKey}
                                onDragOver={(e) => handleDragOver(e, mappingKey)}
                                onDragLeave={handleDragLeave}
                                onDrop={() => handleDrop(mapping.originalColor)}
                                className={`p-3 rounded border-2 border-dashed bg-slate-900 transition-all ${
                                  isDragOver
                                    ? 'border-primary bg-primary/10'
                                    : 'border-slate-600 hover:border-slate-500'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Original Color (Eski Renk) */}
                                  <div className="flex items-center gap-2">
                                    <div
                                      className="w-12 h-12 rounded border-2 border-slate-600 flex-shrink-0"
                                      style={{ backgroundColor: mapping.originalColor }}
                                      title={mapping.originalColor}
                                    />
                                    <div>
                                      <p className="text-xs font-medium mb-0.5">Eski Renk</p>
                                      <p className="text-xs font-mono text-muted-foreground">{mapping.originalColor}</p>
                                    </div>
                                  </div>

                                  {/* Arrow */}
                                  <span className="text-slate-400 text-xl">→</span>

                                  {/* Mapped Color (Yeni Renk) */}
                                  <div className="flex items-center gap-2 flex-1">
                                    <div
                                      className="w-12 h-12 rounded border-2 border-slate-600 flex-shrink-0"
                                      style={{ backgroundColor: mapping.mappedColor }}
                                      title={mapping.mappedColor}
                                    />
                                    <div className="flex-1">
                                      <p className="text-xs font-medium mb-0.5">Yeni Renk</p>
                                      <p className="text-xs font-mono text-muted-foreground">{mapping.mappedColor}</p>
                                    </div>
                                    <Input
                                      type="color"
                                      value={mapping.mappedColor}
                                      onChange={(e) => handleColorMappingChange(mapping.originalColor, e.target.value)}
                                      className="w-16 h-10 cursor-pointer"
                                    />
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-700">
                          <Label>Özel Palet Oluştur</Label>
                          <div className="flex gap-2 mt-2">
                            <Input
                              type="text"
                              placeholder="Palet ismi..."
                              value={customPaletteName}
                              onChange={(e) => setCustomPaletteName(e.target.value)}
                              className="flex-1"
                            />
                            <Button
                              onClick={handleCreateCustomPalette}
                              disabled={!customPaletteName.trim()}
                            >
                              Kaydet
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tüm renk eşlemelerini içeren özel palet oluşturur
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Boyutlar</Label>
                    <p className="text-sm text-muted-foreground">{dimensions} piksel</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Yakınlaştırma</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="range"
                        min="1"
                        max="10"
                        step="1"
                        value={zoomLevel}
                        onChange={(e) => setZoomLevel(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm w-16 text-right">{zoomLevel}x</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Renk Paleti</Label>
                    {selectedPalette && (
                      <p className="text-sm text-muted-foreground mb-2">
                        Seçili: <strong>{selectedPalette.name}</strong>
                      </p>
                    )}
                    
                    {/* Image Palette */}
                    {imagePalette && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-2" style={{ color: '#929bc9' }}>
                          Görsel Paleti ({imagePalette.colors.length} renk)
                        </p>
                        <button
                          type="button"
                          onClick={() => handlePaletteChange('image-palette')}
                          disabled={isProcessing}
                          className={`w-full p-3 rounded-lg border-2 transition-all ${
                            selectedPaletteId === 'image-palette'
                              ? 'border-white bg-white/10'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex flex-wrap gap-1 justify-center">
                            {imagePalette.colors.slice(0,16).map((color, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded border border-slate-600"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                          {imagePalette.colors.length > 16 ? '...' : ''}
                          <p className="text-xs mt-2 text-center font-medium" style={{ color: '#929bc9' }}>
                            {imagePalette.name}
                          </p>
                        </button>
                      </div>
                    )}

                    {/* Reduced Image Palette */}
                    {reducedImagePalette && (
                      <div className="mb-3">
                        <p className="text-xs font-medium mb-2" style={{ color: '#929bc9' }}>
                          {reducedImagePalette.name} ({reducedImagePalette.colors.length} renk)
                        </p>
                        <button
                          type="button"
                          onClick={() => handlePaletteChange('image-palette-reduced')}
                          disabled={isProcessing}
                          className={`w-full p-3 rounded-lg border-2 transition-all ${
                            selectedPaletteId === 'image-palette-reduced'
                              ? 'border-white bg-white/10'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex flex-wrap gap-1 justify-center">
                            {reducedImagePalette.colors.map((color, idx) => (
                              <div
                                key={idx}
                                className="w-6 h-6 rounded border border-slate-600"
                                style={{ backgroundColor: color }}
                                title={color}
                              />
                            ))}
                          </div>
                          <p className="text-xs mt-2 text-center font-medium" style={{ color: '#929bc9' }}>
                            {reducedImagePalette.name}
                          </p>
                        </button>
                      </div>
                    )}

                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_PALETTES.map((palette) => (
                        <button
                          key={palette.id}
                          type="button"
                          onClick={() => handlePaletteChange(palette.id)}
                          disabled={isProcessing}
                          className={`relative p-2 rounded-lg border-2 transition-all ${
                            selectedPaletteId === palette.id
                              ? 'border-white bg-white/10'
                              : 'border-white/20 hover:border-white/40 bg-white/5'
                          } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title={palette.name}
                        >
                          <div className="grid grid-cols-4 gap-0.5">
                            {palette.colors.slice(0, 8).map((color, idx) => (
                              <div
                                key={idx}
                                className="aspect-square rounded-sm"
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                          <p className="text-xs mt-1 text-center font-medium" style={{ color: '#929bc9' }}>
                            {palette.name}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {imagePalette && !reducedImagePalette && (
                    <div className="space-y-2">
                      <Label>8 Renge İndirgenmiş Palet</Label>
                      <Button
                        onClick={handleCreateReducedPalette}
                        className="w-full"
                        variant="outline"
                        disabled={isProcessing || !imagePalette}
                      >
                        Create Palette
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        Görsel paletinden 8 renge indirgenmiş yeni bir palet oluşturur
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button onClick={handleDownloadPNG} className="flex-1" disabled={isProcessing}>
                      PNG İndir
                    </Button>
                    <Button onClick={handleDownloadJSON} variant="outline" className="flex-1" disabled={isProcessing}>
                      JSON İndir
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="space-y-4">
            <div>
              <Label>Ön İzleme</Label>
              <div className="mt-2 border border-slate-700 rounded-lg p-4 bg-slate-900 overflow-auto max-h-[600px] flex items-center justify-center">
                {pixelArray ? (
                  <canvas
                    ref={previewCanvasRef}
                    className="border border-slate-600 rounded"
                    style={{
                      imageRendering: 'pixelated',
                      maxWidth: '100%',
                      height: 'auto',
                    }}
                  />
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="mb-2">Henüz resim yüklenmedi</p>
                    <p className="text-sm">Resim dosyası seçin (jpg, png, vb.)</p>
                  </div>
                )}
              </div>
            </div>

            {pixelArray && imageDimensions && (
              <div className="space-y-2">
                <Label>Bilgiler</Label>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>Genişlik: {imageDimensions.width} px</p>
                  <p>Yükseklik: {imageDimensions.height} px</p>
                  <p>Toplam piksel: {imageDimensions.width * imageDimensions.height}</p>
                  <p>Palet: {selectedPalette?.name || '—'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 rounded-lg bg-slate-800 border border-slate-700">
          <h2 className="text-xl font-bold mb-4">Kullanım Talimatları</h2>
          <div className="space-y-3 text-sm">
            <div>
              <p className="font-semibold mb-1">Nasıl Çalışır:</p>
              <p className="text-muted-foreground">
                1. Bir resim dosyası yükleyin (JPG, PNG, vb.)<br />
                2. Resim otomatik olarak seçili palete uydurulur<br />
                3. Farklı paletler deneyebilirsiniz<br />
                4. PNG veya JSON formatında indirebilirsiniz
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">Palet Seçimi:</p>
              <p className="text-muted-foreground">
                Resim yüklendikten sonra farklı paletler seçerek sonucu görebilirsiniz. Her palet değişikliğinde resim yeniden işlenir.
              </p>
            </div>
            <div>
              <p className="font-semibold mb-1">İndirme:</p>
              <p className="text-muted-foreground">
                PNG: Palete uydurulmuş görseli PNG formatında indirir<br />
                JSON: 2D array formatında hex renk değerlerini JSON dosyası olarak indirir
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
