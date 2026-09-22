import React, { useState, useEffect, useCallback } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types/auth';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import { getAccessToken, setOnSessionExpired } from '../services/api';
import { AuthContext } from './authContextDef';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const logout = useCallback(() => {
    authService.logout();
    setUser(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const profile = await profileService.getProfile();
      setUser(profile);
    } catch {
      logout();
    }
  }, [logout]);

  // Hook into API client for silent session expiration
  useEffect(() => {
    setOnSessionExpired(() => {
      setUser(null);
    });
  }, []);

  // Initial session check on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = getAccessToken();
      if (token) {
        try {
          const profile = await profileService.getProfile();
          setUser(profile);
        } catch {
          // Token expired or invalid
          logout();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (payload: LoginPayload, rememberMe: boolean = true) => {
    const authData = await authService.login(payload, rememberMe);
    setUser(authData.user);
  };

  const register = async (payload: RegisterPayload, rememberMe: boolean = true) => {
    const authData = await authService.register(payload, rememberMe);
    setUser(authData.user);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
