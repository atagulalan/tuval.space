import type { Meta, StoryObj } from '@storybook/react';
import { ModificationHistory } from './ModificationHistory';
import { DenseModification, Board } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';

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
  {
    id: 'mod-2',
    boardId: 'board-1',
    x: 20,
    y: 20,
    w: 3,
    h: 3,
    pixels: '123456789',
    changedPixelsCount: 9,
    enabled: true,
    userId: 'user-2',
    username: 'anotheruser',
    createdAt: Timestamp.now(),
  },
];

const meta: Meta<typeof ModificationHistory> = {
  title: 'Components/ModificationHistory',
  component: ModificationHistory,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MockAuthProvider>
        <Story />
      </MockAuthProvider>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof ModificationHistory>;

export const Default: Story = {
  args: {
    modifications: mockModifications,
    board: mockBoard,
    onClose: () => {},
  },
};

export const Empty: Story = {
  args: {
    modifications: [],
    board: mockBoard,
    onClose: () => {},
  },
};

export const ManyModifications: Story = {
  args: {
    modifications: Array.from({ length: 20 }, (_, i) => ({
      ...mockModifications[0],
      id: `mod-${i}`,
      x: i * 5,
      y: i * 5,
    })),
    board: mockBoard,
    onClose: () => {},
  },
};
