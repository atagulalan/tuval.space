import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, orderBy } from 'firebase/firestore';
import { db, onSnapshot } from '@/lib/firebase';
import { Pixel, DenseModification, Board } from '@/types';
import { getBoard } from '@/services/board.service';
import { decodePixelsFromBase36 } from '@/services/modification.service';
import { logger } from '@/lib/logger';

/**
 * Replay dense modifications to get current board state
 */
const replayModifications = (
  modifications: DenseModification[],
  width: number,
  height: number,
  board: Board
): (Pixel | null)[][] => {
  // Initialize empty pixel grid
  const pixelGrid: (Pixel | null)[][] = Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));

  // Sort modifications by creation time
  const sortedMods = [...modifications].sort(
    (a, b) => a.createdAt.toMillis() - b.createdAt.toMillis()
  );

  // Replay each modification in chronological order
  for (const mod of sortedMods) {
    // Skip disabled modifications
    if (!mod.enabled) {
      continue;
    }

    // Skip if modification is outside board bounds
    if (mod.x + mod.w < 0 || mod.x >= width || mod.y + mod.h < 0 || mod.y >= height) {
      continue;
    }

    // Decode base36 string to colors array
    const decodedPixels = decodePixelsFromBase36(mod.pixels, board);

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
          pixelGrid[boardY][boardX] = {
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

  return pixelGrid;
};

export const useBoardPixels = (boardId: string | null) => {
  const [pixels, setPixels] = useState<(Pixel | null)[][]>([]);
  const pixelsRef = useRef<(Pixel | null)[][]>([]);
  const boardDimensionsRef = useRef<{ width: number; height: number } | null>(null);
  const boardRef = useRef<Board | null>(null);

  const updatePixels = useCallback(() => {
    // Only trigger re-render with a shallow copy
    setPixels([...pixelsRef.current]);
  }, []);

  useEffect(() => {
    if (!boardId) {
      setPixels([]);
      pixelsRef.current = [];
      boardDimensionsRef.current = null;
      return;
    }

    let unsubscribeBoard: (() => void) | undefined;
    let unsubscribeModifications: (() => void) | undefined;

    // First, get board dimensions
    const loadBoard = async () => {
      const loadStartTime = performance.now();
      const board = await getBoard(boardId);
      if (!board) {
        return;
      }

      const boardLoadTime = performance.now() - loadStartTime;
      logger('board').debug(`[useBoardPixels] Board loaded in ${boardLoadTime.toFixed(2)}ms`);

      // Store board and dimensions
      boardRef.current = board;
      boardDimensionsRef.current = {
        width: board.width,
        height: board.height,
      };

      // Initialize empty grid
      const gridInitStartTime = performance.now();
      const initialPixels: (Pixel | null)[][] = [];
      for (let i = 0; i < board.height; i++) {
        initialPixels[i] = Array(board.width).fill(null);
      }
      pixelsRef.current = initialPixels;
      const gridInitTime = performance.now() - gridInitStartTime;
      logger('board').debug(`[useBoardPixels] Empty grid initialized in ${gridInitTime.toFixed(2)}ms (${board.width}x${board.height})`);

      // Listen to dense modifications
      const modificationsRef = collection(db, 'boards', boardId, 'dense_modifications');
      const q = query(modificationsRef, orderBy('createdAt', 'asc'));

      const snapshotStartTime = performance.now();
      unsubscribeModifications = onSnapshot(
        q,
        (snapshot) => {
          const snapshotTime = performance.now() - snapshotStartTime;
          const replayStartTime = performance.now();
          
          const modifications = snapshot.docs.map(
            (doc) => doc.data() as DenseModification
          );
          
          logger('board').debug(`[useBoardPixels] Snapshot received in ${snapshotTime.toFixed(2)}ms (${modifications.length} modifications)`);

          // Replay all modifications to get current state
          if (boardDimensionsRef.current && boardRef.current) {
            pixelsRef.current = replayModifications(
              modifications,
              boardDimensionsRef.current.width,
              boardDimensionsRef.current.height,
              boardRef.current
            );
            const replayTime = performance.now() - replayStartTime;
            logger('board').debug(`[useBoardPixels] Replay completed in ${replayTime.toFixed(2)}ms`);
            
            const totalTime = performance.now() - loadStartTime;
            logger('board').debug(`[useBoardPixels] Total load time: ${totalTime.toFixed(2)}ms`);
            
            updatePixels();
          }
        },
        (error) => {
          logger('board').error('Error listening to modifications:', error);
        }
      );
    };

    loadBoard();

    return () => {
      if (unsubscribeBoard) {
        unsubscribeBoard();
      }
      if (unsubscribeModifications) {
        unsubscribeModifications();
      }
    };
  }, [boardId, updatePixels]);

  return pixels;
};
