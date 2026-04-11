import axios, { AxiosInstance, AxiosError, AxiosRequestHeaders, AxiosRequestConfig } from 'axios';
import { getApiUrlForAxios, isRelativeApiEnabled } from '@/lib/utils/api-config';

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

/** Atributos de cookie de sessão: SameSite=Lax; Secure em HTTPS (produção). */
function sessionCookieAttrs(): string {
  const base = 'path=/; SameSite=Lax';
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `${base}; Secure`;
  }
  return base;
}

class ApiClient {
  private client: AxiosInstance;
  private tenantId: string | null = null;
  private refreshPromise: Promise<string> | null = null;
  private tokenRefreshListeners: Set<(token: string) => void> = new Set();

  /** Register a callback invoked whenever the access token is silently refreshed. */
  onTokenRefreshed(listener: (token: string) => void): () => void {
    this.tokenRefreshListeners.add(listener);
    return () => this.tokenRefreshListeners.delete(listener);
  }

  constructor() {
    const apiUrl = getApiUrlForAxios();
    const baseURL = apiUrl ? `${apiUrl.replace(/\/$/, '')}/api/v1` : '/api/v1';

    this.client = axios.create({
      baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor de request: tenant (JWT vem do cookie HttpOnly `access_token` no mesmo host da API)
    this.client.interceptors.request.use(
      (config) => {
        const tenantId = this.getTenantId();
        if (tenantId) {
          config.headers['X-Tenant-Id'] = tenantId;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Interceptor de response: renovar token em 401
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiError>) => {
        const originalRequest = error.config as typeof error.config & {
          _retry?: boolean;
        };

        if (
          error.response?.status === 401 &&
          !originalRequest?._retry &&
          originalRequest?.url !== '/auth/refresh'
        ) {
          originalRequest._retry = true;
          try {
            await this.refreshAccessToken();
            originalRequest.headers = (originalRequest.headers ?? {}) as AxiosRequestHeaders;
            return this.client(originalRequest);
          } catch {
            this.clearAuth();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        if (error.response) {
          const { status, data } = error.response;
          const message = Array.isArray(data?.message)
            ? data.message.join(', ')
            : data?.message || error.message;

          throw new ApiClientError(
            message,
            status,
            data?.error || 'Unknown Error'
          );
        }

        const message =
          error.code === 'ECONNREFUSED' || error.message === 'Network Error'
            ? 'Servidor não está rodando. Verifique se o backend está iniciado na porta 3002.'
            : error.message || 'Network Error';

        throw new ApiClientError(message, 0, 'Network Error');
      }
    );
  }

  /**
   * Renova access token. Refresh token vem de cookie HttpOnly (ou legado em localStorage).
   */
  private async refreshAccessToken(): Promise<string> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      const legacy = this.getRefreshToken();
      const response = await this.client.post<{
        access_token?: string;
      }>('/auth/refresh', legacy ? { refresh_token: legacy } : {});
      const access_token = response.data?.access_token;
      if (access_token) {
        this.setMiddlewareRouteMirrorCookie(access_token);
      }
      if (legacy && typeof window !== 'undefined') {
        localStorage.removeItem('refresh_token');
      }
      this.tokenRefreshListeners.forEach((fn) => fn(access_token ?? ''));
      return access_token ?? '';
    })().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  // ─── Sessão: JWT em cookie HttpOnly na API; espelho só para middleware Next (origem diferente em dev) ───

  /**
   * Espelha o JWT em cookie legível pelo middleware do Next.js (validação com JWT_SECRET).
   * Não persiste em localStorage — o access real fica no cookie HttpOnly do backend.
   */
  setMiddlewareRouteMirrorCookie(accessToken: string): void {
    if (isRelativeApiEnabled()) {
      return;
    }
    if (typeof window !== 'undefined') {
      const attrs = sessionCookieAttrs();
      document.cookie = `auth_token=${encodeURIComponent(accessToken)}; ${attrs}`;
      document.cookie = `session_active=1; ${attrs}`;
    }
  }

  /** @deprecated compat — usar setMiddlewareRouteMirrorCookie */
  setToken(token: string): void {
    this.setMiddlewareRouteMirrorCookie(token);
  }

  /** Lê o espelho `auth_token` (não HttpOnly) para heurísticas como expiração; o Bearer não é mais usado. */
  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }
    const match = document.cookie.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (!match?.[1]) {
      return null;
    }
    try {
      return decodeURIComponent(match[1]);
    } catch {
      return null;
    }
  }

  /** Legado: o backend grava refresh em cookie HttpOnly; não persistir no cliente. */
  setRefreshToken(_token: string): void {
    /* noop — compatível com chamadas antigas em auth.ts */
  }

  /** Apenas migração de sessões antigas que ainda têm refresh no localStorage. */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refresh_token');
    }
    return null;
  }

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() / 1000 > payload.exp - 30; // 30s buffer
    } catch {
      return true;
    }
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('tenant_id');
      localStorage.removeItem('user');
      const attrs = sessionCookieAttrs();
      document.cookie = `auth_token=; ${attrs}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
      document.cookie = `session_active=; ${attrs}; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
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

  // ─── HTTP methods ─────────────────────────────────────────────────────────

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data;
  }

  /** Upload multipart: reutiliza interceptors (auth, refresh, tenant). */
  async postFormData<T>(url: string, formData: FormData): Promise<T> {
    const response = await this.client.post<T>(url, formData, {
      transformRequest: (data, headers) => {
        if (data instanceof FormData) {
          delete (headers as Record<string, unknown>)['Content-Type'];
        }
        return data;
      },
    });
    return response.data;
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.patch<T>(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
