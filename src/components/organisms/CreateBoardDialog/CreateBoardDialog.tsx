import { useState, useRef, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/atoms/ui/dialog';
import { Input } from '@/components/atoms/ui/input';
import { Label } from '@/components/atoms/ui/label';
import { Button } from '@/components/atoms/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { createBoard, checkBoardNameExists } from '@/services/board.service';
import { addBoardToUser, canUserCreateBoard } from '@/services/user.service';
import { invalidateUserProfile } from '@/lib/cache';
import { validateBoardName, rgbToHex } from '@/lib/utils';
import { validateBoardDimensions, config } from '@/lib/config';
import {
  FiLock,
  FiGlobe,
  FiChevronLeft,
  FiChevronRight,
  FiImage,
  FiEdit3,
} from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { logButtonClick, logError } from '@/services/analytics.service';
import { COLOR_PALETTES } from '@/components/molecules/ColorPicker';

interface CreateBoardDialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: React.ReactNode;
}

// Helper functions for color operations
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

function colorDistance(
  rgb1: [number, number, number],
  rgb2: [number, number, number]
): number {
  const [r1, g1, b1] = rgb1;
  const [r2, g2, b2] = rgb2;
  return Math.sqrt((r2 - r1) ** 2 + (g2 - g1) ** 2 + (b2 - b1) ** 2);
}

// Convert RGB to HSL (returns [hue: 0-360, saturation: 0-1, lightness: 0-1])
function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [h * 360, s, l];
}

// K-means clustering to reduce colors to 8
function kMeans(colors: string[], k: number, maxIterations = 10): string[] {
  // Convert colors to RGB
  const colorRgbs = colors.map((color) => hexToRgb(color));

  // Initialize centroids deterministically (sorted by hue first for better results)
  const centroids: [number, number, number][] = [];

  // First, sort colors by hue to get a more predictable initial state
  const sortedByHue = [...colorRgbs].sort((a, b) => {
    const hslA = rgbToHsl(a[0], a[1], a[2]);
    const hslB = rgbToHsl(b[0], b[1], b[2]);
    return hslA[0] - hslB[0];
  });

  // Select evenly spaced colors from the sorted array
  const step = Math.max(1, Math.floor(sortedByHue.length / k));
  for (let i = 0; i < k && i * step < sortedByHue.length; i++) {
    centroids.push([...sortedByHue[i * step]]);
  }

  // If we don't have enough centroids, fill with remaining colors
  while (centroids.length < k && centroids.length < sortedByHue.length) {
    centroids.push([...sortedByHue[centroids.length]]);
  }

  // K-means iterations
  for (let iteration = 0; iteration < maxIterations; iteration++) {
    // Assign each color to nearest centroid
    const clusters: number[][] = Array(k)
      .fill(0)
      .map(() => []);

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

      let sumR = 0,
        sumG = 0,
        sumB = 0;
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

      const oldCentroid = centroids[cIdx];
      if (
        oldCentroid[0] !== newCentroid[0] ||
        oldCentroid[1] !== newCentroid[1] ||
        oldCentroid[2] !== newCentroid[2]
      ) {
        centroidsChanged = true;
      }
      centroids[cIdx] = newCentroid;
    });

    if (!centroidsChanged) break;
  }

  // Convert centroids back to hex colors
  const hexColors = centroids.map((centroid) =>
    rgbToHex(centroid[0], centroid[1], centroid[2]).toUpperCase()
  );

  // Fill remaining slots with white if we have less than k colors
  while (hexColors.length < k) {
    hexColors.push('#FFFFFF');
  }

  // Sort colors by hue (rainbow order) then by lightness
  // Rainbow order: red (0°) -> orange (30°) -> yellow (60°) -> green (120°) -> cyan (180°) -> blue (240°) -> purple (270°) -> magenta (300°)
  const sortedColors = [...hexColors].sort((a, b) => {
    const rgbA = hexToRgb(a);
    const rgbB = hexToRgb(b);

    const hslA = rgbToHsl(rgbA[0], rgbA[1], rgbA[2]);
    const hslB = rgbToHsl(rgbB[0], rgbB[1], rgbB[2]);

    const [hueA, satA, lightA] = hslA;
    const [hueB, satB, lightB] = hslB;

    // Handle grayscale colors (low saturation) - put them at the end
    const isGrayA = satA < 0.1;
    const isGrayB = satB < 0.1;

    if (isGrayA && !isGrayB) return 1;
    if (!isGrayA && isGrayB) return -1;
    if (isGrayA && isGrayB) {
      // Both are grayscale, sort by lightness (light to dark)
      return lightB - lightA;
    }

    // Both are colored, sort by hue first (rainbow order)
    // Normalize hue to 0-360 range
    const normalizedHueA = isNaN(hueA) ? 0 : hueA;
    const normalizedHueB = isNaN(hueB) ? 0 : hueB;

    const hueDiff = normalizedHueA - normalizedHueB;
    if (Math.abs(hueDiff) > 5) {
      return hueDiff;
    }

    // If hues are very similar, sort by lightness (lighter first for better visual flow)
    return lightB - lightA;
  });

  console.log('uu', sortedColors);

  return sortedColors;
}

export const CreateBoardDialog = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  trigger,
}: CreateBoardDialogProps = {}) => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [internalOpen, setInternalOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;
  const [name, setName] = useState('');
  const [width, setWidth] = useState(config.defaultBoardWidth.toString());
  const [height, setHeight] = useState(config.defaultBoardHeight.toString());
  const [isPublic, setIsPublic] = useState(true);
  const [selectedPaletteIndex, setSelectedPaletteIndex] = useState(
    Math.floor(Math.random() * COLOR_PALETTES.length)
  );
  const [isCustomPalette, setIsCustomPalette] = useState(false);
  const [customPalette, setCustomPalette] = useState<string[]>(
    COLOR_PALETTES[0].colors.map((c) => c)
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const [isResizing, setIsResizing] = useState<'width' | 'height' | null>(null);
  const [resizeStart, setResizeStart] = useState({
    x: 0,
    y: 0,
    startWidth: 0,
    startHeight: 0,
  });

  const totalPixels = parseInt(width) * parseInt(height);
  const isValidDimensions = validateBoardDimensions(
    parseInt(width),
    parseInt(height)
  );

  // Reset to step 1 when dialog opens/closes
  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setCurrentStep(1);
      setError(null);
      setIsCustomPalette(false);
      setCustomPalette(COLOR_PALETTES[0].colors.map((c) => c));
    }
  };

  // Get current palette colors
  const getCurrentPaletteColors = (): string[] => {
    if (isCustomPalette) {
      return customPalette;
    }
    return COLOR_PALETTES[selectedPaletteIndex].colors;
  };

  // Get dynamic dialog title based on step
  const getDialogTitle = (): string => {
    if (currentStep === 1) return 'Create New Board';
    if (currentStep === 2) return 'Set Board Dimensions';
    if (currentStep === 3) return 'Choose Color Palette';
    return 'Create New Board';
  };

  // Step validation
  const canProceedToNextStep = () => {
    if (currentStep === 1) {
      return name.trim().length > 0;
    }
    if (currentStep === 2) {
      const w = parseInt(width);
      const h = parseInt(height);
      return !isNaN(w) && !isNaN(h) && w > 0 && h > 0 && isValidDimensions;
    }
    if (currentStep === 3) {
      // Step 3: All validations must pass
      const nameValidation = validateBoardName(name);
      const w = parseInt(width);
      const h = parseInt(height);
      const paletteValid = isCustomPalette
        ? customPalette.length === 8 &&
          customPalette.every((c) => /^#[0-9A-F]{6}$/i.test(c))
        : selectedPaletteIndex >= 0 &&
          selectedPaletteIndex < COLOR_PALETTES.length;
      return (
        nameValidation.valid &&
        !isNaN(w) &&
        !isNaN(h) &&
        w > 0 &&
        h > 0 &&
        isValidDimensions &&
        paletteValid
      );
    }
    return true;
  };

  const handleNext = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentStep < 3 && canProceedToNextStep()) {
      setCurrentStep(currentStep + 1);
      setError(null);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError(null);
    }
  };

  const handlePaletteNavigation = (direction: 'prev' | 'next') => {
    if (isCustomPalette) return;
    if (direction === 'prev') {
      setSelectedPaletteIndex((prev) =>
        prev === 0 ? COLOR_PALETTES.length - 1 : prev - 1
      );
    } else {
      setSelectedPaletteIndex((prev) =>
        prev === COLOR_PALETTES.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleColorChange = (index: number, color: string) => {
    if (!isCustomPalette) {
      // Switch to custom palette mode
      setIsCustomPalette(true);
      setCustomPalette(
        COLOR_PALETTES[selectedPaletteIndex].colors.map((c) => c)
      );
    }
    const newPalette = [...customPalette];
    // Ensure color is valid hex
    const hexColor = color.startsWith('#') ? color : `#${color}`;
    if (/^#[0-9A-F]{6}$/i.test(hexColor)) {
      newPalette[index] = hexColor.toUpperCase();
      setCustomPalette(newPalette);
    }
  };

  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (jpg, png, etc.)');
      return;
    }

    setError(null);

    try {
      const image = new Image();
      const imageUrl = URL.createObjectURL(file);

      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = imageUrl;
      });

      // Create canvas to read pixel data
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not get canvas context');
      }

      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, image.width, image.height);
      const data = imageData.data;

      // Collect unique colors
      const colorSet = new Set<string>();
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];

        // Skip fully transparent pixels
        if (a < 128) continue;

        const hex = rgbToHex(r, g, b).toUpperCase();
        colorSet.add(hex);
      }

      const colors = Array.from(colorSet);

      // Reduce to 8 colors using k-means
      const reducedColors = kMeans(colors, 8);

      setIsCustomPalette(true);
      setCustomPalette(reducedColors);

      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error('Image processing error:', error);
      setError('Failed to process image. Please try another image.');
    }
  };

  // Resize handlers
  const handleResizeStart = (type: 'width' | 'height', e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!previewContainerRef.current) return;

    const currentWidth = parseInt(width) || 1;
    const currentHeight = parseInt(height) || 1;

    setIsResizing(type);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      startWidth: currentWidth,
      startHeight: currentHeight,
    });
  };

  useEffect(() => {
    if (!isResizing || !previewContainerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!previewContainerRef.current) return;

      const rect = previewContainerRef.current.getBoundingClientRect();
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      if (isResizing === 'width') {
        // Calculate scale: board pixels per screen pixel
        const pixelsPerScreenPixel = resizeStart.startWidth / rect.width;
        const deltaPixels = deltaX * pixelsPerScreenPixel;
        const newWidth = Math.max(
          1,
          Math.round(resizeStart.startWidth + deltaPixels)
        );
        setWidth(newWidth.toString());
      } else if (isResizing === 'height') {
        // Calculate scale: board pixels per screen pixel
        const pixelsPerScreenPixel = resizeStart.startHeight / rect.height;
        const deltaPixels = deltaY * pixelsPerScreenPixel;
        const newHeight = Math.max(
          1,
          Math.round(resizeStart.startHeight + deltaPixels)
        );
        setHeight(newHeight.toString());
      }
    };

    const handleMouseUp = () => {
      setIsResizing(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;
    if (currentStep !== 3) return;

    logButtonClick('Create Board Submit', 'CreateBoardDialog');

    const nameValidation = validateBoardName(name);
    if (!nameValidation.valid) {
      setError(nameValidation.error || 'Invalid board name');
      return;
    }

    const w = parseInt(width);
    const h = parseInt(height);

    if (isNaN(w) || isNaN(h) || w < 1 || h < 1) {
      setError('Width and height must be positive numbers');
      return;
    }

    if (!validateBoardDimensions(w, h)) {
      setError(
        `Total pixels (${w * h}) exceeds maximum allowed (${
          config.maxBoardPixels
        })`
      );
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const canCreate = await canUserCreateBoard(user.uid);
      if (!canCreate) {
        setError(`You can only create up to ${config.maxBoardsPerUser} boards`);
        setLoading(false);
        return;
      }

      // Check if a board with this name already exists
      const nameExists = await checkBoardNameExists(name.trim(), user.uid);
      if (nameExists) {
        setError(
          `A board with the name "${name.trim()}" already exists. Please choose a different name.`
        );
        setLoading(false);
        return;
      }

      // Get the selected palette colors for customPalette
      const paletteColors = getCurrentPaletteColors();

      const board = await createBoard(
        user.uid,
        user.username,
        name,
        w,
        h,
        isPublic,
        false,
        undefined,
        paletteColors
      );
      await addBoardToUser(user.uid, board);

      // Invalidate user profile cache to refresh boards list
      invalidateUserProfile(user.uid);

      // Refresh user data in AuthContext
      await refreshUser();

      toast({
        title: 'Board created!',
        description: `Your board "${name}" has been created successfully.`,
      });

      setOpen(false);
      setName('');
      setWidth(config.defaultBoardWidth.toString());
      setHeight(config.defaultBoardHeight.toString());
      setIsPublic(true);
      setSelectedPaletteIndex(
        Math.floor(Math.random() * COLOR_PALETTES.length)
      );
      setIsCustomPalette(false);
      setCustomPalette(COLOR_PALETTES[0].colors.map((c) => c));
      setCurrentStep(1);

      navigate(`/board/${board.name}`);
    } catch (error) {
      console.error('Board creation error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to create board';
      logError('Board Creation Failed', errorMessage, 'CreateBoardDialog', {
        board_name: name,
        width: w,
        height: h,
        is_public: isPublic,
      });
      setError(errorMessage);
      toast({
        title: 'Creation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader className="relative">
          <DialogTitle>{getDialogTitle()}</DialogTitle>
          <DialogDescription>Step {currentStep} of 3</DialogDescription>
          {/* Step Indicator */}
          <div className="absolute top-0 right-0 flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-2 rounded-full transition-all ${
                  step === currentStep
                    ? 'w-8 bg-primary'
                    : step < currentStep
                      ? 'w-2 bg-primary/50'
                      : 'w-2 bg-muted'
                }`}
              />
            ))}
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Step 1: Name & Visibility */}
            {currentStep === 1 && (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="name">Board Name</Label>
                  <Input
                    id="name"
                    placeholder="My Awesome Board"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError(null);
                    }}
                    disabled={loading}
                  />
                </div>

                <div className="grid gap-2">
                  <Label>Privacy</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={isPublic ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        logButtonClick('Set Board Public', 'CreateBoardDialog');
                        setIsPublic(true);
                      }}
                      disabled={loading}
                    >
                      <FiGlobe className="mr-2 h-4 w-4" />
                      Public
                    </Button>
                    <Button
                      type="button"
                      variant={!isPublic ? 'default' : 'outline'}
                      className="flex-1"
                      onClick={() => {
                        logButtonClick(
                          'Set Board Private',
                          'CreateBoardDialog'
                        );
                        setIsPublic(false);
                      }}
                      disabled={loading}
                    >
                      <FiLock className="mr-2 h-4 w-4" />
                      Private
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isPublic
                      ? 'Anyone can view and contribute to this board'
                      : 'Only you can view and edit this board'}
                  </p>
                </div>
              </>
            )}

            {/* Step 2: Dimensions with Preview */}
            {currentStep === 2 && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="width">Width</Label>
                    <Input
                      id="width"
                      type="number"
                      min="1"
                      max="1295"
                      value={width}
                      onChange={(e) => {
                        setWidth(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="height">Height</Label>
                    <Input
                      id="height"
                      type="number"
                      min="1"
                      max="1295"
                      value={height}
                      onChange={(e) => {
                        setHeight(e.target.value);
                        setError(null);
                      }}
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Dimension Preview */}
                <div className="flex items-center justify-center py-8 px-16">
                  <div
                    ref={previewContainerRef}
                    className="relative w-full max-w-full flex items-center justify-center"
                    style={{
                      aspectRatio: `${parseInt(width) || 1} / ${parseInt(height) || 1}`,
                    }}
                  >
                    {/* Dimension Labels */}
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-sm font-mono text-muted-foreground whitespace-nowrap">
                      W: {width || '0'}
                    </div>
                    <div className="absolute -left-16 top-1/2 -translate-y-1/2 text-sm font-mono text-muted-foreground whitespace-nowrap -rotate-90">
                      H: {height || '0'}
                    </div>
                    {/* Preview Rectangle with Pixel Grid */}
                    <div
                      className="border-2 border-primary bg-primary/10 w-full h-full relative overflow-hidden"
                      style={{
                        minWidth: '60px',
                        minHeight: '60px',
                      }}
                    >
                      {/* Pixel Grid - Every 8 pixels */}
                      <div
                        className="absolute"
                        style={{
                          top: '-1px',
                          left: '-1px',
                          right: '0',
                          bottom: '0',
                          backgroundImage: `
                            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
                          `,
                          backgroundSize: `${(100 * 8) / (parseInt(width) || 1)}% ${(100 * 8) / (parseInt(height) || 1)}%`,
                        }}
                      />
                      {/* Resize Handle - Right edge (width) */}
                      <div
                        className="absolute top-0 right-0 w-2 h-full cursor-ew-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart('width', e)}
                        style={{ zIndex: 10 }}
                      />
                      {/* Resize Handle - Bottom edge (height) */}
                      <div
                        className="absolute bottom-0 left-0 w-full h-2 cursor-ns-resize hover:bg-primary/20 transition-colors"
                        onMouseDown={(e) => handleResizeStart('height', e)}
                        style={{ zIndex: 10 }}
                      />
                    </div>
                  </div>
                </div>

                {!isValidDimensions && (
                  <div className="rounded-lg bg-muted p-3">
                    <p className="text-sm">
                      Total pixels:{' '}
                      <span className="font-mono">
                        {totalPixels.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm">
                      Maximum allowed:{' '}
                      <span className="font-mono">
                        {config.maxBoardPixels.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-sm text-destructive mt-1">
                      Dimensions exceed maximum!
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Step 3: Palette Selection */}
            {currentStep === 3 && (
              <>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Color Palette</Label>

                    {/* Mode Toggle */}
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={!isCustomPalette ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => {
                          setIsCustomPalette(false);
                        }}
                        disabled={loading}
                      >
                        Preset Palettes
                      </Button>
                      <Button
                        type="button"
                        variant={isCustomPalette ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => {
                          setIsCustomPalette(true);
                        }}
                        disabled={loading}
                      >
                        <FiEdit3 className="mr-2 h-4 w-4" />
                        Custom Palette
                      </Button>
                    </div>

                    {!isCustomPalette ? (
                      /* Preset Palette Selection */
                      <div className="flex items-center gap-4">
                        {/* Left Arrow */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handlePaletteNavigation('prev')}
                          disabled={loading}
                          className="flex-shrink-0"
                        >
                          <FiChevronLeft className="h-4 w-4" />
                        </Button>

                        {/* Palette Display */}
                        <div className="flex-1 flex flex-col items-center gap-3">
                          <div className="w-full p-4 rounded-lg border border-white/10 bg-white/5">
                            <div className="grid grid-cols-4 gap-2 mb-3">
                              {COLOR_PALETTES[selectedPaletteIndex].colors.map(
                                (color, idx) => (
                                  <div
                                    key={idx}
                                    className="aspect-square rounded-md border border-white/20"
                                    style={{ backgroundColor: color }}
                                  />
                                )
                              )}
                            </div>
                            <p
                              className="text-center font-medium"
                              style={{ color: '#929bc9' }}
                            >
                              {COLOR_PALETTES[selectedPaletteIndex].name}
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {selectedPaletteIndex + 1} of{' '}
                            {COLOR_PALETTES.length}
                          </p>
                        </div>

                        {/* Right Arrow */}
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handlePaletteNavigation('next')}
                          disabled={loading}
                          className="flex-shrink-0"
                        >
                          <FiChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    ) : (
                      /* Custom Palette Editor */
                      <div className="space-y-4">
                        {/* Image Upload */}
                        <div className="grid gap-2">
                          <Label>Create Palette from Image (Optional)</Label>
                          <div className="relative">
                            <input
                              id="palette-image"
                              type="file"
                              accept="image/*"
                              ref={fileInputRef}
                              onChange={handleImageUpload}
                              disabled={loading}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={loading}
                            >
                              <FiImage className="mr-2 h-4 w-4" />
                              Choose Image
                            </Button>
                          </div>
                        </div>

                        {/* Custom Palette Colors */}
                        <div className="grid gap-2">
                          <Label>Custom Palette Colors (Click to edit)</Label>
                          <div className="grid grid-cols-4 gap-2 p-4 rounded-lg border border-white/10 bg-white/5">
                            {customPalette.map((color, idx) => (
                              <div key={idx} className="relative aspect-square">
                                <input
                                  type="color"
                                  value={color}
                                  onChange={(e) =>
                                    handleColorChange(idx, e.target.value)
                                  }
                                  className="w-full h-full rounded-md border-2 border-white/20 hover:border-white/40 cursor-pointer transition-all hover:scale-105"
                                  style={{
                                    backgroundColor: color,
                                    WebkitAppearance: 'none',
                                    MozAppearance: 'none',
                                    appearance: 'none',
                                  }}
                                  disabled={loading}
                                  title={`Click to change: ${color}`}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="rounded-lg bg-muted/50 p-3 border border-primary/20">
                    <p className="text-sm text-muted-foreground">
                      💡 Don't worry! You can change the palette later from the
                      board settings.
                    </p>
                  </div>
                </div>
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter className="justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                logButtonClick('Cancel Create Board', 'CreateBoardDialog');
                handleOpenChange(false);
              }}
              disabled={loading}
            >
              Cancel
            </Button>
            <div className="flex gap-2">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                >
                  Back
                </Button>
              )}
              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleNext(e);
                  }}
                  disabled={loading || !canProceedToNextStep()}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={loading || !canProceedToNextStep()}
                >
                  {loading ? 'Creating...' : 'Create Board'}
                </Button>
              )}
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
