import { apiClient } from './client';

export interface LoginDto {
  email: string;
  password: string;
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

export interface RegisterInstitutionDto {
  institutionName: string;
  name: string;
  email: string;
  password: string;
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
  /** Presente para coordenadores (prontuário) */
  clinicalSubrole?: 'NURSING' | 'MEDICAL' | null;
  tenantId: string;
  tenant?: {
    id: string;
    name: string;
    settings?: {
      enabledCancerTypes?: string[];
      [key: string]: unknown;
    } | null;
  };
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/** Resposta de GET /auth/profile — alinhada ao que o backend retorna */
export interface AuthProfileResponse {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  clinicalSubrole: 'NURSING' | 'MEDICAL' | null;
  tenantId: string;
  tenant?: User['tenant'];
  mfaEnabled?: boolean;
}

export const authApi = {
  async login(credentials: LoginDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/login',
      credentials
    );

    apiClient.setToken(response.access_token);
    apiClient.setRefreshToken(response.refresh_token);
    apiClient.setTenantId(response.user.tenantId);

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

    apiClient.setToken(response.access_token);
    if (response.refresh_token) {
      apiClient.setRefreshToken(response.refresh_token);
    }
    apiClient.setTenantId(response.user.tenantId);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  async registerInstitution(data: RegisterInstitutionDto): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      '/auth/register-institution',
      data
    );

    apiClient.setToken(response.access_token);
    apiClient.setRefreshToken(response.refresh_token);
    apiClient.setTenantId(response.user.tenantId);

    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(response.user));
    }

    return response;
  },

  async logout(): Promise<void> {
    const refreshToken = apiClient.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post('/auth/logout', { refresh_token: refreshToken });
      } catch {
        // Ignorar erros no logout — limpar dados locais de qualquer forma
      }
    }
    apiClient.clearAuth();
  },

  getCurrentUser(): User | null {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        try {
          return JSON.parse(userStr);
        } catch {
          return null;
        }
      }
    }
    return null;
  },

  isAuthenticated(): boolean {
    return !!apiClient.getToken() && !apiClient.isTokenExpired();
  },

  /**
   * Atualiza nome, papel, clinicalSubrole e tenant a partir do servidor.
   * Necessário após evoluir o modelo (ex.: subpapel clínico) com sessão antiga no localStorage.
   */
  async refreshSessionUser(): Promise<User | null> {
    try {
      const profile = await apiClient.get<AuthProfileResponse>('/auth/profile');
      const prev = this.getCurrentUser();
      const merged: User = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        clinicalSubrole: profile.clinicalSubrole ?? null,
        tenantId: profile.tenantId,
        tenant: profile.tenant ?? prev?.tenant,
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(merged));
      }
      return merged;
    } catch {
      return null;
    }
  },
};
