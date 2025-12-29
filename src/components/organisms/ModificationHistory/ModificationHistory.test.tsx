import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { ModificationHistory } from './ModificationHistory';
import { DenseModification, Board } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

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

const mockModifications: DenseModification[] = [
  {
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
  },
];

describe('ModificationHistory', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MockAuthProvider>
        <ModificationHistory
          modifications={mockModifications}
          board={mockBoard}
          onClose={() => {}}
        />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when empty', () => {
    const { container } = render(
      <MockAuthProvider>
        <ModificationHistory
          modifications={[]}
          board={mockBoard}
          onClose={() => {}}
        />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
