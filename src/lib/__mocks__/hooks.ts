import { User } from '@/types';
import { Timestamp } from 'firebase/firestore';

// Mock useAuth hook return type
export interface MockUseAuthReturn {
  firebaseUser: any;
  user: User | null;
  loading: boolean;
  needsUsername: boolean;
  setNeedsUsername: jest.Mock;
  registerUsername: jest.Mock;
  refreshUser: jest.Mock;
  isSigningIn: boolean;
  setIsSigningIn: jest.Mock;
}

// Mock useAuth hook
export const mockUseAuth = (
  overrides?: Partial<MockUseAuthReturn>
): MockUseAuthReturn => {
  const defaultUser: User = {
    uid: 'mock-uid',
    username: 'testuser',
    email: 'test@example.com',
    pixelQuota: 100,
    lastQuotaReset: Timestamp.now(),
    createdAt: Timestamp.now(),
    boards: [],
  };

  const createMockFn = () => {
    if (typeof jest !== 'undefined' && jest.fn) {
      return jest.fn();
    }
    return (() => {}) as any;
  };

  return {
    firebaseUser: null,
    user: defaultUser,
    loading: false,
    needsUsername: false,
    setNeedsUsername: createMockFn(),
    registerUsername: (() => Promise.resolve()) as any,
    refreshUser: (() => Promise.resolve()) as any,
    isSigningIn: false,
    setIsSigningIn: createMockFn(),
    ...overrides,
  };
};

// Mock useToast hook
export const mockUseToast = () => {
  const createMockFn = () => {
    if (typeof jest !== 'undefined' && jest.fn) {
      return jest.fn();
    }
    return (() => {}) as any;
  };

  return {
    toast: createMockFn(),
    dismiss: createMockFn(),
    toasts: [],
  };
};
