import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService, type LoginPayload, type RegisterPayload } from '../services/authService';
import { getAccessToken, setAccessToken, setOnAuthExpired } from '../services/api/apiClient';
import type { UserDto } from '../types/api';
import { applyThemePreference, getCachedTheme } from '../utils/theme';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  setUser: React.Dispatch<React.SetStateAction<UserDto | null>>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    applyThemePreference(getCachedTheme());

    setOnAuthExpired(() => {
      setAccessToken(null);
      setUser(null);
    });

    let active = true;

    const initAuth = async () => {
      try {
        const token = getAccessToken();
        if (token) {
          try {
            const meUser = await authService.me();
            if (active && meUser) {
              setUser(meUser);
              applyThemePreference(meUser.themePreference);
              return;
            }
          } catch {
            // Token may need refreshing
          }
        }

        const res = await authService.refresh();
        if (active) {
          if (res?.user) {
            setUser(res.user);
            applyThemePreference(res.user.themePreference);
          } else {
            setUser(null);
            setAccessToken(null);
          }
        }
      } catch {
        if (active) {
          setUser(null);
          setAccessToken(null);
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
    setUser(res.user);
    applyThemePreference(res.user.themePreference);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    await authService.register(payload);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: Boolean(user),
        login,
        register,
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

