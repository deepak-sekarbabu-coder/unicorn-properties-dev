'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { getUserByEmail } from '@/lib/firestore';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check for a logged-in user in localStorage
    try {
      const storedUser = localStorage.getItem('apartment-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
        console.error("Could not parse user from local storage", error)
        localStorage.removeItem('apartment-user');
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
      setLoading(true);
      if (password === 'password') { // Dummy password check for all users
        const authenticatedUser = await getUserByEmail(email);
        if (authenticatedUser) {
            setUser(authenticatedUser);
            localStorage.setItem('apartment-user', JSON.stringify(authenticatedUser));
            setLoading(false);
            return Promise.resolve();
        }
      }
      setLoading(false);
      return Promise.reject(new Error('Invalid email or password.'));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('apartment-user');
    router.push('/login');
  };
  
  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('apartment-user', JSON.stringify(updatedUser));
  };


  const value = { user, loading, login, logout, updateUser };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
