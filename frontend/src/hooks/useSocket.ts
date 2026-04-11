'use client';

import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import { getWebSocketUrl, isRelativeApiEnabled } from '@/lib/utils/api-config';

export const useSocket = (namespace: string = '/') => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const errorToastShown = useRef(false);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) {
      return;
    }

    let cancelled = false;
    const wsUrl = getWebSocketUrl();

    void (async () => {
      let auth: { token?: string; ticket?: string; tenantId: string } = {
        tenantId: user.tenantId,
      };

      if (isRelativeApiEnabled()) {
        try {
          const res = await fetch('/api/v1/auth/socket-ticket', {
            method: 'POST',
            credentials: 'include',
          });
          if (!res.ok || cancelled) {
            return;
          }
          const data = (await res.json()) as { ticket: string };
          auth = { ...auth, ticket: data.ticket };
        } catch {
          return;
        }
      }

      if (cancelled) {
        return;
      }

      const socketInstance = io(`${wsUrl}${namespace}`, {
        withCredentials: true,
        auth,
        transports: ['websocket', 'polling'],
      });
      socketRef.current = socketInstance;

      socketInstance.on('connect', () => {
        setIsConnected(true);
        if (errorToastShown.current) {
          errorToastShown.current = false;
          toast.success('Conexão em tempo real restabelecida', {
            id: 'socket-reconnected',
          });
        }
      });

      socketInstance.on('disconnect', (reason) => {
        setIsConnected(false);
        if (reason !== 'io client disconnect') {
          errorToastShown.current = true;
          toast.warning('Conexão em tempo real interrompida', {
            description: 'Tentando reconectar automaticamente...',
            id: 'socket-disconnected',
          });
        }
      });

      socketInstance.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
        if (!errorToastShown.current) {
          errorToastShown.current = true;
          toast.error('Falha na conexão em tempo real', {
            description: 'As atualizações automáticas podem estar indisponíveis.',
            id: 'socket-error',
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, [user, namespace]);

  return { socketRef, isConnected };
};
