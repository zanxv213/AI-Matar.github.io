import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  AuthError
} from 'firebase/auth';
import { auth } from '../firebase/config';

export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const signUpUser = (email: string, password: string): Promise<User> => {
  return createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => userCredential.user);
};

export const signInUser = (email: string, password: string): Promise<User> => {
  return signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => userCredential.user);
};

export const signOutUser = (): Promise<void> => {
  return signOut(auth);
};

export const getFirebaseErrorMessage = (error: any): string => {
    if (error && error.code) {
        switch (error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address format.';
            case 'auth/user-not-found':
            case 'auth/wrong-password':
                return 'Invalid email or password.';
            case 'auth/email-already-in-use':
                return 'An account with this email already exists.';
            case 'auth/weak-password':
                return 'Password should be at least 6 characters.';
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }
    return 'An unexpected error occurred. Please try again.';
};
