'use client';

import { ROIOutputData } from './ROICalculator';

interface ROIResultsProps {
  results: ROIOutputData;
}

export function ROIResults({ results }: ROIResultsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 1) => {
    return value.toFixed(decimals).replace('.', ',');
  };

  return (
    <div className="space-y-6">
      {/* Investimento */}
      <div className="border-b pb-4">
        <h3 className="text-lg font-semibold mb-3 text-green-600">
          💰 Investimento
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Mensal:</span>
            <span className="font-semibold">
              {formatCurrency(results.investimentoMensal)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Anual:</span>
            <span className="font-semibold">
              {formatCurrency(results.investimentoAnual)}
            </span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Setup (único):</span>
            <span>{formatCurrency(results.setupInicial)}</span>
          </div>
        </div>
      </div>

      {/* Economia */}
      <div>
        <h3 className="text-lg font-semibold mb-3 text-blue-600">
          💵 Economia Anual
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Readmissões:</span>
            <span className="font-medium">
              {formatCurrency(results.economiaReadmissoes)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Consultas:</span>
            <span className="font-medium">
              {formatCurrency(results.economiaConsultas)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Eficiência:</span>
            <span className="font-medium">
              {formatCurrency(results.economiaEficiencia)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Detecção Precoce:</span>
            <span className="font-medium">
              {formatCurrency(results.economiaDetecaoPrecoce)}
            </span>
          </div>
          <div className="flex justify-between pt-2 border-t font-bold text-lg">
            <span>TOTAL:</span>
            <span className="text-green-600">
              {formatCurrency(results.economiaTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* ROI */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-3">📊 ROI</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Multiplicador:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatNumber(results.roi)}x
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Para cada R$ 1 investido, retorna R$ {formatNumber(results.roi)}
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Payback:</span>
              <span className="text-xl font-semibold">
                {formatNumber(results.paybackPeriod)} meses
              </span>
            </div>
            <div className="text-xs text-muted-foreground">
              Tempo para recuperar investimento inicial
            </div>
          </div>
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Economia/Paciente:</span>
              <span className="text-lg font-semibold text-green-600">
                {formatCurrency(results.economiaPorPaciente)}/ano
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-2">
        <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
          📥 Baixar Relatório
        </button>
        <button className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50">
          📧 Enviar por Email
        </button>
      </div>
    </div>
  );
}
