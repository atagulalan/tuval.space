import {
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  Timestamp,
  increment,
} from 'firebase/firestore';
import { db, getDoc, getDocs } from '@/lib/firebase';
import { User, Board } from '@/types';
import { config, getMaxPixelQuota } from '@/lib/config';
import { createBoard } from './board.service';
import { COLOR_PALETTES } from '@/components/molecules/ColorPicker';
import { isFirebaseError, FIREBASE_ERROR_CODES } from '@/types/errors';
import { logger } from '@/lib/logger';

// Cache for getUserByUsername to reduce Firestore reads
interface CacheEntry {
  user: User | null;
  timestamp: number;
}

const usernameCache = new Map<string, CacheEntry>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Clear expired cache entries
 */
const clearExpiredCache = () => {
  const now = Date.now();
  for (const [key, entry] of usernameCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL) {
      usernameCache.delete(key);
    }
  }
};

/**
 * Invalidate cache for a specific username (call when user data might have changed)
 */
export const invalidateUsernameCache = (username: string) => {
  usernameCache.delete(username.toLowerCase());
};

/**
 * Invalidate all username cache (call when user data might have changed globally)
 */
export const invalidateAllUsernameCache = () => {
  usernameCache.clear();
};

export const checkUsernameAvailability = async (
  username: string
): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

export const getUserByUsername = async (
  username: string
): Promise<User | null> => {
  try {
    const cacheKey = username.toLowerCase();

    // Check cache first
    const cached = usernameCache.get(cacheKey);
    if (cached) {
      const age = Date.now() - cached.timestamp;
      if (age < CACHE_TTL) {
        // Cache hit - return cached data
        return cached.user;
      }
      // Cache expired - remove it
      usernameCache.delete(cacheKey);
    }

    // Clean up expired entries periodically (every 10th call)
    if (usernameCache.size > 0 && Math.random() < 0.1) {
      clearExpiredCache();
    }

    // Cache miss - fetch from Firestore
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);

    const user: User | null = querySnapshot.empty
      ? null
      : (querySnapshot.docs[0].data() as User);

    // Store in cache
    usernameCache.set(cacheKey, {
      user,
      timestamp: Date.now(),
    });

    return user;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
};

export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      return null;
    }
    return userDoc.data() as User;
  } catch (error: unknown) {
    // Handle offline errors gracefully
    if (
      isFirebaseError(error) &&
      (error.code === FIREBASE_ERROR_CODES.UNAVAILABLE ||
        error.message.includes('offline'))
    ) {
      logger('user').warn(
        '⚠️ Firestore offline, attempting to use cached data'
      );
      // Return null to trigger username registration flow or retry
      return null;
    }
    logger('user').error('Error getting user:', error);
    throw error;
  }
};

export const createUser = async (
  uid: string,
  email: string,
  username: string
): Promise<User> => {
  try {
    // Check if username is available
    const isAvailable = await checkUsernameAvailability(username);
    if (!isAvailable) {
      throw new Error('Username is already taken');
    }

    const now = Timestamp.now();
    const newUser: User = {
      uid,
      username,
      email,
      pixelQuota: config.defaultPixelQuota,
      lastQuotaReset: now,
      createdAt: now,
      boards: [],
    };

    await setDoc(doc(db, 'users', uid), newUser);

    // Create default board with username
    // Use classic palette as default customPalette
    const defaultPalette = COLOR_PALETTES[0].colors;
    const board = await createBoard(
      uid,
      username,
      username,
      config.defaultBoardWidth,
      config.defaultBoardHeight,
      true, // isPublic
      false, // isSpecialEvent
      undefined, // specialEventPixels
      defaultPalette // customPalette
    );

    // Update user with board object (denormalized for performance)
    await updateDoc(doc(db, 'users', uid), {
      boards: [board],
    });

    newUser.boards = [board];

    // Invalidate cache for the new username
    invalidateUsernameCache(username);

    return newUser;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUserQuota = async (
  uid: string,
  quotaChange: number
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      pixelQuota: increment(quotaChange),
    });
  } catch (error) {
    console.error('Error updating user quota:', error);
    throw error;
  }
};

export const resetDailyQuota = async (user: User): Promise<User> => {
  try {
    const now = Timestamp.now();
    const lastReset = user.lastQuotaReset.toDate();
    const currentDate = new Date();

    // Check if we're on a different day
    if (
      lastReset.getDate() !== currentDate.getDate() ||
      lastReset.getMonth() !== currentDate.getMonth() ||
      lastReset.getFullYear() !== currentDate.getFullYear()
    ) {
      const maxQuota = getMaxPixelQuota();
      const newQuota = Math.min(
        user.pixelQuota + config.defaultPixelQuota,
        maxQuota
      );

      await updateDoc(doc(db, 'users', user.uid), {
        pixelQuota: newQuota,
        lastQuotaReset: now,
      });

      return {
        ...user,
        pixelQuota: newQuota,
        lastQuotaReset: now,
      };
    }

    return user;
  } catch (error) {
    console.error('Error resetting daily quota:', error);
    throw error;
  }
};

export const canUserCreateBoard = async (uid: string): Promise<boolean> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      return false;
    }
    return user.boards.length < config.maxBoardsPerUser;
  } catch (error) {
    console.error('Error checking if user can create board:', error);
    throw error;
  }
};

/**
 * Get user boards from the denormalized data in user document
 * This is more efficient than querying boards collection
 */
export const getUserBoards = (user: User): Board[] => {
  return user.boards || [];
};

export const addBoardToUser = async (
  uid: string,
  board: Board
): Promise<void> => {
  try {
    const user = await getUser(uid);
    if (!user) {
      throw new Error('User not found');
    }

    if (user.boards.length >= config.maxBoardsPerUser) {
      throw new Error('Maximum number of boards reached');
    }

    await updateDoc(doc(db, 'users', uid), {
      boards: [...user.boards, board],
    });

    // Invalidate cache since user data (boards) has changed
    invalidateUsernameCache(user.username);
  } catch (error) {
    console.error('Error adding board to user:', error);
    throw error;
  }
};
