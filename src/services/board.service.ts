import {
  doc,
  setDoc,
  collection,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db, getDoc, getDocs } from '@/lib/firebase';
import { Board, Pixel } from '@/types';
import { validateBoardDimensions } from '@/lib/config';
import { replayModifications } from './modification.service';
import { logError } from './analytics.service';
import { logger } from '@/lib/logger';

export const createBoard = async (
  ownerId: string,
  ownerUsername: string,
  name: string,
  width: number,
  height: number,
  isPublic: boolean = true,
  isSpecialEvent: boolean = false,
  specialEventPixels?: number,
  customPalette?: string[]
): Promise<Board> => {
  try {
    // Validate dimensions
    if (!validateBoardDimensions(width, height)) {
      throw new Error(
        'Board dimensions exceed maximum allowed pixels (400,000)'
      );
    }

    const boardRef = doc(collection(db, 'boards'));
    const board: Board = {
      id: boardRef.id,
      name,
      ownerId,
      ownerUsername,
      width,
      height,
      maxPixels: width * height,
      createdAt: Timestamp.now(),
      isPublic,
      isSpecialEvent,
      ...(specialEventPixels !== undefined && { specialEventPixels }),
      ...(customPalette !== undefined && { customPalette }),
    };

    await setDoc(boardRef, board);

    return board;
  } catch (error) {
    logger('board').error('Error creating board:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Board Creation Error', errorMessage, 'board.service', {
      owner_id: ownerId,
      board_name: name,
      width,
      height,
    });
    throw error;
  }
};

export const getBoard = async (boardId: string): Promise<Board | null> => {
  try {
    const boardDoc = await getDoc(doc(db, 'boards', boardId));
    if (!boardDoc.exists()) {
      return null;
    }
    return boardDoc.data() as Board;
  } catch (error) {
    logger('board').error('Error getting board:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Get Board Error', errorMessage, 'board.service', { board_id: boardId });
    throw error;
  }
};

export const getBoardByName = async (name: string): Promise<Board | null> => {
  try {
    const boardsRef = collection(db, 'boards');
    // Query for public boards first (this works with Firestore rules)
    const q = query(
      boardsRef,
      where('name', '==', name),
      where('isPublic', '==', true)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as Board;
    }

    // If not found in public boards, return null
    // Private boards should be accessed by ID, not by name
    return null;
  } catch (error) {
    logger('board').error('Error getting board by name:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Get Board By Name Error', errorMessage, 'board.service', { board_name: name });
    throw error;
  }
};

/**
 * Check if a board with the given name already exists (both public and private)
 * @param name - The board name to check
 * @param userId - Optional user ID to also check their private boards
 * @returns true if a board with this name exists, false otherwise
 */
export const checkBoardNameExists = async (
  name: string,
  userId?: string
): Promise<boolean> => {
  try {
    const boardsRef = collection(db, 'boards');
    
    // Check public boards (anyone can see public boards)
    const publicQuery = query(
      boardsRef,
      where('name', '==', name),
      where('isPublic', '==', true)
    );
    const publicSnapshot = await getDocs(publicQuery);
    
    if (!publicSnapshot.empty) {
      return true;
    }
    
    // If userId is provided, also check user's own private boards
    // Note: Firestore security rules will only allow access to user's own private boards
    if (userId) {
      const privateQuery = query(
        boardsRef,
        where('name', '==', name),
        where('isPublic', '==', false),
        where('ownerId', '==', userId)
      );
      const privateSnapshot = await getDocs(privateQuery);
      
      if (!privateSnapshot.empty) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    logger('board').error('Error checking board name existence:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logError('Check Board Name Exists Error', errorMessage, 'board.service', { board_name: name });
    throw error;
  }
};


export const getAllBoards = async (userId?: string): Promise<Board[]> => {
  try {
    const boardsRef = collection(db, 'boards');
    
    // Query only public boards (this works with Firestore rules)
    const q = query(boardsRef, where('isPublic', '==', true));
    const querySnapshot = await getDocs(q);

    let boards = querySnapshot.docs.map((doc) => doc.data() as Board);
    
    // If user is authenticated, also fetch their private boards
    if (userId) {
      const privateBoardsQuery = query(
        boardsRef,
        where('ownerId', '==', userId),
        where('isPublic', '==', false)
      );
      const privateSnapshot = await getDocs(privateBoardsQuery);
      const privateBoards = privateSnapshot.docs.map((doc) => doc.data() as Board);
      boards = [...boards, ...privateBoards];
    }

    return boards;
  } catch (error) {
    logger('board').error('Error getting all boards:', error);
    throw error;
  }
};

/**
 * Get board pixels by replaying all dense modifications
 * This is the single source of truth - all board state comes from modifications
 */
export const getBoardPixels = async (
  boardId: string
): Promise<(Pixel | null)[][]> => {
  try {
    const board = await getBoard(boardId);
    if (!board) {
      throw new Error('Board not found');
    }

    // Replay all modifications to get current state
    return await replayModifications(boardId, board.width, board.height);
  } catch (error) {
    logger('board').error('Error getting board pixels:', error);
    throw error;
  }
};

