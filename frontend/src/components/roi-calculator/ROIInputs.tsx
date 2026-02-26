'use client';

import { ROIInputData } from './ROICalculator';

type TipoInstituicao = 'clinica-pequena' | 'hospital-medio' | 'hospital-grande';

interface ROIInputsProps {
  inputs: ROIInputData;
  onChange: (inputs: ROIInputData) => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
}

const DEFAULT_VALUES = {
  taxaReadmissaoAtual: 15,
  custoMedioConsulta: 300,
  custoReadmissao: 25000,
  numConsultasMes: 2,
};

export function ROIInputs({
  inputs,
  onChange,
  showAdvanced,
  onToggleAdvanced,
}: ROIInputsProps) {
  const updateInput = (
    key: keyof ROIInputData,
    value: ROIInputData[keyof ROIInputData]
  ) => {
    onChange({ ...inputs, [key]: value });
  };

  return (
    <div className="space-y-4">
      {/* Número de Pacientes */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Número de Pacientes/Mês
        </label>
        <input
          type="number"
          min="1"
          max="10000"
          value={inputs.numPacientes || ''}
          onChange={(e) =>
            updateInput('numPacientes', parseInt(e.target.value) || 0)
          }
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      {/* Tipo de Instituição */}
      <div>
        <label className="block text-sm font-medium mb-2">
          Tipo de Instituição
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              value="clinica-pequena"
              checked={inputs.tipoInstituicao === 'clinica-pequena'}
              onChange={(e) =>
                updateInput(
                  'tipoInstituicao',
                  e.target.value as TipoInstituicao
                )
              }
              className="mr-2"
            />
            Clínica Pequena (até 100 pacientes)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="hospital-medio"
              checked={inputs.tipoInstituicao === 'hospital-medio'}
              onChange={(e) =>
                updateInput(
                  'tipoInstituicao',
                  e.target.value as TipoInstituicao
                )
              }
              className="mr-2"
            />
            Hospital Médio (101-500 pacientes)
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="hospital-grande"
              checked={inputs.tipoInstituicao === 'hospital-grande'}
              onChange={(e) =>
                updateInput(
                  'tipoInstituicao',
                  e.target.value as TipoInstituicao
                )
              }
              className="mr-2"
            />
            Hospital Grande (500+ pacientes)
          </label>
        </div>
      </div>

      {/* Opções Avançadas */}
      <button
        onClick={onToggleAdvanced}
        className="text-sm text-primary hover:underline"
      >
        {showAdvanced ? '▼ Ocultar' : '▶ Mostrar'} Opções Avançadas
      </button>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t">
          {/* Taxa de Readmissão */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Taxa de Readmissão Atual (%)
              <span className="text-muted-foreground ml-1">
                (padrão: {DEFAULT_VALUES.taxaReadmissaoAtual}%)
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={
                inputs.taxaReadmissaoAtual || DEFAULT_VALUES.taxaReadmissaoAtual
              }
              onChange={(e) =>
                updateInput(
                  'taxaReadmissaoAtual',
                  parseFloat(e.target.value) ||
                    DEFAULT_VALUES.taxaReadmissaoAtual
                )
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Custo Médio de Consulta */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Custo Médio de Consulta (R$)
              <span className="text-muted-foreground ml-1">
                (padrão: R${' '}
                {DEFAULT_VALUES.custoMedioConsulta.toLocaleString('pt-BR')})
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={
                inputs.custoMedioConsulta || DEFAULT_VALUES.custoMedioConsulta
              }
              onChange={(e) =>
                updateInput(
                  'custoMedioConsulta',
                  parseFloat(e.target.value) ||
                    DEFAULT_VALUES.custoMedioConsulta
                )
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Custo de Readmissão */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Custo Médio de Readmissão (R$)
              <span className="text-muted-foreground ml-1">
                (padrão: R${' '}
                {DEFAULT_VALUES.custoReadmissao.toLocaleString('pt-BR')})
              </span>
            </label>
            <input
              type="number"
              min="0"
              value={inputs.custoReadmissao || DEFAULT_VALUES.custoReadmissao}
              onChange={(e) =>
                updateInput(
                  'custoReadmissao',
                  parseFloat(e.target.value) || DEFAULT_VALUES.custoReadmissao
                )
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>

          {/* Consultas por Mês */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Consultas por Paciente/Mês
              <span className="text-muted-foreground ml-1">
                (padrão: {DEFAULT_VALUES.numConsultasMes})
              </span>
            </label>
            <input
              type="number"
              min="0"
              max="10"
              value={inputs.numConsultasMes || DEFAULT_VALUES.numConsultasMes}
              onChange={(e) =>
                updateInput(
                  'numConsultasMes',
                  parseFloat(e.target.value) || DEFAULT_VALUES.numConsultasMes
                )
              }
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        </div>
      )}
    </div>
  );
}
