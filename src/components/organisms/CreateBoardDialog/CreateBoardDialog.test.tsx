import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { CreateBoardDialog } from './CreateBoardDialog';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';
import { MemoryRouter } from 'react-router-dom';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

// Mock board service
jest.mock('@/services/board.service', () => ({
  createBoard: jest.fn(() =>
    Promise.resolve({ id: 'board-1', name: 'Test Board' })
  ),
  checkBoardNameExists: jest.fn(() => Promise.resolve(false)),
}));

// Mock user service
jest.mock('@/services/user.service', () => ({
  addBoardToUser: jest.fn(() => Promise.resolve()),
  canUserCreateBoard: jest.fn(() => Promise.resolve(true)),
}));

// Mock cache
jest.mock('@/lib/cache', () => ({
  invalidateUserProfile: jest.fn(),
}));

// Mock analytics service
jest.mock('@/services/analytics.service', () => ({
  logButtonClick: jest.fn(),
  logError: jest.fn(),
}));

describe('CreateBoardDialog', () => {
  it('should match snapshot when closed', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <CreateBoardDialog open={false} onOpenChange={() => {}} />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when open', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <CreateBoardDialog open={true} onOpenChange={() => {}} />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });
});
