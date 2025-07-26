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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await setPersistence(auth, browserLocalPersistence);
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          if (firebaseUser) {
            let appUser = await getUserByEmail(firebaseUser.email!);
            if (!appUser) {
              const newUser: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email!,
                avatar: firebaseUser.photoURL || undefined,
                role: 'user',
              };
              appUser = await addUser(newUser);
            }
            setUser(appUser);
          } else {
            setUser(null);
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
  }, []);

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
      console.error("Google sign-in error:", error);
      setLoading(false);
      if ((error as any).code !== 'auth/popup-closed-by-user') {
        throw new Error("Failed to sign in with Google.");
      }
    }
  }

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    router.push('/login');
  };
  
  const updateUser = (updatedUser: User) => {
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
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
