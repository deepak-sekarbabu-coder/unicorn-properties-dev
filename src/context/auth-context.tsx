
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

function setCookie(name: string, value: string, days: number) {
    let expires = "";
    if (days) {
        const date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function eraseCookie(name: string) {   
    document.cookie = name +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
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
          if (firebaseUser) {
            let appUser = await getUserByEmail(firebaseUser.email!);
            // If user does not exist in Firestore, create them.
            // This handles first-time Google Sign-In.
            if (!appUser && firebaseUser.email) {
              const newUser: Omit<User, 'id'> = {
                name: firebaseUser.displayName || 'New User',
                email: firebaseUser.email,
                avatar: firebaseUser.photoURL || undefined,
                role: 'user', // Default role for new sign-ups
              };
              appUser = await addUser(newUser);
            }
            
            setUser(appUser);
            if (appUser?.role) {
                setCookie('user-role', appUser.role, 7);
            }
            // Instead of relying on src/app/page.tsx, we can push here
            // This can be more reliable as it's tied directly to auth state change
            router.push('/dashboard');
          } else {
            setUser(null);
            eraseCookie('user-role');
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
        // onAuthStateChanged will handle the user state update and redirection.
      } catch (error) {
        console.error("Firebase login error:", error);
        setLoading(false);
        throw new Error('Invalid email or password.');
      }
  };
  
  const loginWithGoogle = async (): Promise<void> => {
    setLoading(true);
    const provider = new new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the user creation, state update, and redirection.
    } catch(error) {
      const errorCode = (error as any).code;
      if (errorCode === 'auth/popup-closed-by-user') {
        console.log("Google Sign-In popup closed by user.");
        // This is not a critical error, just the user cancelling the action.
        // We set loading to false and let the user try again if they wish.
        setLoading(false);
        return;
      }
      // For other errors, we log them and show a message.
      console.error("Google sign-in error:", error);
      setLoading(false);
      throw new Error("Failed to sign in with Google. Please try again.");
    }
  }

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    eraseCookie('user-role');
    router.push('/login');
  };
  
  const updateUser = (updatedUser: User) => {
    if (user && user.id === updatedUser.id) {
      setUser(updatedUser);
      if (updatedUser.role) {
          setCookie('user-role', updatedUser.role, 7);
      }
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
