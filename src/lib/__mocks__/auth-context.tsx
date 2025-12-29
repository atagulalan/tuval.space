import React, { createContext, useContext, ReactNode, useState } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { User } from '@/types';

// Mock Timestamp for tests
const Timestamp = {
  now: () =>
    ({
      seconds: Math.floor(Date.now() / 1000),
      nanoseconds: 0,
      toDate: () => new Date(),
      toMillis: () => Date.now(),
      isEqual: () => false,
      toJSON: () => ({}),
    }) as any,
  fromDate: (date: Date) =>
    ({
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: 0,
      toDate: () => date,
      toMillis: () => date.getTime(),
      isEqual: () => false,
      toJSON: () => ({}),
    }) as any,
};

interface AuthContextType {
  firebaseUser: FirebaseUser | null;
  user: User | null;
  loading: boolean;
  needsUsername: boolean;
  setNeedsUsername: (needs: boolean) => void;
  registerUsername: (username: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  isSigningIn: boolean;
  setIsSigningIn: (isSigningIn: boolean) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface MockAuthProviderProps {
  children: ReactNode;
  // Optional overrides for testing
  mockUser?: User | null;
  mockFirebaseUser?: FirebaseUser | null;
  mockLoading?: boolean;
  mockNeedsUsername?: boolean;
  mockIsSigningIn?: boolean;
}

// Default mock user
const defaultMockUser: User = {
  uid: 'mock-uid',
  username: 'testuser',
  email: 'test@example.com',
  pixelQuota: 100,
  lastQuotaReset: Timestamp.now(),
  createdAt: Timestamp.now(),
  boards: [],
};

// Default mock Firebase user
const defaultMockFirebaseUser: Partial<FirebaseUser> = {
  uid: 'mock-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  photoURL: null,
};

export const MockAuthProvider: React.FC<MockAuthProviderProps> = ({
  children,
  mockUser = defaultMockUser,
  mockFirebaseUser = defaultMockFirebaseUser as FirebaseUser | null,
  mockLoading = false,
  mockNeedsUsername = false,
  mockIsSigningIn = false,
}) => {
  const [needsUsername, setNeedsUsername] = useState(mockNeedsUsername);
  const [isSigningIn, setIsSigningIn] = useState(mockIsSigningIn);

  const value: AuthContextType = {
    firebaseUser: mockFirebaseUser as FirebaseUser | null,
    user: mockUser,
    loading: mockLoading,
    needsUsername,
    setNeedsUsername,
    registerUsername: (() => Promise.resolve()) as any,
    refreshUser: (() => Promise.resolve()) as any,
    isSigningIn,
    setIsSigningIn,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Export as AuthProvider for module mocking
export const AuthProvider = MockAuthProvider;
