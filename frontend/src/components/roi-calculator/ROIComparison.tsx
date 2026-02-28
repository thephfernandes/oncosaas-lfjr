'use client';

import { ROIInputData, ROIOutputData } from './ROICalculator';

interface ROIComparisonProps {
  inputs: ROIInputData;
  results: ROIOutputData;
}

const DEFAULT_VALUES = {
  taxaReadmissaoAtual: 15,
  numConsultasMes: 2,
};

export function ROIComparison({ inputs, results }: ROIComparisonProps) {
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  const taxaReadmissao =
    inputs.taxaReadmissaoAtual || DEFAULT_VALUES.taxaReadmissaoAtual;
  const numConsultas = inputs.numConsultasMes || DEFAULT_VALUES.numConsultasMes;

  // Antes
  const readmissoesAntes = Math.round(
    (inputs.numPacientes * taxaReadmissao) / 100
  );
  const readmissoesDepois = Math.round(readmissoesAntes * 0.75); // 25% redução

  const consultasAntes = inputs.numPacientes * numConsultas * 12;
  const consultasDepois = Math.round(consultasAntes * 0.6); // 40% redução

  const tempoRespostaAntes = 72; // horas
  const tempoRespostaDepois = 0.25; // 15 minutos

  const getBarWidth = (value: number, max: number) => {
    return Math.min((value / max) * 100, 100);
  };

  const maxReadmissoes = Math.max(readmissoesAntes, readmissoesDepois) * 1.2;
  const maxConsultas = Math.max(consultasAntes, consultasDepois) * 1.2;

  return (
    <div className="space-y-6">
      {/* Readmissões */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Readmissões Anuais</h4>
          <span className="text-sm text-green-600">
            Redução: {formatNumber(readmissoesAntes - readmissoesDepois)} (
            {Math.round(
              ((readmissoesAntes - readmissoesDepois) / readmissoesAntes) * 100
            )}
            %)
          </span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Antes:</span>
              <span>{formatNumber(readmissoesAntes)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                style={{
                  width: `${getBarWidth(readmissoesAntes, maxReadmissoes)}%`,
                }}
              >
                {readmissoesAntes}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Depois:</span>
              <span>{formatNumber(readmissoesDepois)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                style={{
                  width: `${getBarWidth(readmissoesDepois, maxReadmissoes)}%`,
                }}
              >
                {readmissoesDepois}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Consultas */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Consultas Anuais</h4>
          <span className="text-sm text-green-600">
            Redução: {formatNumber(consultasAntes - consultasDepois)} (
            {Math.round(
              ((consultasAntes - consultasDepois) / consultasAntes) * 100
            )}
            %)
          </span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Antes:</span>
              <span>{formatNumber(consultasAntes)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                style={{
                  width: `${getBarWidth(consultasAntes, maxConsultas)}%`,
                }}
              >
                {formatNumber(consultasAntes)}
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Depois:</span>
              <span>{formatNumber(consultasDepois)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                style={{
                  width: `${getBarWidth(consultasDepois, maxConsultas)}%`,
                }}
              >
                {formatNumber(consultasDepois)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tempo de Resposta */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <h4 className="font-semibold">Tempo de Resposta (Alertas)</h4>
          <span className="text-sm text-green-600">
            Melhoria:{' '}
            {Math.round(
              ((tempoRespostaAntes - tempoRespostaDepois) /
                tempoRespostaAntes) *
                100
            )}
            %
          </span>
        </div>
        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Antes:</span>
              <span>{tempoRespostaAntes} horas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-red-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                style={{ width: '100%' }}
              >
                {tempoRespostaAntes}h
              </div>
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span>Depois:</span>
              <span>{tempoRespostaDepois * 60} minutos</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-green-500 h-6 rounded-full flex items-center justify-end pr-2 text-white text-xs"
                style={{
                  width: `${(tempoRespostaDepois / tempoRespostaAntes) * 100}%`,
                }}
              >
                {tempoRespostaDepois * 60}min
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
