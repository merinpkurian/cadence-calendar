import type { RefreshResponse } from '../types/auth';

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://interview-task-01-be.vercel.app').replace(/\/+$/, '');

const ACCESS_TOKEN_KEY = 'cadence_access_token';
const REFRESH_TOKEN_KEY = 'cadence_refresh_token';
const REMEMBER_ME_KEY = 'cadence_remember_me';

/**
 * Storage helpers respecting "Stay logged in" choice
 */
export function getStorage(): Storage {
  const remember = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return remember ? localStorage : sessionStorage;
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) || sessionStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY) || sessionStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string, rememberMe?: boolean): void {
  if (rememberMe !== undefined) {
    localStorage.setItem(REMEMBER_ME_KEY, rememberMe ? 'true' : 'false');
  }
  const storage = getStorage();
  // Clear any existing tokens from the other storage to prevent desync
  const otherStorage = storage === localStorage ? sessionStorage : localStorage;
  otherStorage.removeItem(ACCESS_TOKEN_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_KEY);

  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(REMEMBER_ME_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Resolves avatar relative URLs (/avatars/<id>) against API_BASE_URL.
 */
export function getAvatarUrl(avatarPath: string | null | undefined): string | null {
  if (!avatarPath) return null;
  if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
    return avatarPath;
  }
  const cleanPath = avatarPath.startsWith('/') ? avatarPath : `/${avatarPath}`;
  return `${API_BASE_URL}${cleanPath}`;
}

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

/**
 * Mutex state for rotating refresh token queue
 */
let isRefreshing = false;
let refreshSubscribers: Array<{
  resolve: (newToken: string) => void;
  reject: (err: unknown) => void;
}> = [];

function onTokenRefreshed(newToken: string): void {
  refreshSubscribers.forEach((sub) => sub.resolve(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown): void {
  refreshSubscribers.forEach((sub) => sub.reject(error));
  refreshSubscribers = [];
}

// Callback hook for AuthContext to detect forced logout on refresh failure
let onSessionExpiredCallback: (() => void) | null = null;
export function setOnSessionExpired(callback: () => void): void {
  onSessionExpiredCallback = callback;
}

/**
 * Executes token refresh using POST /auth/refresh with rotation.
 */
async function refreshAccessToken(): Promise<string> {
  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    clearTokens();
    if (onSessionExpiredCallback) onSessionExpiredCallback();
    throw new ApiError('Session expired. Please log in again.', 401, 'NO_REFRESH_TOKEN');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refreshToken: currentRefreshToken }),
    });

    if (!response.ok) {
      clearTokens();
      if (onSessionExpiredCallback) onSessionExpiredCallback();
      throw new ApiError('Refresh token expired or invalid', 401, 'INVALID_REFRESH_TOKEN');
    }

    const data: RefreshResponse = await response.json();
    // Persist NEW tokens immediately (Refresh tokens rotate on every call!)
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (err) {
    clearTokens();
    if (onSessionExpiredCallback) onSessionExpiredCallback();
    throw err;
  }
}

export interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

/**
 * Centralized fetch client with automatic auth header and refresh token mutex.
 */
export async function apiClient<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, headers: customHeaders = {}, ...restOptions } = options;
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(customHeaders);

  if (requiresAuth) {
    const token = getAccessToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Set default JSON Content-Type only if body is NOT FormData
  if (!(restOptions.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...restOptions,
      headers,
    });
  } catch {
    throw new ApiError(
      'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  // Handle 401 Unauthorized for authenticated endpoints
  if (response.status === 401 && requiresAuth && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newAccessToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newAccessToken);

        // Retry the original failed request with the new access token
        headers.set('Authorization', `Bearer ${newAccessToken}`);
        return apiClient<T>(endpoint, {
          ...options,
          headers,
        });
      } catch (refreshErr) {
        isRefreshing = false;
        onRefreshFailed(refreshErr);
        throw refreshErr;
      }
    } else {
      // Refresh is already in flight: queue this request and wait for the new token
      return new Promise<T>((resolve, reject) => {
        refreshSubscribers.push({
          resolve: async (newAccessToken: string) => {
            try {
              headers.set('Authorization', `Bearer ${newAccessToken}`);
              const retried = await apiClient<T>(endpoint, {
                ...options,
                headers,
              });
              resolve(retried);
            } catch (err) {
              reject(err);
            }
          },
          reject: (err) => {
            reject(err);
          },
        });
      });
    }
  }

  // Handle non-2xx status codes
  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    let errorCode: string | undefined;

    try {
      const errorJson = await response.json();
      if (errorJson?.error?.message) {
        errorMessage = errorJson.error.message;
        errorCode = errorJson.error.code;
      } else if (errorJson?.message) {
        errorMessage = Array.isArray(errorJson.message)
          ? errorJson.message.join(', ')
          : errorJson.message;
      }
    } catch {
      // Response was not JSON
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  // 204 No Content
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}
