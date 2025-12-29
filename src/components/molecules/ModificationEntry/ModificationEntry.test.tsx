import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { ModificationEntry } from './ModificationEntry';
import { DenseModification, Board } from '@/types';

// Mock firebase/firestore
jest.mock('firebase/firestore', () => ({
  Timestamp: {
    now: jest.fn(() => ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: jest.fn(() => new Date()),
      toMillis: jest.fn(() => Date.now()),
    })),
    fromDate: jest.fn((date) => ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: jest.fn(() => date),
      toMillis: jest.fn(() => date.getTime()),
    })),
  },
}));

// Import Timestamp after mock
import { Timestamp } from 'firebase/firestore';

// Mock modification service
jest.mock('@/services/modification.service', () => ({
  getModificationCount: jest.fn((mod) => mod.changedPixelsCount),
  toggleModificationEnabled: jest.fn(() => Promise.resolve({ success: true })),
  decodePixelsFromBase36: jest.fn(() => Array(25).fill('#FF0000')),
}));

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  ownerId: 'owner-1',
  ownerUsername: 'owner',
  width: 100,
  height: 100,
  maxPixels: 10000,
  createdAt: Timestamp.now(),
  isPublic: true,
};

const mockModification: DenseModification = {
  id: 'mod-1',
  boardId: 'board-1',
  x: 10,
  y: 10,
  w: 5,
  h: 5,
  pixels: '1234567890123456789012345',
  changedPixelsCount: 25,
  enabled: true,
  userId: 'user-1',
  username: 'testuser',
  createdAt: Timestamp.now(),
};

describe('ModificationEntry', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <ModificationEntry
        modification={mockModification}
        board={mockBoard}
        currentUserId="user-2"
        boardOwnerId="owner-1"
        boardId="board-1"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot as owner', () => {
    const { container } = render(
      <ModificationEntry
        modification={mockModification}
        board={mockBoard}
        currentUserId="owner-1"
        boardOwnerId="owner-1"
        boardId="board-1"
      />
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when disabled', () => {
    const { container } = render(
      <ModificationEntry
        modification={{ ...mockModification, enabled: false }}
        board={mockBoard}
        currentUserId="owner-1"
        boardOwnerId="owner-1"
        boardId="board-1"
      />
    );
    expect(container).toMatchSnapshot();
  });
});
