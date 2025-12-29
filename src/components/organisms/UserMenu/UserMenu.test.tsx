import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { UserMenu } from './UserMenu';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';
import { MemoryRouter } from 'react-router-dom';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

// Mock auth service
jest.mock('@/services/auth.service', () => ({
  signOut: jest.fn(() => Promise.resolve()),
}));

// Mock analytics service
jest.mock('@/services/analytics.service', () => ({
  logButtonClick: jest.fn(),
  logError: jest.fn(),
}));

// Mock useCachedImage hook
jest.mock('@/hooks/useCachedImage', () => ({
  useCachedImage: jest.fn(() => null),
}));

describe('UserMenu', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <UserMenu />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with board variant', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <UserMenu variant="board" />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with hideCreateBoard', () => {
    const { container } = render(
      <MemoryRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true,
        }}
      >
        <MockAuthProvider>
          <UserMenu hideCreateBoard={true} />
          <Toaster />
        </MockAuthProvider>
      </MemoryRouter>
    );
    expect(container).toMatchSnapshot();
  });
});
