import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
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
];

describe('BoardList', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <BoardList boards={mockBoards} loading={false} />
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when loading', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <BoardList boards={[]} loading={true} />
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when empty', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <BoardList boards={[]} loading={false} />
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });
});
