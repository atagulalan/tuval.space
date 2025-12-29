import type { Meta, StoryObj } from '@storybook/react';
import { BoardList } from './BoardList';
import { Board } from '@/types';
import { Timestamp } from 'firebase/firestore';
import { MemoryRouter } from 'react-router-dom';

const mockBoards: Board[] = [
  {
    id: 'board-1',
    name: 'My First Board',
    ownerId: 'user-1',
    ownerUsername: 'testuser',
    width: 100,
    height: 100,
    maxPixels: 10000,
    createdAt: Timestamp.now(),
    isPublic: true,
  },
  {
    id: 'board-2',
    name: 'Private Board',
    ownerId: 'user-1',
    ownerUsername: 'testuser',
    width: 50,
    height: 50,
    maxPixels: 2500,
    createdAt: Timestamp.now(),
    isPublic: false,
  },
  {
    id: 'board-3',
    name: 'Special Event Board',
    ownerId: 'user-2',
    ownerUsername: 'anotheruser',
    width: 200,
    height: 200,
    maxPixels: 40000,
    createdAt: Timestamp.now(),
    isPublic: true,
    isSpecialEvent: true,
  },
];

const meta: Meta<typeof BoardList> = {
  title: 'Components/BoardList',
  component: BoardList,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof BoardList>;

export const Default: Story = {
  args: {
    boards: mockBoards,
    loading: false,
  },
};

export const Loading: Story = {
  args: {
    boards: [],
    loading: true,
  },
};

export const Empty: Story = {
  args: {
    boards: [],
    loading: false,
  },
};

export const SingleBoard: Story = {
  args: {
    boards: [mockBoards[0]],
    loading: false,
  },
};
