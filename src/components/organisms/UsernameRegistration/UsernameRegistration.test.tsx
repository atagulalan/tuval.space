import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { UsernameRegistration } from './UsernameRegistration';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Toaster } from '@/components/atoms/ui/toaster';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

describe('UsernameRegistration', () => {
  it('should match snapshot when needs username', () => {
    const { container } = render(
      <MockAuthProvider mockUser={null} mockNeedsUsername={true}>
        <UsernameRegistration />
        <Toaster />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when loading', () => {
    const { container } = render(
      <MockAuthProvider
        mockUser={null}
        mockNeedsUsername={true}
        mockLoading={true}
      >
        <UsernameRegistration />
        <Toaster />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
