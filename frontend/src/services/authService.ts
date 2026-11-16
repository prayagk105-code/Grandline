import {
  apiClient,
  clearAuthSession,
  getRefreshToken,
  refreshSessionToken,
  setAccessToken,
  setCachedUser,
  setRefreshToken,
  setTokenExpiresAt
} from './api/apiClient';
import type { ApiResponse, AuthResponse, ForgotPasswordResponse, SendOtpResponse, UserDto } from '../types/api';

export interface RegisterPayload {
  displayName: string;
  email: string;
  password: string;
  timeZoneId?: string;
}

export interface SendOtpPayload {
  email: string;
  displayName?: string;
}

export interface VerifyOtpAndRegisterPayload {
  displayName: string;
  email: string;
  password: string;
  otp: string;
  timeZoneId?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ResetPasswordPayload {
  email: string;
  token: string;
  newPassword: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/register', payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    const data = res.data.data;
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
  },

  async demoLogin(): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/demo-login', {});
    const data = res.data.data;
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
  },

  async refresh(): Promise<AuthResponse | null> {
    return refreshSessionToken();
  },

  async logout(): Promise<void> {
    try {
      const storedRefreshToken = getRefreshToken();
      await apiClient.post('/auth/logout', { refreshToken: storedRefreshToken });
    } catch {
      // ignore network errors on logout
    } finally {
      clearAuthSession();
    }
  },

  async forgotPassword(email: string): Promise<ForgotPasswordResponse> {
    const res = await apiClient.post<ApiResponse<ForgotPasswordResponse>>('/auth/forgot-password', { email });
    return res.data.data;
  },

  async resetPassword(payload: ResetPasswordPayload): Promise<void> {
    await apiClient.post('/auth/reset-password', payload);
  },

  async me(): Promise<UserDto> {
    const res = await apiClient.get<ApiResponse<UserDto>>('/auth/me');
    const user = res.data.data;
    if (user) {
      setCachedUser(user);
    }
    return user;
  }
};
