// Authentication service based on SRS FR-AUTH requirements
import { AxiosError } from 'axios';
import { apiService } from './api.service';
import { AuthResponse, LoginCredentials, User } from '../types';
import { ApiEnvelope, unwrapEnvelope } from '../utils/api-envelope';
import { ApiAuthUser, mapApiUser } from '../utils/map-api-user';

interface LoginApiData {
  accessToken: string;
  user: ApiAuthUser;
}

class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<ApiEnvelope<LoginApiData>>('/auth/login', credentials);
    const loginData = unwrapEnvelope(response.data);

    const token = loginData.accessToken;
    const user = mapApiUser(loginData.user);

    if (token) {
      apiService.setToken(token);
      this.setUser(user);
    }

    return { token, user, expiresIn: 0 };
  }

  async logout(): Promise<void> {
    try {
      await apiService.post('/auth/logout');
    } finally {
      this.clearAuth();
    }
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await apiService.post('/auth/request-password-reset', { email });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await apiService.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
  }

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    }
    return null;
  }

  private setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  private clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  isAuthenticated(): boolean {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('auth_token');
    }
    return false;
  }
}

export function getAuthErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 404) {
      return 'API server not found. Start the backend with: cd backend && npm run start:dev';
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Login failed. Please try again.';
}

export const authService = new AuthService();
