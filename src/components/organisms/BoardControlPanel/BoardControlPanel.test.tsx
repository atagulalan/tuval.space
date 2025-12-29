import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { BoardControlPanel } from './BoardControlPanel';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from '@/components/atoms/ui/toaster';
import { Timestamp } from 'firebase/firestore';
import { User } from '@/types/models';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

// Mock analytics service
jest.mock('@/services/analytics.service', () => ({
  logButtonClick: jest.fn(),
}));

// Mock useCachedImage hook
jest.mock('@/hooks/useCachedImage', () => ({
  useCachedImage: jest.fn(() => null),
}));

const mockUser: User = {
  uid: 'user-1',
  username: 'testuser',
  email: 'test@example.com',
  pixelQuota: 100,
  lastQuotaReset: Timestamp.now(),
  createdAt: Timestamp.now(),
  boards: [],
};

describe('BoardControlPanel', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <BoardControlPanel
            user={mockUser}
            historyOpen={false}
            modificationCount={0}
            onHistoryToggle={() => {}}
          />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with history open', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <BoardControlPanel
            user={mockUser}
            historyOpen={true}
            modificationCount={5}
            onHistoryToggle={() => {}}
          />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot without user', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <BoardControlPanel
            user={null}
            historyOpen={false}
            modificationCount={0}
            onHistoryToggle={() => {}}
          />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });
});
