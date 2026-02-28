'use client';

import { useState } from 'react';
import { ROIInputs } from './ROIInputs';
import { ROIResults } from './ROIResults';
import { ROIComparison } from './ROIComparison';

export interface ROIInputData {
  numPacientes: number;
  tipoInstituicao: 'clinica-pequena' | 'hospital-medio' | 'hospital-grande';
  taxaReadmissaoAtual?: number;
  custoMedioConsulta?: number;
  custoReadmissao?: number;
  numConsultasMes?: number;
}

export interface ROIOutputData {
  investimentoMensal: number;
  investimentoAnual: number;
  setupInicial: number;
  economiaReadmissoes: number;
  economiaConsultas: number;
  economiaEficiencia: number;
  economiaDetecaoPrecoce: number;
  economiaTotal: number;
  roi: number;
  paybackPeriod: number;
  economiaPorPaciente: number;
}

const DEFAULT_VALUES = {
  taxaReadmissaoAtual: 15,
  custoMedioConsulta: 300,
  custoReadmissao: 25000,
  numConsultasMes: 2,
};

export function ROICalculator() {
  const [inputs, setInputs] = useState<ROIInputData>({
    numPacientes: 100,
    tipoInstituicao: 'hospital-medio',
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  // Cálculos
  const calcularInvestimento = (): number => {
    const { numPacientes } = inputs;
    if (numPacientes <= 100) {
      return 5000; // Tier 1
    } else if (numPacientes <= 500) {
      return 15000; // Tier 2
    } else {
      return 30000 + (numPacientes - 500) * 30; // Tier 3
    }
  };

  const calcularEconomiaReadmissoes = (): number => {
    const {
      numPacientes,
      taxaReadmissaoAtual = DEFAULT_VALUES.taxaReadmissaoAtual,
      custoReadmissao = DEFAULT_VALUES.custoReadmissao,
    } = inputs;

    const reducao = 0.25; // 25% de redução
    const readmissoesEvitadas =
      (numPacientes * taxaReadmissaoAtual * reducao) / 100;
    return readmissoesEvitadas * custoReadmissao * 12; // anual
  };

  const calcularEconomiaConsultas = (): number => {
    const {
      numPacientes,
      numConsultasMes = DEFAULT_VALUES.numConsultasMes,
      custoMedioConsulta = DEFAULT_VALUES.custoMedioConsulta,
    } = inputs;

    const reducao = 0.4; // 40% de redução
    const consultasEvitadas = numPacientes * numConsultasMes * reducao;
    return consultasEvitadas * custoMedioConsulta * 12; // anual
  };

  const calcularEconomiaEficiencia = (): number => {
    const { numPacientes } = inputs;
    const economiaPorPaciente = 75;
    return numPacientes * economiaPorPaciente;
  };

  const calcularEconomiaDetecaoPrecoce = (): number => {
    const { numPacientes } = inputs;
    const economiaPorPaciente = 150;
    return numPacientes * economiaPorPaciente;
  };

  const calcularResultados = (): ROIOutputData => {
    const investimentoMensal = calcularInvestimento();
    const investimentoAnual = investimentoMensal * 12;
    const setupInicial = 20000;

    const economiaReadmissoes = calcularEconomiaReadmissoes();
    const economiaConsultas = calcularEconomiaConsultas();
    const economiaEficiencia = calcularEconomiaEficiencia();
    const economiaDetecaoPrecoce = calcularEconomiaDetecaoPrecoce();

    const economiaTotal =
      economiaReadmissoes +
      economiaConsultas +
      economiaEficiencia +
      economiaDetecaoPrecoce;

    const economiaMensal = economiaTotal / 12;
    const economiaAposSetup = economiaMensal - investimentoMensal;

    const roi = investimentoAnual > 0 ? economiaTotal / investimentoAnual : 0;
    const paybackPeriod =
      economiaAposSetup > 0 ? setupInicial / economiaAposSetup : Infinity;

    const economiaPorPaciente =
      inputs.numPacientes > 0 ? economiaTotal / inputs.numPacientes : 0;

    return {
      investimentoMensal,
      investimentoAnual,
      setupInicial,
      economiaReadmissoes,
      economiaConsultas,
      economiaEficiencia,
      economiaDetecaoPrecoce,
      economiaTotal,
      roi,
      paybackPeriod: isFinite(paybackPeriod) ? paybackPeriod : 0,
      economiaPorPaciente,
    };
  };

  const results = calcularResultados();

  return (
    <div className="max-w-6xl mx-auto p-8 space-y-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-2">Calculadora de ROI</h1>
        <p className="text-lg text-muted-foreground">
          Calcule a economia e o retorno sobre investimento da plataforma
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Parâmetros</h2>
          <ROIInputs
            inputs={inputs}
            onChange={setInputs}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />
        </div>

        {/* Results */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Resultados Projetados</h2>
          <ROIResults results={results} />
        </div>
      </div>

      {/* Comparison */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Comparativo Antes vs Depois
        </h2>
        <ROIComparison inputs={inputs} results={results} />
      </div>

      {/* Disclaimer */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
        <p className="font-semibold mb-2">⚠️ Importante:</p>
        <p>
          Os valores apresentados são estimativas baseadas em benchmarks da
          indústria. Resultados reais podem variar conforme perfil de pacientes,
          protocolos de tratamento e estrutura organizacional. Recomendamos um
          piloto de 30 dias para validação.
        </p>
      </div>
    </div>
  );
}
