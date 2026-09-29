import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AUTH_STORAGE_KEY = '@swiftchat_user';

export const AuthContext = createContext({
  user: null,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

/**
 * AuthProvider component managing user authentication state.
 * Uses AsyncStorage for unencrypted, local key-value persistence across app restarts.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore stored session on application launch
  useEffect(() => {
    async function restoreUserSession() {
      try {
        const storedUserData = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUserData) {
          const parsedUser = JSON.parse(storedUserData);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Failed to load user session from local storage:', err);
      } finally {
        setIsLoading(false);
      }
    }

    restoreUserSession();
  }, []);

  /**
   * Authenticates user against backend API and persists user details locally.
   */
  const login = async (username, password) => {
    const res = await api.login(username, password);
    if (res && res.data) {
      setUser(res.data);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }
    throw new Error((res && res.message) || 'Authentication failed');
  };

  /**
   * Registers a new account and immediately signs the user in.
   */
  const register = async (username, password, contactNo) => {
    const res = await api.register(username, password, contactNo);
    if (res && res.data) {
      setUser(res.data);
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(res.data));
      return res.data;
    }
    throw new Error((res && res.message) || 'Registration failed');
  };

  /**
   * Logs out the user and clears unencrypted local storage.
   */
  const logout = async () => {
    try {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (err) {
      console.error('Error clearing local storage on logout:', err);
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
