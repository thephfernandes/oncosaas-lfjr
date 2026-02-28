'use client';

import { WhatsAppConnection } from '@/lib/api/whatsapp-connections';
import { WhatsAppConnectionCard } from './whatsapp-connection-card';
import { useState } from 'react';

interface WhatsAppConnectionsListProps {
  connections: WhatsAppConnection[];
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSetDefault: (id: string) => void;
}

export function WhatsAppConnectionsList({
  connections,
  onDelete,
  onTest,
  onSetDefault,
}: WhatsAppConnectionsListProps) {
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTest(id);
    } finally {
      setTestingId(null);
    }
  };

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          Nenhuma conexão WhatsApp configurada ainda.
        </p>
        <p className="text-sm text-gray-400">
          Clique em "Conectar Novo Número" para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {connections.map((connection) => (
        <WhatsAppConnectionCard
          key={connection.id}
          connection={connection}
          onDelete={onDelete}
          onTest={handleTest}
          onSetDefault={onSetDefault}
          isTesting={testingId === connection.id}
        />
      ))}
    </div>
  );
}
