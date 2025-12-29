import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { User } from '@/types';
import { getUser, createUser, resetDailyQuota } from '@/services/user.service';
import { logger } from '@/lib/logger';

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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsUsername, setNeedsUsername] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const refreshUser = useCallback(async () => {
    if (!firebaseUser) return;

    try {
      const userData = await getUser(firebaseUser.uid);
      if (userData) {
        // Check and reset daily quota if needed
        const updatedUser = await resetDailyQuota(userData);
        setUser(updatedUser);
      }
    } catch (error) {
      logger('auth').error('Error refreshing user:', error);
    }
  }, [firebaseUser]);

  const registerUsername = useCallback(async (username: string) => {
    if (!firebaseUser || !firebaseUser.email) {
      throw new Error('No authenticated user');
    }

    try {
      const newUser = await createUser(
        firebaseUser.uid,
        firebaseUser.email,
        username
      );
      setUser(newUser);
      setNeedsUsername(false);
    } catch (error) {
      logger('auth').error('Error registering username:', error);
      throw error;
    }
  }, [firebaseUser]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userData = await getUser(firebaseUser.uid);
          logger('auth').log('📚 [AUTH CONTEXT] Firestore user data:', userData);

          if (userData) {
            // Check and reset daily quota if needed
            logger('auth').log('✅ [AUTH CONTEXT] User exists in Firestore, checking quota...');
            const updatedUser = await resetDailyQuota(userData);
            logger('auth').log('💾 [AUTH CONTEXT] Setting user state:', {
              username: updatedUser.username,
              pixelQuota: updatedUser.pixelQuota,
            });
            setUser(updatedUser);
            setNeedsUsername(false);
          } else {
            // User exists in Firebase Auth but not in Firestore
            setUser(null);
            setNeedsUsername(true);
          }
        } catch (error) {
          logger('auth').error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        setUser(null);
        setNeedsUsername(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = useMemo(
    () => ({
      firebaseUser,
      user,
      loading,
      needsUsername,
      setNeedsUsername,
      registerUsername,
      refreshUser,
      isSigningIn,
      setIsSigningIn,
    }),
    [firebaseUser, user, loading, needsUsername, registerUsername, refreshUser, isSigningIn]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};


