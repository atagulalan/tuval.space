/**
 * Centralized error types for the application
 */

export interface FirebaseError {
  code: string;
  message: string;
  name?: string;
}

/**
 * Check if an error is a Firebase error
 */
export function isFirebaseError(error: unknown): error is FirebaseError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof (error as FirebaseError).code === 'string'
  );
}

/**
 * Get error code from unknown error
 */
export function getErrorCode(error: unknown): string | undefined {
  if (isFirebaseError(error)) {
    return error.code;
  }
  if (error instanceof Error && 'code' in error) {
    return String((error as { code: unknown }).code);
  }
  return undefined;
}

/**
 * Get error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (isFirebaseError(error)) {
    return error.message;
  }
  return String(error);
}

/**
 * Common Firebase error codes
 */
export const FIREBASE_ERROR_CODES = {
  POPUP_CLOSED: 'auth/popup-closed-by-user',
  UNAVAILABLE: 'unavailable',
  PERMISSION_DENIED: 'permission-denied',
  NOT_FOUND: 'not-found',
} as const;





