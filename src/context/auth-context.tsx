
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { getUserByEmail, addUser } from '@/lib/firestore';
import { auth } from '@/lib/firebase';
import { 
  onAuthStateChanged,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  User as FirebaseUser,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';

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
        const errorData = await response.json().catch(() => ({ message: 'Failed to parse error response from server.' }));
        console.error("Error setting session cookie:", errorData);
        throw new Error(errorData.message || 'An unknown error occurred while setting the session.');
    }
}

async function clearSessionCookie() {
    try {
        await fetch('/api/auth/session', { method: 'DELETE' });
    } catch (error) {
        console.error("Error clearing session cookie:", error);
    }
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
          if (firebaseUser && firebaseUser.email) {
            
            let appUser = await getUserByEmail(firebaseUser.email);
            
            if (!appUser) {
              const newUser: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email,
                avatar: firebaseUser.photoURL || undefined,
                role: 'tenant', // Default role
              };
              appUser = await addUser(newUser);
            }
            
            setUser(appUser);
            try {
                // We set the cookie here after we have the user
                await setSessionCookie(firebaseUser);
            } catch (error) {
                console.error("Critical: Could not set session cookie.", error);
                // Decide how to handle this - maybe log out the user?
                await signOut(auth); // Log out if session can't be set
                setUser(null);
            }


             if (appUser && (appUser.apartment && appUser.role)) {
               router.replace('/dashboard');
             }
          } else {
            setUser(null);
            await clearSessionCookie();
          }
          setLoading(false);
        });
        return unsubscribe;
      } catch (error) {
        console.error("Error setting auth persistence:", error);
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
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle the rest
      } catch (error) {
        console.error("Firebase login error:", error);
        setLoading(false);
        throw new Error('Invalid email or password.');
      }
  };
  
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch(error) {
      const errorCode = (error as any).code;
      if (errorCode === 'auth/popup-closed-by-user') {
        console.log("Google Sign-In popup closed by user.");
        setLoading(false);
        return;
      }
      console.error("Google sign-in error:", error);
      setLoading(false);
      throw new Error("Failed to sign in with Google. Please try again.");
    }
  }

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
