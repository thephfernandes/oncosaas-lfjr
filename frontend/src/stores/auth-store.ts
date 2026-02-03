'use client';

import { create } from 'zustand';
import { authApi, User } from '@/lib/api/auth';
import { apiClient } from '@/lib/api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitializing: true,

  initialize: () => {
    if (typeof window === 'undefined') {
      set({ isInitializing: false });
      return;
    }

    // Marcar como inicializando
    set({ isInitializing: true });

    const token = localStorage.getItem('auth_token');
    const userStr = localStorage.getItem('user');
    const tenantId = localStorage.getItem('tenant_id');

    if (token && userStr && tenantId) {
      try {
        const user = JSON.parse(userStr);

        // Configurar token no cliente API
        apiClient.setToken(token);
        apiClient.setTenantId(tenantId);

        set({
          user,
          token,
          isAuthenticated: true,
          isInitializing: false,
        });
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Limpar dados inválidos
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user');
        localStorage.removeItem('tenant_id');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isInitializing: false,
        });
      }
    } else {
      // Não há dados salvos, marcar como não autenticado
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isInitializing: false,
      });
    }
  },

  login: async (email: string, password: string) => {
    const response = await authApi.login({ email, password });

    // Atualizar estado de forma síncrona
    set({
      user: response.user,
      token: response.access_token,
      isAuthenticated: true,
      isInitializing: false,
    });
  },

  logout: () => {
    authApi.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: false,
    });
  },

  setUser: (user: User) => {
    set({ user, isAuthenticated: true });
  },

  setToken: (token: string) => {
    set({ token, isAuthenticated: true });
  },
}));
