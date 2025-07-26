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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        // User is signed in, see if they are in our DB
        let appUser = await getUserByEmail(firebaseUser.email!);
        if (!appUser) {
          // New user, create them in our DB
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
        // User is signed out
        setUser(null);
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
      setLoading(true);
      try {
        await signInWithEmailAndPassword(auth, email, password);
        // onAuthStateChanged will handle setting the user
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
      console.error("Google sign-in error:", error);
      setLoading(false);
      throw new Error("Failed to sign in with Google.");
    }
  }

  const logout = async () => {
    await signOut(auth);
    router.push('/login');
  };
  
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
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
