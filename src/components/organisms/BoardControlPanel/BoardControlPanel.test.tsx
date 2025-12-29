import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { BoardControlPanel } from './BoardControlPanel';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { MemoryRouter } from 'react-router-dom';
import { Toaster } from '@/components/atoms/ui/toaster';

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

describe('BoardControlPanel', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MemoryRouter>
        <MockAuthProvider>
          <BoardControlPanel
            user={{ uid: 'user-1', username: 'testuser' }}
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
      <MemoryRouter>
        <MockAuthProvider>
          <BoardControlPanel
            user={{ uid: 'user-1', username: 'testuser' }}
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
      <MemoryRouter>
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
