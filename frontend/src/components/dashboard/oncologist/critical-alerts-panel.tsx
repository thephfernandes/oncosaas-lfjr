'use client';

import { useAlerts } from '@/hooks/useAlerts';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AlertTriangle, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAcknowledgeAlert, useResolveAlert } from '@/hooks/useAlerts';
import { Alert } from '@/lib/api/alerts';
import { useState } from 'react';

interface CriticalAlertsPanelProps {
  onAlertSelect?: (alert: Alert) => void;
  onClose?: () => void;
}

export function CriticalAlertsPanel({
  onAlertSelect,
  onClose,
}: CriticalAlertsPanelProps) {
  const { data: alerts, isLoading } = useAlerts('PENDING');
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(
    new Set()
  );
  const [isExpanded, setIsExpanded] = useState(true); // Expandido por padrão para alertas críticos

  // Filtrar alertas críticos e de alta severidade (incluindo NAVIGATION_DELAY)
  // Etapas de diagnóstico/tratamento atrasadas podem ser HIGH ou CRITICAL
  const criticalAlerts =
    alerts?.filter(
      (alert) =>
        (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') &&
        alert.status === 'PENDING' &&
        !dismissedAlerts.has(alert.id)
    ) || [];

  if (isLoading) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-red-200 rounded w-3/4 mb-2"></div>
        <div className="h-3 bg-red-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (criticalAlerts.length === 0) {
    return null; // Não renderizar se não houver alertas críticos
  }

  const handleDismiss = (alertId: string) => {
    setDismissedAlerts((prev) => new Set(prev).add(alertId));
  };

  return (
    <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 mb-6 shadow-md">
      <div className="flex items-start justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 flex-1 text-left hover:opacity-80 transition-opacity"
        >
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-red-600" />
          ) : (
            <ChevronDown className="h-5 w-5 text-red-600" />
          )}
          <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
          <h3 className="text-lg font-semibold text-red-900">
            Alertas Críticos ({criticalAlerts.length})
          </h3>
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="text-red-600 hover:text-red-800 ml-2"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {isExpanded && (
        <div className="space-y-3 mt-3">
          {criticalAlerts.slice(0, 3).map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-lg border border-red-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onAlertSelect?.(alert)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-red-900 truncate">
                      {alert.patient?.name || 'Paciente'}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-700 mb-2 break-words">
                    {alert.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>
                      {formatDistanceToNow(new Date(alert.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                    {alert.type && (
                      <span className="capitalize">
                        {alert.type.replace('_', ' ')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-3 pt-3 border-t border-red-100">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-red-700 border-red-300 hover:bg-red-50"
                  onClick={(e) => {
                    e.stopPropagation();
                    acknowledgeAlert.mutate(alert.id);
                  }}
                  disabled={acknowledgeAlert.isPending}
                >
                  Reconhecer
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    resolveAlert.mutate(alert.id);
                  }}
                  disabled={resolveAlert.isPending}
                >
                  Resolver
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss(alert.id);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
          {criticalAlerts.length > 3 && (
            <div className="text-sm text-red-700 text-center pt-2">
              +{criticalAlerts.length - 3} alertas críticos adicionais
            </div>
          )}
        </div>
      )}
    </div>
  );
}
