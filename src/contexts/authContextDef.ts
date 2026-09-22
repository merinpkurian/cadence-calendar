import React, { createContext } from 'react';
import type { User, LoginPayload, RegisterPayload } from '../types/auth';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload, rememberMe?: boolean) => Promise<void>;
  register: (payload: RegisterPayload, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
