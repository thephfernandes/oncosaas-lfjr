'use client';

import { WhatsAppConnection } from '@/lib/api/whatsapp-connections';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Trash2,
  Play,
  Star,
} from 'lucide-react';

interface WhatsAppConnectionCardProps {
  connection: WhatsAppConnection;
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSetDefault: (id: string) => void;
  isTesting?: boolean;
}

export function WhatsAppConnectionCard({
  connection,
  onDelete,
  onTest,
  onSetDefault,
  isTesting = false,
}: WhatsAppConnectionCardProps) {
  const getStatusBadge = () => {
    switch (connection.status) {
      case 'CONNECTED':
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Conectado
          </Badge>
        );
      case 'CONNECTING':
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Conectando
          </Badge>
        );
      case 'ERROR':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Erro
          </Badge>
        );
      case 'EXPIRED':
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            Expirado
          </Badge>
        );
      case 'DISCONNECTED':
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Desconectado
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Pendente
          </Badge>
        );
    }
  };

  const getAuthMethodBadge = () => {
    return connection.authMethod === 'OAUTH' ? (
      <Badge variant="default">OAuth</Badge>
    ) : (
      <Badge variant="secondary">Manual</Badge>
    );
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle className="text-lg">{connection.name}</CardTitle>
              {connection.isDefault && (
                <Badge variant="default" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  Padrão
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600">{connection.phoneNumber}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            {getStatusBadge()}
            {getAuthMethodBadge()}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {connection.lastError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">
              <strong>Erro:</strong> {connection.lastError}
            </p>
          </div>
        )}
        {connection.lastSyncAt && (
          <p className="text-xs text-gray-500 mb-4">
            Última sincronização:{' '}
            {new Date(connection.lastSyncAt).toLocaleString('pt-BR')}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onTest(connection.id)}
            disabled={isTesting || connection.status !== 'CONNECTED'}
          >
            <Play className="h-4 w-4 mr-1" />
            {isTesting ? 'Testando...' : 'Testar'}
          </Button>
          {!connection.isDefault && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSetDefault(connection.id)}
            >
              <Star className="h-4 w-4 mr-1" />
              Padrão
            </Button>
          )}
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onDelete(connection.id)}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Deletar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
