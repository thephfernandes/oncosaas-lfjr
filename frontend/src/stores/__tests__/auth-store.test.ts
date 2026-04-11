import { beforeEach, describe, expect, it, vi } from 'vitest';
import { waitFor } from '@testing-library/react';
import type { User } from '@/lib/api/auth';

const { mockAuthApi, mockApiClient } = vi.hoisted(() => ({
  mockAuthApi: {
    login: vi.fn(),
    registerInstitution: vi.fn(),
    logout: vi.fn(),
    refreshSessionUser: vi.fn().mockResolvedValue(null),
  },
  mockApiClient: {
    setTenantId: vi.fn(),
    clearAuth: vi.fn(),
    onTokenRefreshed: vi.fn(() => () => {}),
  },
}));

vi.mock('@/lib/api/auth', () => ({
  authApi: mockAuthApi,
}));

vi.mock('@/lib/api/client', () => ({
  apiClient: mockApiClient,
}));

import { useAuthStore } from '../auth-store';

const baseUser: User = {
  id: 'u1',
  email: 'nurse@onconav.local',
  name: 'Nurse',
  role: 'NURSE',
  tenantId: 'tenant-1',
};

describe('useAuthStore initialize', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockAuthApi.refreshSessionUser.mockResolvedValue(null);
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isInitializing: true,
    });
  });

  it('starts unauthenticated when there is no persisted session', () => {
    useAuthStore.getState().initialize();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isInitializing).toBe(false);
  });

  it('restores authenticated session when user, tenant exist and profile succeeds', async () => {
    localStorage.setItem('tenant_id', baseUser.tenantId);
    localStorage.setItem('user', JSON.stringify(baseUser));
    mockAuthApi.refreshSessionUser.mockResolvedValue(baseUser);

    useAuthStore.getState().initialize();

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isInitializing).toBe(false);
      expect(state.isAuthenticated).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user?.id).toBe(baseUser.id);
    expect(mockApiClient.setTenantId).toHaveBeenCalledWith(baseUser.tenantId);
    expect(mockAuthApi.refreshSessionUser).toHaveBeenCalled();
  });

  it('deduplica chamadas paralelas a initialize (um GET /auth/profile)', async () => {
    localStorage.setItem('tenant_id', baseUser.tenantId);
    localStorage.setItem('user', JSON.stringify(baseUser));
    mockAuthApi.refreshSessionUser.mockResolvedValue(baseUser);

    useAuthStore.getState().initialize();
    useAuthStore.getState().initialize();

    await waitFor(() => {
      expect(useAuthStore.getState().isInitializing).toBe(false);
    });

    expect(mockAuthApi.refreshSessionUser).toHaveBeenCalledTimes(1);
  });

  it('clears session when profile returns null', async () => {
    localStorage.setItem('tenant_id', baseUser.tenantId);
    localStorage.setItem('user', JSON.stringify(baseUser));
    mockAuthApi.refreshSessionUser.mockResolvedValue(null);

    useAuthStore.getState().initialize();

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isInitializing).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    expect(mockApiClient.clearAuth).toHaveBeenCalled();
  });

  it('clears session when profile throws', async () => {
    localStorage.setItem('tenant_id', baseUser.tenantId);
    localStorage.setItem('user', JSON.stringify(baseUser));
    mockAuthApi.refreshSessionUser.mockRejectedValue(new Error('unauthorized'));

    useAuthStore.getState().initialize();

    await waitFor(() => {
      const state = useAuthStore.getState();
      expect(state.isInitializing).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    expect(mockApiClient.clearAuth).toHaveBeenCalled();
  });
});
