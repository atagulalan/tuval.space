import { getUser, updateUserQuota } from './user.service';
import { createDenseModification } from './modification.service';
import { validateColor } from '@/lib/utils';
import { getBoard, getBoardPixels } from './board.service';
import { logError } from './analytics.service';
import { logger } from '@/lib/logger';
import { retryWithBackoff } from '@/lib/retry';

export interface PlacePixelResult {
  success: boolean;
  error?: string;
}

export const placePixel = async (
  boardId: string,
  userId: string,
  username: string,
  x: number,
  y: number,
  color: string
): Promise<PlacePixelResult> => {
  try {
    // Validate color
    if (!validateColor(color)) {
      return { success: false, error: 'Invalid color format' };
    }

    // Validate coordinates first
    const board = await getBoard(boardId);
    if (!board) {
      return { success: false, error: 'Board not found' };
    }

    if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
      return { success: false, error: 'Invalid coordinates' };
    }

    // Check user quota first (before expensive getBoardPixels call)
    const user = await getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Fetch current pixel state to determine if quota is needed
    // Note: This is expensive but necessary for smart quota logic
    const currentPixels = await getBoardPixels(boardId);
    const currentPixel = currentPixels[y]?.[x];
    const currentColor = currentPixel?.color || null;
    const isOwnPixel = currentPixel?.placedBy === userId;
    const isSameColor = currentColor === color;

    // Check if this pixel needs quota (only if different color and not own pixel)
    const needsQuota = !isSameColor && !isOwnPixel;

    if (needsQuota && user.pixelQuota <= 0) {
      return { success: false, error: 'No pixels remaining' };
    }

    // Create 1x1 dense modification for single pixel (with retry for write operations)
    // Pass color string - createDenseModification will encode it to base36
    const pixels: (string | number | null)[] = [color];
    await retryWithBackoff(
      () =>
        createDenseModification(boardId, userId, username, x, y, 1, 1, pixels, true),
      { maxRetries: 3 }
    );

    // Decrement user quota only if needed (with retry for write operations)
    if (needsQuota) {
      await retryWithBackoff(() => updateUserQuota(userId, -1), { maxRetries: 2 });
    }

    return { success: true };
  } catch (error) {
    logger('pixel').error('Error placing pixel:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Pixel Place Error', errorMessage, 'pixel.service', {
      board_id: boardId,
      user_id: userId,
      x,
      y,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export const placeMultiplePixels = async (
  boardId: string,
  userId: string,
  username: string,
  pixels: { x: number; y: number; color: string }[]
): Promise<PlacePixelResult> => {
  try {
    // Get user first
    const user = await getUser(userId);
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Validate board and coordinates
    const board = await getBoard(boardId);
    if (!board) {
      return { success: false, error: 'Board not found' };
    }

    // Validate all colors and coordinates
    for (const pixel of pixels) {
      if (!validateColor(pixel.color)) {
        return {
          success: false,
          error: `Invalid color format: ${pixel.color}`,
        };
      }
      if (
        pixel.x < 0 ||
        pixel.x >= board.width ||
        pixel.y < 0 ||
        pixel.y >= board.height
      ) {
        return {
          success: false,
          error: `Invalid coordinates: (${pixel.x}, ${pixel.y})`,
        };
      }
    }

    // Fetch current pixel states to determine quota needed
    // Note: This is expensive but necessary for smart quota logic
    const currentPixels = await getBoardPixels(boardId);

    // Calculate how many pixels actually need quota
    // Quota needed unless same color or user's own pixel
    let quotaNeeded = 0;
    const pixelsNeedingQuota: { x: number; y: number; color: string }[] = [];
    
    for (const pixel of pixels) {
      const currentPixel = currentPixels[pixel.y]?.[pixel.x];
      const currentColor = currentPixel?.color || null;
      const isOwnPixel = currentPixel?.placedBy === userId;
      const isSameColor = currentColor === pixel.color;
      
      // Check if this pixel needs quota (only if different color and not own pixel)
      if (!isSameColor && !isOwnPixel) {
        quotaNeeded++;
        pixelsNeedingQuota.push(pixel);
      }
    }

    // Check if user has enough quota for pixels that need it
    if (user.pixelQuota < quotaNeeded) {
      return {
        success: false,
        error: `Not enough pixels. Required: ${quotaNeeded}, Available: ${user.pixelQuota}`,
      };
    }

    // Calculate bounding box from pixels
    if (pixels.length === 0) {
      return { success: false, error: 'No pixels to place' };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const pixel of pixels) {
      minX = Math.min(minX, pixel.x);
      minY = Math.min(minY, pixel.y);
      maxX = Math.max(maxX, pixel.x);
      maxY = Math.max(maxY, pixel.y);
    }

    const w = maxX - minX + 1;
    const h = maxY - minY + 1;

    // Create dense pixels array (w*h length) in row-major order
    // Use index if board has customPalette, otherwise use color string
    const densePixels: (string | number | null)[] = Array(w * h).fill(null);

    // Map pixels to their positions in the dense array
    const pixelMap = new Map<string, string>();
    for (const pixel of pixels) {
      const key = `${pixel.x},${pixel.y}`;
      pixelMap.set(key, pixel.color);
    }

    // Fill dense array with color strings
    // createDenseModification will encode them to base36
    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const boardX = minX + col;
        const boardY = minY + row;
        const key = `${boardX},${boardY}`;
        const color = pixelMap.get(key);
        if (color) {
          const index = row * w + col;
          densePixels[index] = color;
        }
      }
    }

    // Create dense modification (with retry)
    await retryWithBackoff(
      () =>
        createDenseModification(
          boardId,
          userId,
          username,
          minX,
          minY,
          w,
          h,
          densePixels,
          true
        ),
      { maxRetries: 3 }
    );

    // Decrement user quota only for pixels that need it (with retry)
    if (quotaNeeded > 0) {
      await retryWithBackoff(() => updateUserQuota(userId, -quotaNeeded), {
        maxRetries: 2,
      });
    }

    return { success: true };
  } catch (error) {
    logger('pixel').error('Error placing multiple pixels:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Batch Pixel Place Error', errorMessage, 'pixel.service', {
      board_id: boardId,
      user_id: userId,
      pixel_count: pixels.length,
    });
    return {
      success: false,
      error: errorMessage,
    };
  }
};




