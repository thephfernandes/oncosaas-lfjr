'use client';

import { WhatsAppConnection } from '@/lib/api/whatsapp-connections';
import { WhatsAppConnectionCard } from './whatsapp-connection-card';
import { useState } from 'react';

interface WhatsAppConnectionsListProps {
  connections: WhatsAppConnection[];
  onDelete: (id: string) => void;
  onTest: (id: string) => void;
  onSetDefault: (id: string) => void;
  onRunMetaTests?: (id: string) => void;
}

export function WhatsAppConnectionsList({
  connections,
  onDelete,
  onTest,
  onSetDefault,
  onRunMetaTests,
}: WhatsAppConnectionsListProps) {
  const [testingId, setTestingId] = useState<string | null>(null);
  const [runningMetaTestsId, setRunningMetaTestsId] = useState<string | null>(
    null
  );

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      await onTest(id);
    } finally {
      setTestingId(null);
    }
  };

  const handleRunMetaTests = async (id: string) => {
    if (!onRunMetaTests) return;
    setRunningMetaTestsId(id);
    try {
      await onRunMetaTests(id);
    } finally {
      setRunningMetaTestsId(null);
    }
  };

  if (connections.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          Nenhuma conexão WhatsApp configurada ainda.
        </p>
        <p className="text-sm text-gray-400">
          {`Clique em "Conectar Novo Número" para começar.`}
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
          onRunMetaTests={onRunMetaTests ? handleRunMetaTests : undefined}
          isTesting={testingId === connection.id}
          isRunningMetaTests={runningMetaTestsId === connection.id}
        />
      ))}
    </div>
  );
}
