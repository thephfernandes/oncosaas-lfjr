import axios, { AxiosInstance, AxiosError } from 'axios';
import { getApiUrl } from '@/lib/utils/api-config';

export interface ApiError {
  message: string | string[];
  error: string;
  statusCode: number;
}

export class ApiClientError extends Error {
  statusCode: number;
  error: string;

  constructor(message: string, statusCode: number, error: string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.error = error;
  }
}

class ApiClient {
  private client: AxiosInstance;
  private tenantId: string | null = null;

  constructor() {
    // Usar função utilitária que detecta automaticamente HTTP/HTTPS
    const apiUrl = getApiUrl();
    const baseURL = `${apiUrl}/api/v1`;
    
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token JWT
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Adicionar tenantId se disponível
        const tenantId = this.getTenantId();
        if (tenantId) {
          config.headers['X-Tenant-Id'] = tenantId;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiError>) => {
        if (error.response) {
          const { status, data } = error.response;

          // 401 Unauthorized - redirecionar para login
          if (status === 401) {
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }

          // Criar erro customizado
          const message = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || error.message;

          throw new ApiClientError(message, status, data?.error || 'Unknown Error');
        }

        // Network Error geralmente significa que o servidor não está rodando
        const message = error.code === 'ECONNREFUSED' || error.message === 'Network Error'
          ? 'Servidor não está rodando. Verifique se o backend está iniciado na porta 3002.'
          : error.message || 'Network Error';
        
        throw new ApiClientError(
          message,
          0,
          'Network Error'
        );
      }
    );
  }

  // Gerenciamento de autenticação
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_token', token);
    }
  }

  getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token');
    }
    return null;
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('user');
    }
    this.tenantId = null;
  }

  setTenantId(tenantId: string): void {
    this.tenantId = tenantId;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tenant_id', tenantId);
    }
  }

  getTenantId(): string | null {
    if (this.tenantId) {
      return this.tenantId;
    }
    if (typeof window !== 'undefined') {
      return localStorage.getItem('tenant_id');
    }
    return null;
  }

  // Métodos HTTP
  async get<T>(url: string, config?: unknown): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: unknown): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: unknown): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: unknown): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: unknown): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();

