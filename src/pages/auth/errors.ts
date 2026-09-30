import { FirebaseError } from 'firebase/app'

const messages: Record<string, string> = {
  'auth/invalid-credential': 'The email or password is incorrect.',
  'auth/invalid-email': 'Enter a valid email address.',
  'auth/user-disabled': 'This account has been disabled. Contact your project coordinator.',
  'auth/too-many-requests': 'Too many attempts. Wait a minute and try again.',
  'auth/email-already-in-use': 'An account with this email already exists. Try signing in instead.',
  'auth/weak-password': 'Use at least 8 characters for your password.',
  'auth/network-request-failed': 'Network error. Check your connection and try again.',
  'permission-denied': "You don't have permission to do that.",
  unavailable: 'The service is temporarily unavailable. Try again in a moment.',
}

export function errorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (error instanceof FirebaseError) return messages[error.code] ?? fallback
  if (error instanceof Error && error.message) return error.message
  return fallback
}
