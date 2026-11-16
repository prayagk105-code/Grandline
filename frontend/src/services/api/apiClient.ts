import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse, UserDto } from '../../types/api';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  .toString()
  .replace(/[\uFEFF\u200B]/g, '')
  .trim();
const API_BASE_URL = rawBaseUrl.length > 0 ? rawBaseUrl : '/api/v1';

const TOKEN_STORAGE_KEY = 'grandline_access_token';
const REFRESH_TOKEN_STORAGE_KEY = 'grandline_refresh_token';
const USER_STORAGE_KEY = 'grandline_user';
const TOKEN_EXPIRY_KEY = 'grandline_token_expires_at';

let inMemoryAccessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let onAuthExpiredCallback: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getAccessToken(): string | null {
  if (inMemoryAccessToken) return inMemoryAccessToken;
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (stored) {
      inMemoryAccessToken = stored;
      return stored;
    }
  }
  return null;
}

export function setRefreshToken(token: string | null): void {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    }
  }
}

export function getRefreshToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY);
  }
  return null;
}

export function setCachedUser(user: UserDto | null): void {
  if (typeof window !== 'undefined') {
    if (user) {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  }
}

export function getCachedUser(): UserDto | null {
  if (typeof window !== 'undefined') {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (raw) {
      try {
        return JSON.parse(raw) as UserDto;
      } catch {
        localStorage.removeItem(USER_STORAGE_KEY);
      }
    }
  }
  return null;
}

export function setTokenExpiresAt(expiresAt: string | null): void {
  if (typeof window !== 'undefined') {
    if (expiresAt) {
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiresAt);
    } else {
      localStorage.removeItem(TOKEN_EXPIRY_KEY);
    }
  }
}

export function getTokenExpiresAt(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_EXPIRY_KEY);
  }
  return null;
}

export function clearAuthSession(): void {
  inMemoryAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  }
}

export function setOnAuthExpired(cb: (() => void) | null): void {
  onAuthExpiredCallback = cb;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export async function refreshSessionToken(): Promise<AuthResponse | null> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const storedRefreshToken = getRefreshToken();
        const payload: { refreshToken?: string } = {};
        if (storedRefreshToken) {
          payload.refreshToken = storedRefreshToken;
        }

        const res = await axios.post<ApiResponse<AuthResponse>>(
          `${API_BASE_URL}/auth/refresh`,
          payload,
          { withCredentials: true }
        );

        const data = res.data?.data ?? null;
        if (data?.accessToken) {
          setAccessToken(data.accessToken);
          if (data.refreshToken) {
            setRefreshToken(data.refreshToken);
          }
          if (data.expiresAtUtc) {
            setTokenExpiresAt(data.expiresAtUtc);
          }
          if (data.user) {
            setCachedUser(data.user);
          }
          return data;
        }
        return null;
      } catch (err: unknown) {
        const axiosErr = err as AxiosError;
        // Only clear session on explicit 401 or 403 (unauthorized/invalid session).
        // Never clear session on temporary network failures (ERR_NETWORK, offline, 5xx server issues).
        if (axiosErr.response && (axiosErr.response.status === 401 || axiosErr.response.status === 403)) {
          clearAuthSession();
        }
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

async function performRefresh(): Promise<string | null> {
  const data = await refreshSessionToken();
  return data?.accessToken ?? null;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const url = original?.url ?? '';

    const isAuthRoute =
      url.includes('/auth/login') ||
      url.includes('/auth/register') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/demo-login');

    if (error.response?.status === 401 && original && !original._retry && !isAuthRoute) {
      original._retry = true;
      const newToken = await performRefresh();
      if (newToken) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(original);
      }

      // Only notify auth expired if the tokens were genuinely cleared due to explicit 401/403
      if (!getAccessToken() && !getRefreshToken()) {
        onAuthExpiredCallback?.();
      }
    }

    return Promise.reject(error);
  }
);
