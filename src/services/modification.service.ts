import {
  collection,
  doc,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit as firestoreLimit,
} from 'firebase/firestore';
import { db, getDocs } from '@/lib/firebase';
import { DenseModification, Pixel, Board } from '@/types';
import { getBoard } from './board.service';
import { COLOR_PALETTES } from '@/components/ColorPicker';
import pako from 'pako';

/**
 * Get palette colors from board (customPalette or classic palette)
 */
const getBoardPalette = (board: Board): string[] => {
  if (board.customPalette && board.customPalette.length > 0) {
    return board.customPalette;
  }
  // Fallback to classic palette
  return COLOR_PALETTES[0].colors;
};

/**
 * Convert color to palette index
 */
export const colorToIndex = (color: string, board: Board): number => {
  const palette = getBoardPalette(board);
  const index = palette.indexOf(color);
  return index !== -1 ? index : 0; // Default to first color if not found
};

/**
 * Convert palette index to color
 */
export const indexToColor = (index: number, board: Board): string => {
  const palette = getBoardPalette(board);
  if (index >= 0 && index < palette.length) {
    return palette[index];
  }
  // Fallback
  return palette[0] || '#FFFFFF';
};

/**
 * Convert palette index to base36 character
 * 0 = transparent, 1-8 = palette indices 0-7, 9-z = extended palette indices 8-35
 * Note: 'a'-'z' is 26 letters, so we map indices 9-34 to 'a'-'z' (26 values)
 * This gives us support for up to 35 palette colors (indices 0-34)
 */
const indexToBase36 = (index: number | null): string => {
  if (index === null) {
    return '0'; // Transparent
  }
  if (index < 8) {
    return String(index + 1); // 1-8 for palette indices 0-7
  }
  if (index === 8) {
    return '9';
  }
  if (index >= 9 && index <= 34) {
    // a-z for indices 9-34 (26 values)
    return String.fromCharCode(97 + (index - 9)); // 'a' = 97, index 9 -> 'a', index 34 -> 'z'
  }
  // Fallback to transparent if index out of range (35+ not supported)
  return '0';
};

/**
 * Convert base36 character to palette index
 * '0' = transparent (null), '1'-'8' = palette indices 0-7, '9', 'a'-'z' = extended palette indices 8-34
 */
const base36ToIndex = (char: string): number | null => {
  if (char === '0') {
    return null; // Transparent
  }
  const code = char.charCodeAt(0);
  if (code >= 49 && code <= 56) { // '1'-'8'
    return code - 49; // 0-7
  }
  if (char === '9') {
    return 8;
  }
  if (code >= 97 && code <= 122) { // 'a'-'z'
    return code - 97 + 9; // 9-34
  }
  // Invalid character, return transparent
  return null;
};

/**
 * Convert color to base36 character
 */
export const colorToBase36Index = (color: string, board: Board): string => {
  const index = colorToIndex(color, board);
  return indexToBase36(index);
};

/**
 * Convert base36 character to color
 */
export const base36IndexToColor = (base36Char: string, board: Board): string | null => {
  const index = base36ToIndex(base36Char);
  if (index === null) {
    return null; // Transparent
  }
  return indexToColor(index, board);
};

/**
 * Encode pixels array to base36 string, then compress with gzip and encode as base64
 * @param pixels Array of colors (hex strings) or indices (numbers) or null
 * @param board Board to get palette from
 * @returns Object with compressed base64 string and compression stats
 */
export const encodePixelsToBase36 = (
  pixels: (string | number | null)[],
  board: Board
): { compressed: string; originalSize: number; compressedSize: number; ratio: number } => {
  // First, create base36 string
  let base36String = '';
  
  for (const pixel of pixels) {
    if (pixel === null) {
      base36String += '0'; // Transparent
    } else if (typeof pixel === 'number') {
      // Already an index
      base36String += indexToBase36(pixel);
    } else {
      // Color string - convert to index first
      const index = colorToIndex(pixel, board);
      base36String += indexToBase36(index);
    }
  }
  
  const originalSize = base36String.length;
  
  // Compress with gzip (level 9 = maximum compression)
  const compressed = pako.gzip(base36String, { level: 9 });
  
  // Convert to base64 string for storage
  const base64 = btoa(String.fromCharCode(...compressed));
  const compressedSize = base64.length;
  
  // Calculate compression ratio (original / compressed)
  const ratio = originalSize > 0 ? (originalSize / compressedSize) * 100 : 0;
  
  return {
    compressed: base64,
    originalSize,
    compressedSize,
    ratio,
  };
};

/**
 * Decode gzip-compressed base64 string to pixels array
 * @param compressedBase64 Gzip-compressed base64 string
 * @param board Board to get palette from
 * @returns Array of colors (hex strings) or null for transparent
 */
export const decodePixelsFromBase36 = (
  compressedBase64: string,
  board: Board
): (string | null)[] => {
  // Decode base64 to Uint8Array
  const binaryString = atob(compressedBase64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Decompress gzip
  const decompressed = pako.ungzip(bytes, { to: 'string' });
  
  // Now decode base36 string to colors
  const result: (string | null)[] = [];
  
  for (let i = 0; i < decompressed.length; i++) {
    const char = decompressed[i];
    const color = base36IndexToColor(char, board);
    result.push(color);
  }
  
  return result;
};

/**
 * Create and save a dense modification
 */
export const createDenseModification = async (
  boardId: string,
  userId: string,
  username: string,
  x: number,
  y: number,
  w: number,
  h: number,
  pixels: (string | number | null)[],
  enabled: boolean = true
): Promise<DenseModification> => {
  try {
    // Validate pixels array length
    if (pixels.length !== w * h) {
      throw new Error(`Pixels array length (${pixels.length}) must equal w * h (${w * h})`);
    }

    // Get board to encode pixels
    const board = await getBoard(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Encode pixels array to base36 string (compressed)
    const encodingResult = encodePixelsToBase36(pixels, board);
    const pixelsBase36 = encodingResult.compressed;

    // Log compression stats
    if (encodingResult.originalSize > 0) {
      const compressionPercent = encodingResult.ratio.toFixed(1);
      const savings = ((encodingResult.originalSize - encodingResult.compressedSize) / encodingResult.originalSize * 100).toFixed(1);
      console.log(
        `[Compression] ${encodingResult.originalSize} => ${encodingResult.compressedSize} chars ` +
        `(${compressionPercent}% ratio, ${savings}% savings)`
      );
    }

    // Count non-transparent pixels before compression
    const changedPixelsCount = pixels.filter((p) => p !== null).length;

    const now = Timestamp.now();
    const modificationId = `${userId}_${now.toMillis()}_${Math.random().toString(36).substr(2, 9)}`;

    const modification: DenseModification = {
      id: modificationId,
      boardId,
      x,
      y,
      w,
      h,
      pixels: pixelsBase36,
      changedPixelsCount,
      enabled,
      userId,
      username,
      createdAt: now,
    };

    const modificationRef = doc(db, 'boards', boardId, 'dense_modifications', modificationId);
    await setDoc(modificationRef, modification);

    return modification;
  } catch (error) {
    console.error('Error creating dense modification:', error);
    throw error;
  }
};

/**
 * Get all dense modifications for a board
 */
export const getBoardModifications = async (
  boardId: string,
  limitCount: number = 50
): Promise<DenseModification[]> => {
  try {
    const modificationsRef = collection(db, 'boards', boardId, 'dense_modifications');
    const q = query(
      modificationsRef,
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as DenseModification);
  } catch (error) {
    console.error('Error getting board modifications:', error);
    throw error;
  }
};

/**
 * Get modifications since a specific timestamp
 */
export const getModificationsSince = async (
  boardId: string,
  sinceTimestamp: Timestamp
): Promise<DenseModification[]> => {
  try {
    const modificationsRef = collection(db, 'boards', boardId, 'dense_modifications');
    const q = query(
      modificationsRef,
      where('createdAt', '>=', sinceTimestamp),
      orderBy('createdAt', 'asc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as DenseModification);
  } catch (error) {
    console.error('Error getting modifications since timestamp:', error);
    throw error;
  }
};

/**
 * Get all dense modifications for a specific user
 */
export const getUserModifications = async (
  boardId: string,
  userId: string,
  limitCount: number = 50
): Promise<DenseModification[]> => {
  try {
    const modificationsRef = collection(db, 'boards', boardId, 'dense_modifications');
    const q = query(
      modificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      firestoreLimit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => doc.data() as DenseModification);
  } catch (error) {
    console.error('Error getting user modifications:', error);
    throw error;
  }
};

/**
 * Replay dense modifications to rebuild board state
 * Returns a 2D array of pixels representing the current board state
 */
export const replayModifications = async (
  boardId: string,
  width: number,
  height: number,
  untilTimestamp?: Timestamp
): Promise<(Pixel | null)[][]> => {
  try {
    // Initialize empty board
    const board: (Pixel | null)[][] = Array(height)
      .fill(null)
      .map(() => Array(width).fill(null));

    // Get all modifications
    const modificationsRef = collection(db, 'boards', boardId, 'dense_modifications');
    let q = query(modificationsRef, orderBy('createdAt', 'asc'));

    if (untilTimestamp) {
      q = query(
        modificationsRef,
        where('createdAt', '<=', untilTimestamp),
        orderBy('createdAt', 'asc')
      );
    }

    const querySnapshot = await getDocs(q);
    const modifications = querySnapshot.docs.map((doc) => doc.data() as DenseModification);

    // Get board once to check for customPalette
    const boardData = await getBoard(boardId);
    if (!boardData) {
      return board;
    }

    // Replay each modification in chronological order
    for (const mod of modifications) {
      // Skip disabled modifications
      if (!mod.enabled) {
        continue;
      }

      // Skip if modification is outside board bounds
      if (mod.x + mod.w < 0 || mod.x >= width || mod.y + mod.h < 0 || mod.y >= height) {
        continue;
      }

      // Decode base36 string to colors array
      const decodedPixels = decodePixelsFromBase36(mod.pixels, boardData);

      // Apply pixels from the decoded array
      for (let row = 0; row < mod.h; row++) {
        for (let col = 0; col < mod.w; col++) {
          const pixelIndex = row * mod.w + col;
          const pixelColor = decodedPixels[pixelIndex];

          // Skip transparent pixels
          if (pixelColor === null) {
            continue;
          }

          const boardX = mod.x + col;
          const boardY = mod.y + row;

          // Check bounds
          if (boardX >= 0 && boardX < width && boardY >= 0 && boardY < height) {
            board[boardY][boardX] = {
              color: pixelColor,
              placedBy: mod.userId,
              placedByUsername: mod.username,
              placedAt: mod.createdAt,
              denseModificationId: mod.id,
            };
          }
        }
      }
    }

    return board;
  } catch (error) {
    console.error('Error replaying modifications:', error);
    throw error;
  }
};

/**
 * Get modification count (number of changed pixels) for a dense modification
 */
export const getModificationCount = (modification: DenseModification): number => {
  return modification.changedPixelsCount;
};

/**
 * Toggle the enabled status of a modification
 * Only board owners can toggle modifications
 */
export const toggleModificationEnabled = async (
  boardId: string,
  modificationId: string,
  userId: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Verify board ownership
    const board = await getBoard(boardId);
    if (!board) {
      return { success: false, error: 'Board not found' };
    }

    if (board.ownerId !== userId) {
      return { success: false, error: 'Only board owner can toggle modifications' };
    }

    // Update the modification's enabled field
    const modificationRef = doc(db, 'boards', boardId, 'dense_modifications', modificationId);
    await updateDoc(modificationRef, { enabled });

    return { success: true };
  } catch (error) {
    console.error('Error toggling modification enabled status:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to toggle modification' };
  }
};
