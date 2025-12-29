import { useRef, useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { Board, Pixel } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface PendingPixel {
  x: number;
  y: number;
  color: string;
  originalColor: string | null;
}

interface PixelBoardProps {
  board: Board;
  pixels: (Pixel | null)[][];
  selectedColor: string;
  onBatchPixelPlace: (pixels: { x: number; y: number; color: string }[]) => Promise<void>;
  isGuest?: boolean;
  onZoomChange?: (zoom: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetView?: () => void;
  onPendingPixelsChange?: (count: number) => void;
  onPendingPixelsNeedingQuotaChange?: (count: number) => void;
  onQuotaExceeded?: () => void;
  currentUserId?: string;
  availableQuota?: number;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  onHistoryStateChange?: (historyIndex: number, historyLength: number) => void;
  onUndoRequest?: () => void;
  onRedoRequest?: () => void;
  onApplyChanges?: () => void;
  onClearPending?: () => void;
  showInfoDisplay?: boolean;
}

export interface PixelBoardRef {
  applyChanges: () => void;
  clearPending: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  resetView: () => void;
  undo: () => void;
  redo: () => void;
}

export const PixelBoard = forwardRef<PixelBoardRef, PixelBoardProps>(({
  board,
  pixels,
  selectedColor,
  onBatchPixelPlace,
  isGuest = false,
  onZoomIn: _externalZoomIn,
  onZoomOut: _externalZoomOut,
  onResetView: _externalResetView,
  onPendingPixelsChange,
  onPendingPixelsNeedingQuotaChange,
  onQuotaExceeded,
  currentUserId,
  availableQuota = 0,
  onFullscreenChange,
  onHistoryStateChange,
  onUndoRequest,
  onRedoRequest,
  showInfoDisplay = true,
}, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(10); // pixels per grid cell
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [isErasing, setIsErasing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lastMiddleClickTime, setLastMiddleClickTime] = useState(0);
  const [isMiddleMouseDown, setIsMiddleMouseDown] = useState(false);
  const [pendingPixels, setPendingPixels] = useState<Map<string, PendingPixel>>(
    new Map()
  );
  const [history, setHistory] = useState<Map<string, PendingPixel>[]>([new Map()]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const { toast } = useToast();
  
  // Check if board is loaded (has dimensions and pixels array is initialized)
  const isBoardLoaded = board.width > 0 && board.height > 0 && pixels.length > 0;
  
  // Use refs to avoid recreating drawGrid on every state change
  const pixelsRef = useRef(pixels);
  const hoveredCellRef = useRef(hoveredCell);
  const selectedColorRef = useRef(selectedColor);
  const zoomRef = useRef(zoom);
  const offsetRef = useRef(offset);
  const pendingPixelsRef = useRef(pendingPixels);
  const animationFrameRef = useRef<number | null>(null);
  const needsRedrawRef = useRef(true);
  
  // Performance optimization: off-screen canvas cache for base board
  const offscreenCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseCacheNeedsUpdateRef = useRef(true);

  // Animation state for smooth zoom transitions
  const isAnimatingRef = useRef(false);
  const animationStartTimeRef = useRef(0);
  const targetZoomRef = useRef(0);
  const targetOffsetRef = useRef({ x: 0, y: 0 });
  const startZoomRef = useRef(0);
  const startOffsetRef = useRef({ x: 0, y: 0 });
  const ANIMATION_DURATION = 150; // milliseconds

  // Easing function: ease-out cubic
  const easeOutCubic = useCallback((t: number): number => {
    return 1 - Math.pow(1 - t, 3);
  }, []);

  // Update refs when props/state change
  useEffect(() => {
    pixelsRef.current = pixels;
    baseCacheNeedsUpdateRef.current = true; // Mark cache dirty when pixels change
    needsRedrawRef.current = true;
  }, [pixels]);

  useEffect(() => {
    hoveredCellRef.current = hoveredCell;
    needsRedrawRef.current = true;
  }, [hoveredCell]);

  useEffect(() => {
    selectedColorRef.current = selectedColor;
    needsRedrawRef.current = true;
  }, [selectedColor]);

  useEffect(() => {
    zoomRef.current = zoom;
    offsetRef.current = offset;
    needsRedrawRef.current = true;
  }, [zoom, offset]);

  useEffect(() => {
    pendingPixelsRef.current = pendingPixels;
    needsRedrawRef.current = true;
  }, [pendingPixels]);

  // Notify parent of pending pixels count
  useEffect(() => {
    if (onPendingPixelsChange) {
      onPendingPixelsChange(pendingPixels.size);
    }
  }, [pendingPixels.size, onPendingPixelsChange]);

  // Notify parent of history state changes
  useEffect(() => {
    if (onHistoryStateChange) {
      onHistoryStateChange(historyIndex, history.length);
    }
  }, [historyIndex, history.length, onHistoryStateChange]);

  // Calculate and notify parent of pending pixels that need quota
  useEffect(() => {
    if (onPendingPixelsNeedingQuotaChange) {
      let quotaNeeded = 0;
      
      for (const pendingPixel of pendingPixels.values()) {
        const currentPixel = pixels[pendingPixel.y]?.[pendingPixel.x];
        const currentColor = currentPixel?.color || null;
        const isOwnPixel = currentPixel?.placedBy === currentUserId;
        const isSameColor = currentColor === pendingPixel.color;
        
        // Only count if not same color and not own pixel
        if (!isSameColor && !isOwnPixel) {
          quotaNeeded++;
        }
      }
      
      onPendingPixelsNeedingQuotaChange(quotaNeeded);
    }
  }, [pendingPixels, pixels, currentUserId, onPendingPixelsNeedingQuotaChange]);

  // Build the base cache: render all board pixels to off-screen canvas at 1:1 scale
  const buildBaseCache = useCallback(() => {
    const startTime = performance.now();
    const currentPixels = pixelsRef.current;
    
    // Create or reuse off-screen canvas
    if (!offscreenCanvasRef.current) {
      offscreenCanvasRef.current = document.createElement('canvas');
    }
    
    const offscreenCanvas = offscreenCanvasRef.current;
    offscreenCanvas.width = board.width;
    offscreenCanvas.height = board.height;
    
    const ctx = offscreenCanvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    
    // Draw all pixels at 1:1 scale (each pixel = 1x1 on cache)
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const pixel = currentPixels[y]?.[x];
        ctx.fillStyle = pixel ? pixel.color : '#101322';
        ctx.fillRect(x, y, 1, 1);
      }
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    if (duration > 50) {
      console.warn(`[PixelBoard] buildBaseCache took ${duration.toFixed(2)}ms for ${board.width}x${board.height} board`);
    }
    
    baseCacheNeedsUpdateRef.current = false;
  }, [board.width, board.height]);

  const drawGrid = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Don't draw until pixels are loaded
    if (pixelsRef.current.length === 0) return;

    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const currentHoveredCell = hoveredCellRef.current;
    const currentSelectedColor = selectedColorRef.current;
    const currentPendingPixels = pendingPixelsRef.current;

    // Rebuild base cache if needed
    if (baseCacheNeedsUpdateRef.current) {
      const cacheStartTime = performance.now();
      buildBaseCache();
      const cacheDuration = performance.now() - cacheStartTime;
      if (cacheDuration > 100) {
        console.warn(`[PixelBoard] buildBaseCache in drawGrid took ${cacheDuration.toFixed(2)}ms`);
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate visible area
    const startX = Math.floor(-currentOffset.x / currentZoom);
    const startY = Math.floor(-currentOffset.y / currentZoom);
    const endX = Math.ceil((canvas.width - currentOffset.x) / currentZoom);
    const endY = Math.ceil((canvas.height - currentOffset.y) / currentZoom);

    // Batch drawing operations
    const drawGridLines = currentZoom >= 4;
    
    // PERFORMANCE OPTIMIZATION: Draw entire base board from cache with single drawImage call
    // This replaces thousands of fillRect calls with just one
    const offscreenCanvas = offscreenCanvasRef.current;
    if (offscreenCanvas) {
      // Disable image smoothing for crisp pixel art
      ctx.imageSmoothingEnabled = false;
      
      // Draw the cached board scaled to current zoom
      ctx.drawImage(
        offscreenCanvas,
        0, 0, board.width, board.height, // Source: entire cache (1:1 scale)
        currentOffset.x, currentOffset.y, // Destination position
        board.width * currentZoom, board.height * currentZoom // Destination size (scaled)
      );
    }
    
    // Draw pending pixels on top (only the changed ones)
    for (const pendingPixel of currentPendingPixels.values()) {
      const screenX = pendingPixel.x * currentZoom + currentOffset.x;
      const screenY = pendingPixel.y * currentZoom + currentOffset.y;
      
      ctx.fillStyle = pendingPixel.color;
      ctx.fillRect(screenX, screenY, currentZoom, currentZoom);
    }

    // Draw pending pixels indicator (orange dashed border around all pending pixels)
    if (currentPendingPixels.size > 0) {
      // Find bounding box of all pending pixels
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      for (const pixel of currentPendingPixels.values()) {
        minX = Math.min(minX, pixel.x);
        minY = Math.min(minY, pixel.y);
        maxX = Math.max(maxX, pixel.x);
        maxY = Math.max(maxY, pixel.y);
      }

      // Draw border around the bounding box
      const screenMinX = minX * currentZoom + currentOffset.x;
      const screenMinY = minY * currentZoom + currentOffset.y;
      const width = (maxX - minX + 1) * currentZoom;
      const height = (maxY - minY + 1) * currentZoom;

      ctx.strokeStyle = '#FFA500';
      ctx.lineWidth = Math.max(2, currentZoom * 0.15);
      ctx.setLineDash([currentZoom * 0.3, currentZoom * 0.2]);
      ctx.strokeRect(screenMinX, screenMinY, width, height);
      ctx.setLineDash([]);
    }

    // Draw all grid lines efficiently: draw horizontal and vertical lines separately
    // This is much faster than drawing individual rectangles for each cell
    if (drawGridLines) {
      ctx.strokeStyle = '#1c223a';
      ctx.lineWidth = 0.5;
      
      // Draw horizontal lines
      ctx.beginPath();
      for (let y = Math.max(0, startY); y <= Math.min(board.height, endY); y++) {
        const screenY = y * currentZoom + currentOffset.y;
        const screenStartX = Math.max(0, startX) * currentZoom + currentOffset.x;
        const screenEndX = Math.min(board.width, endX) * currentZoom + currentOffset.x;
        ctx.moveTo(screenStartX, screenY);
        ctx.lineTo(screenEndX, screenY);
      }
      ctx.stroke();
      
      // Draw vertical lines
      ctx.beginPath();
      for (let x = Math.max(0, startX); x <= Math.min(board.width, endX); x++) {
        const screenX = x * currentZoom + currentOffset.x;
        const screenStartY = Math.max(0, startY) * currentZoom + currentOffset.y;
        const screenEndY = Math.min(board.height, endY) * currentZoom + currentOffset.y;
        ctx.moveTo(screenX, screenStartY);
        ctx.lineTo(screenX, screenEndY);
      }
      ctx.stroke();
    }

    // Draw thick border around the board
    ctx.strokeStyle = '#1c223a';
    ctx.lineWidth = 3;
    ctx.strokeRect(
      currentOffset.x - 1.5,
      currentOffset.y - 1.5,
      board.width * currentZoom + 3,
      board.height * currentZoom + 3
    );

    // Draw coordinate labels when zoomed in enough
    const showCoordinates = currentZoom >= 15;
    if (showCoordinates) {
      ctx.font = `${Math.min(currentZoom * 0.4, 12)}px monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#929bc9';

      // Draw column numbers (top)
      for (let x = Math.max(0, startX); x < Math.min(board.width, endX); x++) {
        const screenX = x * currentZoom + currentOffset.x;
        const screenY = currentOffset.y - currentZoom * 0.5;
        
        // Only draw if there's space above the grid
        if (screenY > 5) {
          ctx.fillText((x + 1).toString(), screenX + currentZoom / 2, screenY);
        }
      }

      // Draw row numbers (left)
      ctx.textAlign = 'right';
      for (let y = Math.max(0, startY); y < Math.min(board.height, endY); y++) {
        const screenX = currentOffset.x - currentZoom * 0.3;
        const screenY = y * currentZoom + currentOffset.y;
        
        // Only draw if there's space to the left of the grid
        if (screenX > 5) {
          ctx.fillText((y + 1).toString(), screenX, screenY + currentZoom / 2);
        }
      }
    }

    // Draw hover indicator
    if (currentHoveredCell && !isGuest) {
      const screenX = currentHoveredCell.x * currentZoom + currentOffset.x;
      const screenY = currentHoveredCell.y * currentZoom + currentOffset.y;

      // Draw preview
      ctx.fillStyle = currentSelectedColor;
      ctx.globalAlpha = 0.5;
      ctx.fillRect(screenX, screenY, currentZoom, currentZoom);
      ctx.globalAlpha = 1;

      // Draw border
      ctx.strokeStyle = currentSelectedColor;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenX + 1, screenY + 1, currentZoom - 2, currentZoom - 2);
    }
  }, [board.height, board.width, isGuest]);

  // Use requestAnimationFrame for smooth rendering
  useEffect(() => {
    const renderStartTime = performance.now();
    let firstRenderTime: number | null = null;
    let pixelsWaitStartTime: number | null = null;
    let renderCount = 0;
    
    const render = () => {
      renderCount++;
      const frameStartTime = performance.now();
      
      // Don't render until pixels are loaded
      if (pixelsRef.current.length === 0) {
        if (pixelsWaitStartTime === null) {
          pixelsWaitStartTime = performance.now();
        }
        const waitDuration = performance.now() - pixelsWaitStartTime;
        if (waitDuration > 1000 && renderCount % 60 === 0) {
          // Log every 60 frames (about 1 second at 60fps) if still waiting
          console.warn(`[PixelBoard] Still waiting for pixels to load... (${(waitDuration / 1000).toFixed(1)}s)`);
        }
        animationFrameRef.current = requestAnimationFrame(render);
        return;
      }
      
      // Pixels are loaded - log if we waited
      if (pixelsWaitStartTime !== null) {
        const waitDuration = performance.now() - pixelsWaitStartTime;
        console.log(`[PixelBoard] Pixels loaded after ${waitDuration.toFixed(2)}ms (${renderCount} frames waited)`);
        pixelsWaitStartTime = null;
      }

      // Handle zoom animation
      if (isAnimatingRef.current) {
        const now = performance.now();
        const elapsed = now - animationStartTimeRef.current;
        const progress = Math.min(1, elapsed / ANIMATION_DURATION);
        const easedProgress = easeOutCubic(progress);

        // Interpolate zoom
        const currentZoom = startZoomRef.current + (targetZoomRef.current - startZoomRef.current) * easedProgress;
        
        // Interpolate offset
        const currentOffset = {
          x: startOffsetRef.current.x + (targetOffsetRef.current.x - startOffsetRef.current.x) * easedProgress,
          y: startOffsetRef.current.y + (targetOffsetRef.current.y - startOffsetRef.current.y) * easedProgress,
        };

        // Update state
        setZoom(currentZoom);
        setOffset(currentOffset);

        // Check if animation is complete
        if (progress >= 1) {
          isAnimatingRef.current = false;
          // Ensure we end exactly at target values
          setZoom(targetZoomRef.current);
          setOffset(targetOffsetRef.current);
        }

        needsRedrawRef.current = true;
      }

      if (needsRedrawRef.current) {
        const drawStartTime = performance.now();
        drawGrid();
        const drawDuration = performance.now() - drawStartTime;
        
        // Log first render time
        if (firstRenderTime === null) {
          firstRenderTime = performance.now();
          const timeToFirstRender = firstRenderTime - renderStartTime;
          console.log(`[PixelBoard] First render completed in ${timeToFirstRender.toFixed(2)}ms (${renderCount} frames)`);
        }
        
        // Warn if drawGrid takes too long
        if (drawDuration > 16) {
          console.warn(`[PixelBoard] drawGrid took ${drawDuration.toFixed(2)}ms (target: <16ms for 60fps)`);
        }
        
        needsRedrawRef.current = false;
      }
      
      const frameDuration = performance.now() - frameStartTime;
      if (frameDuration > 16 && renderCount % 60 === 0) {
        // Log every 60 frames if frame takes too long
        console.warn(`[PixelBoard] Frame took ${frameDuration.toFixed(2)}ms (frame ${renderCount})`);
      }
      
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [drawGrid, easeOutCubic]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      needsRedrawRef.current = true;
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Animate zoom to target zoom and offset
  const animateZoom = useCallback((targetZoom: number, targetOffset: { x: number; y: number }) => {
    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;

    // Clamp target zoom to limits
    const clampedTargetZoom = Math.max(2, Math.min(50, targetZoom));

    // Store starting values
    startZoomRef.current = currentZoom;
    startOffsetRef.current = { ...currentOffset };

    // Store target values
    targetZoomRef.current = clampedTargetZoom;
    targetOffsetRef.current = { ...targetOffset };

    // Start animation
    isAnimatingRef.current = true;
    animationStartTimeRef.current = performance.now();
    needsRedrawRef.current = true;
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isBoardLoaded) return;
    // Disable zoom when middle mouse button is pressed (for panning)
    if (isMiddleMouseDown) return;
    
    const zoomFactor = 1.3; // 10% zoom per scroll step
    const delta = e.deltaY > 0 ? 1 / zoomFactor : zoomFactor;
    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const newZoom = Math.max(2, Math.min(50, currentZoom * delta));
    
    // Zoom towards mouse position
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const worldX = (mouseX - currentOffset.x) / currentZoom;
    const worldY = (mouseY - currentOffset.y) / currentZoom;
    
    const newOffset = {
      x: mouseX - worldX * newZoom,
      y: mouseY - worldY * newZoom,
    };
    
    // Use animated zoom for all scroll zoom
    animateZoom(newZoom, newOffset);
  }, [isBoardLoaded, isMiddleMouseDown, animateZoom]);

  // Bresenham's line algorithm to get all points between two coordinates
  const getLinePoints = useCallback((x0: number, y0: number, x1: number, y1: number): Array<{x: number, y: number}> => {
    const points: Array<{x: number, y: number}> = [];
    
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;

    let x = x0;
    let y = y0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      points.push({ x, y });

      if (x === x1 && y === y1) break;

      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x += sx;
      }
      if (e2 < dx) {
        err += dx;
        y += sy;
      }
    }

    return points;
  }, []);

  const handlePixelPlace = useCallback((x: number, y: number) => {
    if (isGuest) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to place pixels',
        variant: 'destructive',
      });
      return;
    }

    const key = `${x},${y}`;
    const currentPixel = pixels[y]?.[x];
    const currentColor = currentPixel?.color || null;
    const newColor = selectedColorRef.current;
    
    // Check if there's a pending pixel at this location
    const pendingPixel = pendingPixelsRef.current.get(key);
    const effectiveCurrentColor = pendingPixel ? pendingPixel.color : currentColor;

    // Don't add if same color as effective current color (including pending)
    if (effectiveCurrentColor === newColor) {
      // If it's in pending and same as original, remove it from pending
      if (pendingPixel && currentColor === newColor) {
        setPendingPixels((prev) => {
          const newMap = new Map(prev);
          newMap.delete(key);
          return newMap;
        });
      }
      return;
    }

    // If there's already a pending pixel here, allow changing its color without quota check
    // This allows users to change their mind about pending pixels
    if (!pendingPixel) {
      // Only check quota if this is a new pending pixel (not modifying an existing pending one)
      // User can modify their own pixels even with 0 quota
      const isOwnPixel = currentPixel?.placedBy === currentUserId;
      const willNeedQuota = !isOwnPixel;
      
      if (willNeedQuota && availableQuota <= 0) {
        // Don't show toast, just prevent placement - circular progress will flash red
        if (onQuotaExceeded) {
          onQuotaExceeded();
        }
        return;
      }
    }

    // Add to pending pixels
    setPendingPixels((prev) => {
      const newMap = new Map(prev);
      newMap.set(key, {
        x,
        y,
        color: newColor,
        originalColor: currentColor,
      });
      return newMap;
    });
  }, [isGuest, pixels, toast, currentUserId, availableQuota]);

  const handleFitToScreen = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Calculate zoom to fit the board in the canvas
    const horizontalZoom = (canvas.width * 0.9) / board.width;
    const verticalZoom = (canvas.height * 0.9) / board.height;
    const fitZoom = Math.max(2, Math.min(50, Math.floor(Math.min(horizontalZoom, verticalZoom))));

    // Center the board
    const centerX = (canvas.width - board.width * fitZoom) / 2;
    const centerY = (canvas.height - board.height * fitZoom) / 2;

    animateZoom(fitZoom, { x: centerX, y: centerY });
  }, [board.width, board.height, animateZoom]);

  // Auto-fit to screen first (before pixels are loaded, without animation)
  const hasInitialFitRef = useRef(false);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || hasInitialFitRef.current) return;

    // Wait for canvas to be properly sized and board dimensions to be available
    // Don't wait for pixels - fit screen first, then render when pixels arrive
    if (canvas.width > 0 && canvas.height > 0 && board.width > 0 && board.height > 0) {
      // Use requestAnimationFrame to ensure canvas is ready
      requestAnimationFrame(() => {
        // Calculate zoom to fit the board in the canvas (without animation)
        const horizontalZoom = (canvas.width * 0.9) / board.width;
        const verticalZoom = (canvas.height * 0.9) / board.height;
        const fitZoom = Math.max(2, Math.min(50, Math.floor(Math.min(horizontalZoom, verticalZoom))));

        // Center the board
        const centerX = (canvas.width - board.width * fitZoom) / 2;
        const centerY = (canvas.height - board.height * fitZoom) / 2;

        // Set zoom and offset directly without animation
        setZoom(fitZoom);
        setOffset({ x: centerX, y: centerY });
        hasInitialFitRef.current = true;
      });
    }
  }, [board.width, board.height]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isBoardLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const gridX = Math.floor((mouseX - currentOffset.x) / currentZoom);
    const gridY = Math.floor((mouseY - currentOffset.y) / currentZoom);

    if (e.button === 0 && !isGuest) {
      // Left click - start painting mode
      setIsPainting(true);
      if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
        handlePixelPlace(gridX, gridY);
      }
    } else if (e.button === 1) {
      // Middle click - check for double click (fit to screen) or start panning
      e.preventDefault(); // Prevent default middle-click behavior
      const now = Date.now();
      const timeSinceLastClick = now - lastMiddleClickTime;
      
      if (timeSinceLastClick < 300) {
        // Double click - fit to screen (animated)
        const canvas = canvasRef.current;
        if (canvas) {
          const horizontalZoom = (canvas.width * 0.9) / board.width;
          const verticalZoom = (canvas.height * 0.9) / board.height;
          const fitZoom = Math.max(2, Math.min(50, Math.floor(Math.min(horizontalZoom, verticalZoom))));
          const centerX = (canvas.width - board.width * fitZoom) / 2;
          const centerY = (canvas.height - board.height * fitZoom) / 2;
          animateZoom(fitZoom, { x: centerX, y: centerY });
        }
        setLastMiddleClickTime(0); // Reset to prevent triple-click issues
      } else {
        // Single click - start panning and track middle mouse state
        setIsDragging(true);
        setIsMiddleMouseDown(true);
        setDragStart({ x: e.clientX - currentOffset.x, y: e.clientY - currentOffset.y });
        setLastMiddleClickTime(now);
      }
    } else if (e.button === 2) {
      // Right click - start erasing mode for pending pixels only
      if (!isGuest) {
        setIsErasing(true);
        if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
          const key = `${gridX},${gridY}`;
          const pendingPixel = pendingPixelsRef.current.get(key);
          
          // If there's a pending change, remove it
          if (pendingPixel) {
            setPendingPixels((prev) => {
              const newMap = new Map(prev);
              newMap.delete(key);
              return newMap;
            });
          }
        }
      }
    }
  }, [board.width, board.height, isGuest, handlePixelPlace, lastMiddleClickTime, handleFitToScreen, isBoardLoaded]);

  const lastMouseMoveRef = useRef({ x: -1, y: -1 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isBoardLoaded) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const gridX = Math.floor((mouseX - currentOffset.x) / currentZoom);
    const gridY = Math.floor((mouseY - currentOffset.y) / currentZoom);

    if (isDragging) {
      // Panning mode
      const newOffset = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      };
      setOffset(newOffset);
    } else if (isPainting && !isGuest) {
      // Painting mode - paint while dragging with line interpolation
      const lastMove = lastMouseMoveRef.current;
      if (gridX !== lastMove.x || gridY !== lastMove.y) {
        // Always interpolate if we have a valid last position
        if (lastMove.x !== -1 && lastMove.y !== -1) {
          // Get all points along the line from last position to current
          const linePoints = getLinePoints(lastMove.x, lastMove.y, gridX, gridY);
          
          // Paint all points along the line, but skip the first point
          // since it's the same as lastMove (already processed)
          for (let i = 1; i < linePoints.length; i++) {
            const point = linePoints[i];
            if (point.x >= 0 && point.x < board.width && point.y >= 0 && point.y < board.height) {
              handlePixelPlace(point.x, point.y);
            }
          }
        } else {
          // First point after mouse down, just place the pixel
          if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
            handlePixelPlace(gridX, gridY);
          }
        }
        
        // Always update last position after processing
        lastMouseMoveRef.current = { x: gridX, y: gridY };
        
        // Update hover indicator
        if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
          setHoveredCell({ x: gridX, y: gridY });
        } else {
          setHoveredCell(null);
        }
      }
    } else if (isErasing && !isGuest) {
      // Erasing mode - erase pending pixels while dragging with line interpolation
      const lastMove = lastMouseMoveRef.current;
      if (gridX !== lastMove.x || gridY !== lastMove.y) {
        // Always interpolate if we have a valid last position
        if (lastMove.x !== -1 && lastMove.y !== -1) {
          // Get all points along the line from last position to current
          const linePoints = getLinePoints(lastMove.x, lastMove.y, gridX, gridY);
          
          // Erase all pending pixels along the line, but skip the first point
          // since it's the same as lastMove (already processed)
          for (let i = 1; i < linePoints.length; i++) {
            const point = linePoints[i];
            if (point.x >= 0 && point.x < board.width && point.y >= 0 && point.y < board.height) {
              const key = `${point.x},${point.y}`;
              const pendingPixel = pendingPixelsRef.current.get(key);
              
              // If there's a pending change, remove it
              if (pendingPixel) {
                setPendingPixels((prev) => {
                  const newMap = new Map(prev);
                  newMap.delete(key);
                  return newMap;
                });
              }
            }
          }
        } else {
          // First point after mouse down, try to erase
          if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
            const key = `${gridX},${gridY}`;
            const pendingPixel = pendingPixelsRef.current.get(key);
            
            if (pendingPixel) {
              setPendingPixels((prev) => {
                const newMap = new Map(prev);
                newMap.delete(key);
                return newMap;
              });
            }
          }
        }
        
        // Always update last position after processing
        lastMouseMoveRef.current = { x: gridX, y: gridY };
        
        // Update hover indicator
        if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
          setHoveredCell({ x: gridX, y: gridY });
        } else {
          setHoveredCell(null);
        }
      }
    } else {
      // Just hovering - update hover indicator
      const lastMove = lastMouseMoveRef.current;
      if (gridX !== lastMove.x || gridY !== lastMove.y) {
        lastMouseMoveRef.current = { x: gridX, y: gridY };
        
        if (gridX >= 0 && gridX < board.width && gridY >= 0 && gridY < board.height) {
          setHoveredCell({ x: gridX, y: gridY });
        } else {
          setHoveredCell(null);
        }
      }
    }
  }, [isDragging, isPainting, isErasing, dragStart, board.width, board.height, isGuest, handlePixelPlace, getLinePoints, pendingPixelsRef, isBoardLoaded]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (!isBoardLoaded) return;
    // Save to history when finishing painting or erasing
    if (isPainting || isErasing) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(new Map(pendingPixels));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    if (e.button === 1) {
      // Middle mouse button released
      setIsMiddleMouseDown(false);
    }
    setIsDragging(false);
    setIsPainting(false);
    setIsErasing(false);
  }, [isPainting, isErasing, history, historyIndex, pendingPixels, isBoardLoaded]);

  const handleMouseLeave = useCallback(() => {
    if (!isBoardLoaded) return;
    // Save to history when leaving while painting or erasing
    if (isPainting || isErasing) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(new Map(pendingPixels));
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    }
    setIsMiddleMouseDown(false);
    setIsDragging(false);
    setIsPainting(false);
    setIsErasing(false);
    setHoveredCell(null);
  }, [isPainting, isErasing, history, historyIndex, pendingPixels, isBoardLoaded]);

  const handleApplyChanges = useCallback(async () => {
    if (pendingPixels.size === 0) return;

    if (!onBatchPixelPlace) {
      toast({
        title: 'Error',
        description: 'Batch pixel placement is required',
        variant: 'destructive',
      });
      return;
    }

    // Send ALL visible pending pixels - no trimming
    // Quota validation will be handled by the backend
    const pixelsToPlace = Array.from(pendingPixels.values()).map((p) => ({
      x: p.x,
      y: p.y,
      color: p.color,
    }));

    try {
      await onBatchPixelPlace(pixelsToPlace);
      
      // Clear pending pixels and reset history after successful submission
      setPendingPixels(new Map());
      setHistory([new Map()]);
      setHistoryIndex(0);
      
      toast({
        title: 'Pixels applied!',
        description: `Successfully placed ${pixelsToPlace.length} pixel${pixelsToPlace.length !== 1 ? 's' : ''}`,
      });
    } catch (error) {
      logger('pixel').error('Error applying pixels:', error);
      toast({
        title: 'Error',
        description: 'Failed to apply pixels. Please try again.',
        variant: 'destructive',
      });
    }
  }, [pendingPixels, onBatchPixelPlace, toast]);

  const handleClearPending = useCallback(() => {
    setPendingPixels(new Map());
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(new Map());
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    toast({
      title: 'Changes cleared',
      description: 'All pending pixels have been cleared',
    });
  }, [toast, history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setPendingPixels(new Map(history[newIndex]));
    }
    if (onUndoRequest) {
      onUndoRequest();
    }
  }, [historyIndex, history, onUndoRequest]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setPendingPixels(new Map(history[newIndex]));
    }
    if (onRedoRequest) {
      onRedoRequest();
    }
  }, [historyIndex, history, onRedoRequest]);

  const handleZoomIn = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const zoomFactor = 1.2; // 20% zoom per button click
    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const newZoom = Math.min(50, currentZoom * zoomFactor);
    
    // Zoom towards screen center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const worldX = (centerX - currentOffset.x) / currentZoom;
    const worldY = (centerY - currentOffset.y) / currentZoom;
    
    const newOffset = {
      x: centerX - worldX * newZoom,
      y: centerY - worldY * newZoom,
    };
    
    animateZoom(newZoom, newOffset);
  }, [animateZoom]);

  const handleZoomOut = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const zoomFactor = 1.2; // 20% zoom per button click
    const currentZoom = zoomRef.current;
    const currentOffset = offsetRef.current;
    const newZoom = Math.max(2, currentZoom / zoomFactor);
    
    // Zoom towards screen center
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    
    const worldX = (centerX - currentOffset.x) / currentZoom;
    const worldY = (centerY - currentOffset.y) / currentZoom;
    
    const newOffset = {
      x: centerX - worldX * newZoom,
      y: centerY - worldY * newZoom,
    };
    
    animateZoom(newZoom, newOffset);
  }, [animateZoom]);

  const handleResetView = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const centerX = (canvas.width - board.width * 10) / 2;
    const centerY = (canvas.height - board.height * 10) / 2;

    animateZoom(10, { x: centerX, y: centerY });
  }, [board.width, board.height, animateZoom]);

  // Expose methods to parent via ref (after all handlers are defined)
  useImperativeHandle(ref, () => ({
    applyChanges: handleApplyChanges,
    clearPending: handleClearPending,
    zoomIn: handleZoomIn,
    zoomOut: handleZoomOut,
    resetView: handleResetView,
    undo: handleUndo,
    redo: handleRedo,
  }), [handleApplyChanges, handleClearPending, handleZoomIn, handleZoomOut, handleResetView, handleUndo, handleRedo]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Undo/redo functions are exposed via ref (useImperativeHandle)

  // Listen for fullscreen changes and notify parent
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isFullscreenNow = !!document.fullscreenElement;
      if (onFullscreenChange) {
        onFullscreenChange(isFullscreenNow);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [onFullscreenChange]);

  return (
    <div ref={containerRef} className="absolute inset-0 bg-canvas-dark">
      <canvas
        ref={canvasRef}
        className={`w-full h-full ${isDragging ? 'cursor-grabbing' : 'cursor-crosshair'} ${!isBoardLoaded ? 'pointer-events-none' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      />

      {/* Info Display - Bottom Left */}
      <div className={`absolute bottom-6 left-4 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-2 text-sm z-10 pointer-events-none transition-all duration-300 ease-out ${
        showInfoDisplay 
          ? 'translate-x-0 translate-y-0 opacity-100' 
          : '-translate-x-full translate-y-full opacity-0'
      }`}>
        <p className="font-mono" style={{ color: '#929bc9' }}>
          {zoom.toFixed(0)}x{hoveredCell && ` | (${hoveredCell.x + 1}, ${hoveredCell.y + 1})`}
        </p>
      </div>


      {/* Guest Notice */}
      {isGuest && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-yellow-400/20 backdrop-blur-xl border border-yellow-400/30 rounded-2xl px-4 py-2 text-sm" style={{ color: '#929bc9' }}>
            You are viewing as a guest. Sign in to place pixels.
          </div>
        </div>
      )}

    </div>
  );
});

PixelBoard.displayName = 'PixelBoard';



