'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/lib/types';
import { users } from '@/lib/data'; // We'll use this for mock auth

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A mock authentication function
const authenticate = (email: string): User | null => {
    if (email === 'admin@apartment.com') {
        return {
            id: 'user-1',
            name: 'Alex Martin (Admin)',
            email: 'admin@apartment.com',
            role: 'admin'
        }
    }
    const foundUser = users.find(u => u.name.toLowerCase().replace(' ', '.') + '@apartment.com' === email);
    if(foundUser) {
        return {...foundUser, email: email, role: 'user'}
    }
    return null;
};

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
    return new Promise((resolve, reject) => {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        const authenticatedUser = authenticate(email);
        if (authenticatedUser && password === 'password') { // Dummy password check
          setUser(authenticatedUser);
          localStorage.setItem('apartment-user', JSON.stringify(authenticatedUser));
          resolve();
        } else {
          reject(new Error('Invalid email or password.'));
        }
        setLoading(false);
      }, 1000);
    });
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
