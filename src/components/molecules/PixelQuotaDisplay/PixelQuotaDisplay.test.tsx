import { describe, it, expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { PixelQuotaDisplay } from './PixelQuotaDisplay';
import { MockAuthProvider } from '@/lib/__mocks__/auth-context';
import { Timestamp } from 'firebase/firestore';

// Mock AuthContext module
jest.mock('@/contexts/AuthContext', () =>
  require('@/lib/__mocks__/auth-context')
);

describe('PixelQuotaDisplay', () => {
  it('should match snapshot', () => {
    const { container } = render(
      <MockAuthProvider>
        <PixelQuotaDisplay />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with pending pixels', () => {
    const { container } = render(
      <MockAuthProvider>
        <PixelQuotaDisplay
          pendingPixelsCount={5}
          pendingPixelsNeedingQuota={5}
        />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when over quota', () => {
    const { container } = render(
      <MockAuthProvider>
        <PixelQuotaDisplay pendingPixelsNeedingQuota={150} />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot when flashing', () => {
    const { container } = render(
      <MockAuthProvider>
        <PixelQuotaDisplay shouldFlash={true} />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with low quota', () => {
    const { container } = render(
      <MockAuthProvider
        mockUser={{
          uid: 'mock-uid',
          username: 'testuser',
          email: 'test@example.com',
          pixelQuota: 10,
          lastQuotaReset: Timestamp.now(),
          createdAt: Timestamp.now(),
          boards: [],
        }}
      >
        <PixelQuotaDisplay />
      </MockAuthProvider>
    );
    expect(container).toMatchSnapshot();
  });
});
