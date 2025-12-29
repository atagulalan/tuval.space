import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { LoginButton } from './LoginButton';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

// Mock auth service
jest.mock('@/services/auth.service', () => ({
  signInWithGoogle: jest.fn(() => Promise.resolve()),
}));

// Mock analytics service
jest.mock('@/services/analytics.service', () => ({
  logButtonClick: jest.fn(),
  logError: jest.fn(),
}));

describe('LoginButton', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MockAuthProvider mockUser={null}>
        <LoginButton />
        <Toaster />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when signing in', () => {
    const { container } = render(
      <MockAuthProvider mockUser={null} mockIsSigningIn={true}>
        <LoginButton />
        <Toaster />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
