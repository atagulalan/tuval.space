import {
  signInWithPopup,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';
import { logger } from '@/lib/logger';

export const signInWithGoogle = async (): Promise<FirebaseUser> => {
  try {
    logger('auth').log('🚀 [AUTH] Starting signInWithPopup...');
    const result = await signInWithPopup(auth, googleProvider);
    logger('auth').log('✅ [AUTH] Popup sign-in successful! User:', {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName,
    });
    return result.user;
  } catch (error) {
    logger('auth').error('❌ [AUTH] Error signing in with Google:', error);
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    logger('auth').error('Error signing out:', error);
    throw error;
  }
};

export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};


