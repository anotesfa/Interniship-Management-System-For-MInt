// Base API service with axios configuration
import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add JWT token
    this.api.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid - avoid redirect when already on login or signup page
          const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
          if (currentPath !== '/login' && currentPath !== '/university/signup') {
            this.clearToken();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  private clearToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user');
    }
  }

  public setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  public get<T>(url: string, params?: any, config?: AxiosRequestConfig) {
    return this.api.get<T>(url, { params, ...config });
  }

  public post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.api.post<T>(url, data, config);
  }

  public put<T>(url: string, data?: any) {
    return this.api.put<T>(url, data);
  }

  public patch<T>(url: string, data?: any) {
    return this.api.patch<T>(url, data);
  }

  public delete<T>(url: string) {
    return this.api.delete<T>(url);
  }

  public postFormData<T>(url: string, formData: FormData) {
    return this.api.post<T>(url, formData, {
      headers: {
        // Do NOT set Content-Type manually — let the browser set it with the correct multipart boundary
        'Content-Type': undefined,
      },
    });
  }
}

export const apiService = new ApiService();
