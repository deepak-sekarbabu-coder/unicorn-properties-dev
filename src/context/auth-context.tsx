'use client';

import {
  User as FirebaseUser,
  GoogleAuthProvider,
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth';

import React, { ReactNode, createContext, useContext, useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { getAuthErrorMessage, shouldClearSession } from '@/lib/auth-utils';
import { auth } from '@/lib/firebase';
import { addUser, getUserByEmail } from '@/lib/firestore';
import { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

async function setSessionCookie(firebaseUser: FirebaseUser) {
  const idToken = await firebaseUser.getIdToken();
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: 'Failed to parse error response from server.' }));
    console.error('Error setting session cookie:', errorData);
    throw new Error(errorData.message || 'An unknown error occurred while setting the session.');
  }
}

async function clearSessionCookie() {
  try {
    await fetch('/api/auth/session', { method: 'DELETE' });
  } catch (error) {
    console.error('Error clearing session cookie:', error);
  }
}

// Helper function to handle authentication errors and cleanup
async function handleAuthError(error: unknown, firebaseUser: FirebaseUser | null) {
  console.error('Authentication error:', error);

  // Use the utility function to determine if we should clear the session
  if (shouldClearSession(error)) {
    console.log('🧹 Clearing invalid authentication state:', getAuthErrorMessage(error));
    await clearSessionCookie();
    if (firebaseUser) {
      await signOut(auth);
    }
    return true; // Indicates cleanup was performed
  }

  return false; // No cleanup needed
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          console.log(
            '🔄 Auth state changed:',
            firebaseUser ? 'User signed in' : 'User signed out'
          );

          if (firebaseUser && firebaseUser.email) {
            try {
              console.log('🔍 Looking up user in Firestore:', firebaseUser.email);
              let appUser = await getUserByEmail(firebaseUser.email);
              let isNewUser = false;

              // If user doesn't exist in Firestore, create them with default role
              if (!appUser) {
                console.log('👤 Creating new user in Firestore');
                const newUser: Omit<User, 'id'> = {
                  name: firebaseUser.displayName || 'New User',
                  email: firebaseUser.email,
                  avatar: firebaseUser.photoURL || undefined,
                  role: 'user', // Default authentication role for first-time users
                  propertyRole: undefined, // Will be set during onboarding
                };
                appUser = await addUser(newUser);
                isNewUser = true;
                console.log('✅ New user created:', appUser.id);
              } else {
                console.log('✅ Existing user found:', appUser.id);
              }

              // Set user in context
              setUser(appUser);

              // Set session cookie
              try {
                await setSessionCookie(firebaseUser);
                console.log('✅ Session cookie set successfully');
              } catch (sessionError) {
                console.error('❌ Failed to set session cookie:', sessionError);

                // For production deployments, try to continue without session cookie
                // The dashboard will handle authentication verification
                console.warn('⚠️ Continuing without session cookie - dashboard will verify auth');

                // Only throw error if it's a critical authentication failure
                const errorMessage = (sessionError as Error).message;
                if (errorMessage.includes('auth/') || errorMessage.includes('permission')) {
                  throw sessionError;
                }
              }

              // Redirect to dashboard
              console.log('🚀 Redirecting to dashboard...');
              router.replace('/dashboard');
            } catch (error) {
              console.error('❌ Authentication error:', error);
              await handleAuthError(error, firebaseUser);
              setUser(null);
            }
          } else {
            // User signed out
            setUser(null);
            await clearSessionCookie();
          }
          setLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error('Error setting auth persistence:', error);
        setLoading(false);
      }
    };

    const unsubscribePromise = initializeAuth();

    return () => {
      unsubscribePromise.then(unsub => {
        if (unsub) {
          unsub();
        }
      });
    };
  }, [router]);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      console.log('🔐 Attempting email/password login for:', email);
      await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase authentication successful');
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error('❌ Firebase login error:', error);
      throw new Error('Invalid email or password.');
    }
  };

  const loginWithGoogle = async (): Promise<void> => {
    const provider = new GoogleAuthProvider();
    try {
      console.log('🔐 Attempting Google Sign-In...');
      await signInWithPopup(auth, provider);
      console.log('✅ Google authentication successful');
      // onAuthStateChanged will handle the rest
    } catch (error) {
      const errorCode = (error as { code?: string }).code;
      if (errorCode === 'auth/popup-closed-by-user') {
        console.log('Google Sign-In popup closed by user.');
        return;
      }
      console.error('❌ Google sign-in error:', error);
      throw new Error('Failed to sign in with Google. Please try again.');
    }
  };

  const logout = async () => {
    await signOut(auth);
    // onAuthStateChanged will handle clearing user and cookie
    router.push('/login');
  };

  const updateUser = (updatedUser: User) => {
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
      // The session cookie doesn't need role, so no need to update it here.
    }
  };

  const value = { user, loading, login, loginWithGoogle, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
