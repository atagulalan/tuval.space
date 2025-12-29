import type { Meta, StoryObj } from '@storybook/react';
import { ModificationEntry } from './ModificationEntry';
import { DenseModification, Board } from '@/types';
import { Timestamp } from 'firebase/firestore';

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

const meta: Meta<typeof ModificationEntry> = {
  title: 'Components/ModificationEntry',
  component: ModificationEntry,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ModificationEntry>;

export const Default: Story = {
  args: {
    modification: mockModification,
    board: mockBoard,
    currentUserId: 'user-2',
    boardOwnerId: 'owner-1',
    boardId: 'board-1',
  },
};

export const AsOwner: Story = {
  args: {
    modification: mockModification,
    board: mockBoard,
    currentUserId: 'owner-1',
    boardOwnerId: 'owner-1',
    boardId: 'board-1',
  },
};

export const Disabled: Story = {
  args: {
    modification: {
      ...mockModification,
      enabled: false,
    },
    board: mockBoard,
    currentUserId: 'owner-1',
    boardOwnerId: 'owner-1',
    boardId: 'board-1',
  },
};

export const WithoutDismiss: Story = {
  args: {
    modification: mockModification,
    board: mockBoard,
    currentUserId: undefined,
    boardOwnerId: 'owner-1',
    boardId: 'board-1',
  },
};
