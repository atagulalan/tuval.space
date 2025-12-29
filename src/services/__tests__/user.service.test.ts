import { describe, it, expect, beforeEach } from '@jest/globals';
import { config } from '@/lib/config';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() })),
  },
  increment: jest.fn((val) => val),
}));

describe('User Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Quota Management', () => {
    it('should have correct default pixel quota', () => {
      expect(config.defaultPixelQuota).toBeGreaterThan(0);
    });

    it('should have correct max accumulation factor', () => {
      expect(config.maxPixelAccumulation).toBe(3);
    });

    it('should calculate max pixel quota correctly', () => {
      const maxQuota = config.defaultPixelQuota * config.maxPixelAccumulation;
      expect(maxQuota).toBeGreaterThan(config.defaultPixelQuota);
    });
  });

  describe('Board Limits', () => {
    it('should have max boards per user limit', () => {
      expect(config.maxBoardsPerUser).toBe(10);
    });

    it('should have max pixels per board limit', () => {
      expect(config.maxBoardPixels).toBe(400000);
    });
  });
});












