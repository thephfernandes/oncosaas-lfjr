'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { patientsApi, Patient } from '@/lib/api/patients';
import { Search, X, ArrowLeft, Download, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChartDrillDownModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterType: 'priority' | 'cancerType' | 'journeyStage' | null;
  filterValue: string | null;
  title: string;
  description?: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-orange-100 text-orange-800 border-orange-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-green-100 text-green-800 border-green-300',
};

const PRIORITY_LABELS: Record<string, string> = {
  CRITICAL: 'Crítico',
  HIGH: 'Alto',
  MEDIUM: 'Médio',
  LOW: 'Baixo',
};

const JOURNEY_STAGE_LABELS: Record<string, string> = {
  SCREENING: 'Rastreio',
  DIAGNOSIS: 'Diagnóstico',
  TREATMENT: 'Tratamento',
  FOLLOW_UP: 'Seguimento',
};

export function ChartDrillDownModal({
  open,
  onOpenChange,
  filterType,
  filterValue,
  title,
  description,
}: ChartDrillDownModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);

  // Buscar todos os pacientes
  const { data: allPatients, isLoading } = useQuery({
    queryKey: ['patients', 'drill-down'],
    queryFn: () => patientsApi.getAll(),
    enabled: open,
  });

  // Filtrar pacientes baseado no tipo de filtro
  useEffect(() => {
    if (!allPatients) {
      setFilteredPatients([]);
      return;
    }

    let filtered = [...allPatients];

    // Aplicar filtro principal
    if (filterType && filterValue) {
      switch (filterType) {
        case 'priority':
          filtered = filtered.filter((p) => p.priorityCategory === filterValue);
          break;
        case 'cancerType':
          filtered = filtered.filter((p) => p.cancerType === filterValue);
          break;
        case 'journeyStage':
          filtered = filtered.filter((p) => p.currentStage === filterValue);
          break;
      }
    }

    // Aplicar busca por nome
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((p) => p.name.toLowerCase().includes(term));
    }

    setFilteredPatients(filtered);
  }, [allPatients, filterType, filterValue, searchTerm]);

  const handleExport = () => {
    // Criar CSV simples
    const headers = [
      'Nome',
      'CPF',
      'Tipo de Câncer',
      'Estágio',
      'Prioridade',
      'Telefone',
    ];
    const rows = filteredPatients.map((p) => [
      p.name,
      p.cpf || '-',
      p.cancerType || '-',
      p.stage || '-',
      PRIORITY_LABELS[p.priorityCategory] || p.priorityCategory,
      p.phone,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `pacientes_${filterValue || 'todos'}_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-gray-600">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>
        <DialogClose onClose={() => onOpenChange(false)} />

        {/* Barra de busca e ações */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-medical-blue-500"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredPatients.length === 0}
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Lista de pacientes */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-medical-blue-500" />
            </div>
          ) : filteredPatients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Nenhum paciente encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">
                          {patient.name}
                        </h4>
                        <Badge
                          className={cn(
                            'text-xs',
                            PRIORITY_COLORS[patient.priorityCategory] ||
                              'bg-gray-100 text-gray-800'
                          )}
                        >
                          {PRIORITY_LABELS[patient.priorityCategory] ||
                            patient.priorityCategory}
                        </Badge>
                        {patient.cancerType && (
                          <Badge variant="outline" className="text-xs">
                            {patient.cancerType}
                          </Badge>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {JOURNEY_STAGE_LABELS[patient.currentStage] ||
                            patient.currentStage}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                        {patient.cpf && (
                          <div>
                            <span className="font-medium">CPF:</span>{' '}
                            {patient.cpf}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Telefone:</span>{' '}
                          {patient.phone}
                        </div>
                        {patient.stage && (
                          <div>
                            <span className="font-medium">Estágio:</span>{' '}
                            {patient.stage}
                          </div>
                        )}
                        {patient.diagnosisDate && (
                          <div>
                            <span className="font-medium">Diagnóstico:</span>{' '}
                            {new Date(patient.diagnosisDate).toLocaleDateString(
                              'pt-BR'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        Score: {patient.priorityScore}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rodapé com contagem */}
        <div className="pt-4 border-t flex items-center justify-between text-sm text-gray-600">
          <span>
            {filteredPatients.length} paciente
            {filteredPatients.length !== 1 ? 's' : ''} encontrado
            {filteredPatients.length !== 1 ? 's' : ''}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
