'use client';

import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';
import { Alert } from '@/lib/api/alerts';

export const useAlertsSocket = () => {
  const { socketRef, isConnected } = useSocket('/alerts');
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !isConnected) return;

    const handleCriticalAlert = (alert: Alert) => {
      setAlerts((prev) => [alert, ...prev]);

      // Notificação do navegador (opcional)
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Alerta Crítico', {
          body: alert.message,
          icon: '/favicon.ico',
        });
      }
    };

    socket.on('critical_alert', handleCriticalAlert);

    return () => {
      socket.off('critical_alert');
    };
  }, [socketRef, isConnected]);

  return { alerts, isConnected };
};
