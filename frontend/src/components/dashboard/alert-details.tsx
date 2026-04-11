'use client';

import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  AlertTriangle,
  Clock,
  User,
  FileText,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Alert } from '@/lib/api/alerts';
import { Button } from '@/components/ui/button';
import { useAcknowledgeAlert, useResolveAlert } from '@/hooks/useAlerts';
import { maskPhone } from '@/lib/utils/mask-sensitive';

interface AlertDetailsProps {
  alert: Alert | null;
  isLoading?: boolean;
  onClose?: () => void;
}

export function AlertDetails({ alert, isLoading, onClose }: AlertDetailsProps) {
  const acknowledgeAlert = useAcknowledgeAlert();
  const resolveAlert = useResolveAlert();

  if (isLoading) {
    return (
      <div className="bg-white p-4 space-y-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse w-3/4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-4 bg-gray-100 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="bg-white p-4 text-center text-gray-500">
        <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
        <p>Selecione um alerta para ver os detalhes</p>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'HIGH':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'MEDIUM':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'LOW':
        return 'text-green-600 bg-green-50 border-green-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      CRITICAL_SYMPTOM: 'Sintoma Crítico',
      NO_RESPONSE: 'Sem Resposta',
      DELAYED_APPOINTMENT: 'Consulta Atrasada',
      SCORE_CHANGE: 'Mudança de Score',
      SYMPTOM_WORSENING: 'Piora de Sintomas',
    };
    return labels[type] || type.replace('_', ' ');
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'ACKNOWLEDGED':
        return <Clock className="h-5 w-5 text-blue-600" />;
      case 'DISMISSED':
        return <XCircle className="h-5 w-5 text-gray-600" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      PENDING: 'Pendente',
      ACKNOWLEDGED: 'Reconhecido',
      RESOLVED: 'Resolvido',
      DISMISSED: 'Descartado',
    };
    return labels[status] || status;
  };

  return (
    <div className="bg-white p-4 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle
            className={`h-6 w-6 ${
              alert.severity === 'CRITICAL'
                ? 'text-red-600'
                : alert.severity === 'HIGH'
                  ? 'text-orange-600'
                  : 'text-yellow-600'
            }`}
          />
          <h2 className="text-xl font-bold">Detalhes do Alerta</h2>
        </div>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            ✕
          </Button>
        )}
      </div>

      {/* Status e Severidade */}
      <div className="flex items-center gap-3">
        {getStatusIcon(alert.status)}
        <div className="flex-1">
          <p className="text-sm text-gray-500">Status</p>
          <p className="font-semibold">{getStatusLabel(alert.status)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Severidade</p>
          <span
            className={`px-3 py-1 rounded-full text-xs font-semibold border ${getSeverityColor(
              alert.severity
            )}`}
          >
            {alert.severity}
          </span>
        </div>
      </div>

      {/* Paciente */}
      {alert.patient && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-3">
            <User className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500">Paciente</p>
              <p className="font-semibold">{alert.patient.name}</p>
              {alert.patient.phone && (
                <p className="text-sm text-gray-600 mt-1">
                  {maskPhone(alert.patient.phone)}
                </p>
              )}
              {alert.patient.priorityScore !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Score: {alert.patient.priorityScore}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tipo e Mensagem */}
      <div className="border-t pt-4 space-y-3">
        <div>
          <p className="text-sm text-gray-500">Tipo de Alerta</p>
          <p className="font-semibold">{getTypeLabel(alert.type)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500 mb-2">Mensagem</p>
          <p className="text-sm bg-gray-50 p-3 rounded border">
            {alert.message}
          </p>
        </div>
      </div>

      {/* Contexto (Metadados) */}
      {alert.context && Object.keys(alert.context).length > 0 && (
        <div className="border-t pt-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-gray-500 mb-2">Contexto</p>
              <div className="bg-gray-50 p-3 rounded border text-xs font-mono overflow-x-auto">
                <pre>{JSON.stringify(alert.context, null, 2)}</pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timestamps */}
      <div className="border-t pt-4 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-gray-400" />
          <span className="text-gray-500">Criado em:</span>
          <span className="font-medium">
            {format(new Date(alert.createdAt), "dd/MM/yyyy 'às' HH:mm", {
              locale: ptBR,
            })}
          </span>
        </div>
        {alert.acknowledgedAt && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-blue-400" />
            <span className="text-gray-500">Reconhecido em:</span>
            <span className="font-medium">
              {format(new Date(alert.acknowledgedAt), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
        )}
        {alert.resolvedAt && (
          <div className="flex items-center gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-400" />
            <span className="text-gray-500">Resolvido em:</span>
            <span className="font-medium">
              {format(new Date(alert.resolvedAt), "dd/MM/yyyy 'às' HH:mm", {
                locale: ptBR,
              })}
            </span>
          </div>
        )}
      </div>

      {/* Ações (se pendente) */}
      {alert.status === 'PENDING' && (
        <div className="border-t pt-4 space-y-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => acknowledgeAlert.mutate(alert.id)}
              disabled={acknowledgeAlert.isPending}
            >
              {acknowledgeAlert.isPending ? 'Reconhecendo...' : 'Reconhecer'}
            </Button>
            <Button
              variant="default"
              size="sm"
              className="flex-1"
              onClick={() => resolveAlert.mutate(alert.id)}
              disabled={resolveAlert.isPending}
            >
              {resolveAlert.isPending ? 'Resolvendo...' : 'Resolver'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
