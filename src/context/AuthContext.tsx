import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile, registerUser, loginUser } from '../services/apiService';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (identifier: string) => Promise<void>;
  register: (name: string, email: string, mobile: string) => Promise<void>;
  logout: () => Promise<void>;
}

const STORAGE_KEY = '@wattwise_user_profile';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load saved session on app launch
  useEffect(() => {
    async function loadUserSession() {
      try {
        let savedData: string | null = null;
        if (typeof window !== 'undefined' && window.localStorage) {
          savedData = window.localStorage.getItem(STORAGE_KEY);
        }
        if (!savedData) {
          savedData = await AsyncStorage.getItem(STORAGE_KEY);
        }

        if (savedData) {
          setUser(JSON.parse(savedData));
        }
      } catch (err) {
        console.warn('Failed to load user session:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserSession();
  }, []);

  // Save session to storage
  const saveUserSession = async (userProfile: UserProfile | null) => {
    setUser(userProfile);
    try {
      if (userProfile) {
        const jsonStr = JSON.stringify(userProfile);
        await AsyncStorage.setItem(STORAGE_KEY, jsonStr);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(STORAGE_KEY, jsonStr);
        }
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (err) {
      console.warn('Failed to save session:', err);
    }
  };

  const login = async (identifier: string) => {
    const userProfile = await loginUser(identifier);
    await saveUserSession(userProfile);
  };

  const register = async (name: string, email: string, mobile: string) => {
    const userProfile = await registerUser(name, email, mobile);
    await saveUserSession(userProfile);
  };

  const logout = async () => {
    await saveUserSession(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
