import { apiClient } from './client';

export interface LoginDto {
  email: string;
  password: string;
  /**
   * ID do tenant (opcional, mas recomendado para ambientes multi-tenant)
   * Se não fornecido, o sistema tentará encontrar o usuário apenas pelo email.
   */
  tenantId?: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role:
    | 'ADMIN'
    | 'ONCOLOGIST'
    | 'DOCTOR'
    | 'NURSE_CHIEF'
    | 'NURSE'
    | 'COORDINATOR';
  tenantId: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role:
    | 'ADMIN'
    | 'ONCOLOGIST'
    | 'DOCTOR'
    | 'NURSE_CHIEF'
    | 'NURSE'
    | 'COORDINATOR';
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
  };
}

export interface LoginResponse {
  access_token: string;
  user: User;
}

export const authApi = {
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );

    // Salvar token e tenantId
    apiClient.setToken(response.access_token);
    apiClient.setTenantId(response.user.tenantId);

    // Salvar dados do usuário
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  async register(data: RegisterDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/register',
      data
    );

    // Salvar token e tenantId
    apiClient.setToken(response.access_token);
    apiClient.setTenantId(response.user.tenantId);

    // Salvar dados do usuário
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  logout(): void {
    apiClient.clearAuth();
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },
};
