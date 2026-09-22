import { apiClient, setTokens, clearTokens } from './api';
import type { AuthResponse, LoginPayload, RegisterPayload } from '../types/auth';

export const authService = {
  /**
   * Authenticates user via POST /auth/login
   */
  async login(payload: LoginPayload, rememberMe: boolean = true): Promise<AuthResponse> {
    const data = await apiClient<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: payload.email.trim().toLowerCase(),
        password: payload.password,
      }),
      requiresAuth: false,
    });

    setTokens(data.accessToken, data.refreshToken, rememberMe);
    return data;
  },

  /**
   * Registers a new account via POST /auth/register (multipart/form-data)
   */
  async register(payload: RegisterPayload, rememberMe: boolean = true): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('name', payload.name.trim());
    formData.append('email', payload.email.trim().toLowerCase());
    formData.append('password', payload.password);

    if (payload.avatar) {
      formData.append('avatar', payload.avatar);
    }

    const data = await apiClient<AuthResponse>('/auth/register', {
      method: 'POST',
      body: formData,
      requiresAuth: false,
    });

    setTokens(data.accessToken, data.refreshToken, rememberMe);
    return data;
  },

  /**
   * Logs out the user locally by clearing all tokens
   */
  logout(): void {
    clearTokens();
  },

  /**
   * Interviewer debug helper: instantly invalidates current session on the server
   */
  async expireMyToken(): Promise<void> {
    await apiClient<void>('/auth/expire-my-token', {
      method: 'POST',
      requiresAuth: true,
    });
  },
};
