import type { Meta, StoryObj } from '@storybook/react';
import { PixelBoard } from './PixelBoard';
import { Board, Pixel } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';

const mockBoard: Board = {
  id: 'board-1',
  name: 'Test Board',
  ownerId: 'user-1',
  ownerUsername: 'testuser',
  width: 50,
  height: 50,
  maxPixels: 2500,
  createdAt: Timestamp.now(),
  isPublic: true,
};

// Create empty pixels array
const createEmptyPixels = (
  width: number,
  height: number
): (Pixel | null)[][] => {
  return Array(height)
    .fill(null)
    .map(() => Array(width).fill(null));
};

const meta: Meta<typeof PixelBoard> = {
  title: 'Components/PixelBoard',
  component: PixelBoard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockAuthProvider>
        <div className="w-full h-screen bg-background-dark">
          <Story />
        </div>
        <Toaster />
      </MockAuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof PixelBoard>;

export const Default: Story = {
  args: {
    board: mockBoard,
    pixels: createEmptyPixels(50, 50),
    selectedColor: '#FF0000',
    onBatchPixelPlace: async () => {},
    isGuest: false,
    currentUserId: 'user-1',
    availableQuota: 100,
  },
};

export const Guest: Story = {
  args: {
    board: mockBoard,
    pixels: createEmptyPixels(50, 50),
    selectedColor: '#00FF00',
    onBatchPixelPlace: async () => {},
    isGuest: true,
  },
};

export const SmallBoard: Story = {
  args: {
    board: {
      ...mockBoard,
      width: 20,
      height: 20,
      maxPixels: 400,
    },
    pixels: createEmptyPixels(20, 20),
    selectedColor: '#0000FF',
    onBatchPixelPlace: async () => {},
    isGuest: false,
    currentUserId: 'user-1',
    availableQuota: 100,
  },
};
