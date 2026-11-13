import { apiClient, refreshSessionToken, setAccessToken } from './api/apiClient';
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
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },

  async sendOtp(payload: SendOtpPayload): Promise<SendOtpResponse> {
    const res = await apiClient.post<ApiResponse<SendOtpResponse>>('/auth/send-otp', payload);
    return res.data.data;
  },

  async verifyOtpAndRegister(payload: VerifyOtpAndRegisterPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/verify-otp-and-register', payload);
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/login', payload);
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },

  async demoLogin(): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>('/auth/demo-login', {});
    setAccessToken(res.data.data.accessToken);
    return res.data.data;
  },

  async resetDemoData(): Promise<void> {
    await apiClient.post('/auth/demo-reset', {});
  },

  async refresh(): Promise<AuthResponse | null> {
    return refreshSessionToken();
  },

  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout', {});
    } finally {
      setAccessToken(null);
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
    return res.data.data;
  }
};

