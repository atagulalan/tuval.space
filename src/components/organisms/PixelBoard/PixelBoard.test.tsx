import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { PixelBoard } from './PixelBoard';
import { Board } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';

// Mock useToast
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
    toasts: [],
  }),
}));

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: () => ({
    log: jest.fn(),
    error: jest.fn(),
  }),
}));

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  ownerId: 'user-1',
  ownerUsername: 'testuser',
  width: 20,
  height: 20,
  maxPixels: 400,
  createdAt: Timestamp.now(),
  isPublic: true,
};

const createEmptyPixels = (width: number, height: number) => {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));
};

describe('PixelBoard', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MockAuthProvider>
        <div className="w-full h-screen">
          <PixelBoard
            board={mockBoard}
            pixels={createEmptyPixels(20, 20)}
            selectedColor="#FF0000"
            onBatchPixelPlace={async () => {}}
            isGuest={false}
            currentUserId="user-1"
            availableQuota={100}
          />
        </div>
        <Toaster />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot as guest', () => {
    const { container } = render(
      <MockAuthProvider>
        <div className="w-full h-screen">
          <PixelBoard
            board={mockBoard}
            pixels={createEmptyPixels(20, 20)}
            selectedColor="#00FF00"
            onBatchPixelPlace={async () => {}}
            isGuest={true}
          />
        </div>
        <Toaster />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
