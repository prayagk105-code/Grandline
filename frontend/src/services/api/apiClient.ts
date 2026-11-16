import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import type { ApiResponse, AuthResponse } from '../../types/api';

const rawBaseUrl = (import.meta.env.VITE_API_BASE_URL || '/api/v1')
  .toString()
  .replace(/[\uFEFF\u200B]/g, '')
  .trim();
const API_BASE_URL = rawBaseUrl.length > 0 ? rawBaseUrl : '/api/v1';

const TOKEN_STORAGE_KEY = 'grandline_access_token';
let accessToken: string | null = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
let refreshPromise: Promise<AuthResponse | null> | null = null;
let onAuthExpiredCallback: (() => void) | null = null;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
}

export function getAccessToken(): string | null {
  return accessToken;
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
  if (accessToken && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

export async function refreshSessionToken(): Promise<AuthResponse | null> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post<ApiResponse<AuthResponse>>(
        `${API_BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      .then((res) => {
        const data = res.data.data ?? null;
        setAccessToken(data?.accessToken ?? null);
        return data;
      })
      .catch(() => {
        setAccessToken(null);
        return null;
      })
      .finally(() => {
        refreshPromise = null;
      });
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
      onAuthExpiredCallback?.();
    }

    return Promise.reject(error);
  }
);

