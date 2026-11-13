import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService, type LoginPayload, type RegisterPayload, type VerifyOtpAndRegisterPayload } from '../services/authService';
import { setAccessToken, setOnAuthExpired } from '../services/api/apiClient';
import type { UserDto } from '../types/api';
import { applyThemePreference, getCachedTheme } from '../utils/theme';

interface AuthContextValue {
  user: UserDto | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  verifyOtpAndRegister: (payload: VerifyOtpAndRegisterPayload) => Promise<void>;
  demoLogin: () => Promise<void>;
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
    authService
      .refresh()
      .then((res) => {
        if (!active) return;
        if (res?.user) {
          setUser(res.user);
          applyThemePreference(res.user.themePreference);
        } else {
          setUser(null);
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

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
    const res = await authService.register(payload);
    setUser(res.user);
    applyThemePreference(res.user.themePreference);
  }, []);

  const verifyOtpAndRegister = useCallback(async (payload: VerifyOtpAndRegisterPayload) => {
    const res = await authService.verifyOtpAndRegister(payload);
    setUser(res.user);
    applyThemePreference(res.user.themePreference);
  }, []);

  const demoLogin = useCallback(async () => {
    const res = await authService.demoLogin();
    setUser(res.user);
    applyThemePreference(res.user.themePreference);
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
        verifyOtpAndRegister,
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

