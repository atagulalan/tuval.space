import { Timestamp } from 'firebase/firestore';

export interface User {
  uid: string;
  username: string;
  email: string;
  pixelQuota: number;
  lastQuotaReset: Timestamp;
  createdAt: Timestamp;
  boards: Board[]; // Array of board objects (max 10) - denormalized for performance
}

export interface Board {
  id: string;
  name: string;
  ownerId: string;
  ownerUsername: string;
  width: number;
  height: number;
  maxPixels: number;
  createdAt: Timestamp;
  isPublic: boolean; // If false, only owner can see the board
  isSpecialEvent?: boolean;
  specialEventPixels?: number;
  customPalette?: string[]; // Custom 8-color palette array (for imported images)
}

export interface Pixel {
  color: string; // Hex color code
  placedBy: string; // User ID
  placedByUsername: string; // Username for display
  placedAt: Timestamp;
  denseModificationId?: string; // Reference to source dense modification
}

// Dense modification type for efficient pixel storage
export interface DenseModification {
  id: string;
  boardId: string;
  x: number;        // Top-left corner X coordinate
  y: number;        // Top-left corner Y coordinate
  w: number;        // Width of the region
  h: number;        // Height of the region
  pixels: string;   // Base36 encoded string of length w*h, row-major order. Encoding: 0=transparent, 1-8=palette indices 0-7, 9-z=extended palette indices 8-35
  changedPixelsCount: number;  // Number of non-transparent pixels (non-'0' characters)
  enabled: boolean;  // Whether this modification is enabled (default: true)
  userId: string;
  username: string;
  createdAt: Timestamp;  // Single timestamp for the entire modification
}

// Legacy types (kept for backward compatibility during migration)
export interface Change {
  id: string;
  userId: string;
  username: string;
  boardId: string;
  pixels: PixelChange[];
  timestamp: Timestamp;
  mergedWith?: string[]; // IDs of merged changes
  isDismissedBy?: string[]; // User IDs who dismissed this change
}

export interface PixelChange {
  x: number;
  y: number;
  oldColor: string | null;
  newColor: string;
}

export interface AppConfig {
  defaultPixelQuota: number;
  maxPixelAccumulation: number;
  maxBoardsPerUser: number;
  maxBoardPixels: number;
  changeMergeWindowHours: number;
  defaultBoardWidth: number;
  defaultBoardHeight: number;
}


