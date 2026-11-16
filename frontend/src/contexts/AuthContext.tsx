import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { AxiosError } from 'axios';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import {
  clearAuthSession,
  getAccessToken,
  getCachedUser,
  getRefreshToken,
  setCachedUser,
  setOnAuthExpired
} from '../services/api/apiClient';
import type { UserDto } from '../types/api';
import { applyThemePreference, getCachedTheme } from '../utils/theme';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  demoLogin: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserDto | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUserState] = useState<UserDto | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  const setUser = useCallback<React.Dispatch<React.SetStateAction<UserDto | null>>>((action) => {
    setUserState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (next) {
        setCachedUser(next);
      } else {
        clearAuthSession();
      }
      return next;
    });
  }, []);

  useEffect(() => {
    applyThemePreference(getCachedTheme());

    setOnAuthExpired(() => {
      clearAuthSession();
      setUserState(null);
    });

    let active = true;

    const initAuth = async () => {
      try {
        const token = getAccessToken();
        const cachedUser = getCachedUser();

        // 1. Restore cached user right away to prevent flash of login or unwanted redirect
        if (cachedUser && active) {
          setUserState(cachedUser);
          applyThemePreference(cachedUser.themePreference);
        }

        // 2. If access token exists, verify and fetch current user profile
        if (token) {
          try {
            const meUser = await authService.me();
            if (active && meUser) {
              setUserState(meUser);
              setCachedUser(meUser);
              applyThemePreference(meUser.themePreference);
              return;
            }
          } catch (err: unknown) {
            const axiosErr = err as AxiosError;
            const isNetworkError = !axiosErr.response || axiosErr.code === 'ERR_NETWORK';

            // A failed profile request due to a network glitch must not destroy a valid authentication session
            if (isNetworkError && cachedUser) {
              return;
            }
            // If it's a 401 or other error, access token may be expired; fall through to refresh
          }
        }

        // 3. Attempt token refresh (using stored refresh token or HttpOnly cookie)
        try {
          const res = await authService.refresh();
          if (active) {
            if (res?.user) {
              setUserState(res.user);
              setCachedUser(res.user);
              applyThemePreference(res.user.themePreference);
              return;
            }
            // If refresh returned null and no cached user, clear session
            if (!cachedUser) {
              setUserState(null);
              clearAuthSession();
            }
          }
        } catch (refreshErr: unknown) {
          const axiosErr = refreshErr as AxiosError;
          const isNetworkError = !axiosErr.response || axiosErr.code === 'ERR_NETWORK';

          // Never log out a valid user with cached state on temporary network failure
          if (isNetworkError && cachedUser) {
            return;
          }

          if (active) {
            setUserState(null);
            clearAuthSession();
          }
        }
      } catch {
        if (active && !getCachedUser()) {
          setUserState(null);
          clearAuthSession();
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    initAuth();

    return () => {
      active = false;
      setOnAuthExpired(null);
    };
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authService.login(payload);
    setUserState(res.user);
    setCachedUser(res.user);
    applyThemePreference(res.user.themePreference);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authService.register(payload);
  }, []);

  const demoLogin = useCallback(async () => {
    const res = await authService.demoLogin();
    setUserState(res.user);
    setCachedUser(res.user);
    applyThemePreference(res.user.themePreference);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    clearAuthSession();
    setUserState(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
        demoLogin,
        logout,
        setUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
