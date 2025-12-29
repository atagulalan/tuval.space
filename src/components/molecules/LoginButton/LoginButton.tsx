import { FcGoogle } from 'react-icons/fc';
import { Button } from '@/components/atoms/ui/button';
import { signInWithGoogle } from '@/services/auth.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { logButtonClick, logError } from '@/services/analytics.service';
import { logger } from '@/lib/logger';
import {
  getErrorCode,
  getErrorMessage,
  FIREBASE_ERROR_CODES,
} from '@/types/errors';

export const LoginButton = () => {
  const { toast } = useToast();
  const { isSigningIn, setIsSigningIn } = useAuth();

  const handleLogin = async () => {
    logger('auth').log('🔘 [LOGIN BUTTON] User clicked sign in button');
    logButtonClick('Sign in with Google', window.location.pathname);
    try {
      setIsSigningIn(true);
      logger('auth').log('⏳ [LOGIN BUTTON] Loading state set to true');
      await signInWithGoogle();
      logger('auth').log('✅ [LOGIN BUTTON] Popup sign-in successful');
      // Note: signInWithGoogle uses popup, so the user is signed in immediately
      // The user will be handled by AuthContext's onAuthStateChanged
    } catch (error) {
      logger('auth').error('❌ [LOGIN BUTTON] Login error:', error);
      setIsSigningIn(false);

      const errorCode = getErrorCode(error);
      const errorMessage = getErrorMessage(error);

      // Handle popup closed by user
      if (errorCode === FIREBASE_ERROR_CODES.POPUP_CLOSED) {
        toast({
          title: 'Sign in cancelled',
          description:
            'The sign-in popup was closed. Please try again if you want to sign in.',
          variant: 'default',
        });
      } else {
        logError('Login Failed', errorMessage, 'LoginButton', {
          error_code: errorCode,
        });
        toast({
          title: 'Login failed',
          description: 'Failed to sign in with Google. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button
      onClick={handleLogin}
      variant="outline"
      size="lg"
      disabled={isSigningIn}
      className="text-slate-300 border-slate-600 hover:bg-slate-800 hover:border-slate-500"
    >
      <FcGoogle className="mr-2 h-5 w-5" />
      {isSigningIn ? 'Signing in...' : 'Sign in with Google'}
    </Button>
  );
};
