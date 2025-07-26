
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
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, expiresIn }),
    });

    if (!response.ok) {
        throw new Error('Failed to set session cookie');
    }
}

async function clearSessionCookie() {
    await fetch('/api/auth/session', { method: 'DELETE' });
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
            await setSessionCookie(firebaseUser);
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
    setUser(null);
    await clearSessionCookie();
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
