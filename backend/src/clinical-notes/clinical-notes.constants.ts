/** Chaves estáveis das seções do prontuário (V1) — ordem de exibição no frontend */
export const CLINICAL_NOTE_SECTION_KEYS = [
  'identificacao',
  'hda',
  'hpp',
  'comorbidades',
  'medicacoesEmUso',
  'alergias',
  'subjetivo',
  'exameFisico',
  'examesComplementares',
  'analise',
  'conduta',
  'tratamentos',
  'navegacao',
  'planos',
] as const;

export type ClinicalNoteSectionKey = (typeof CLINICAL_NOTE_SECTION_KEYS)[number];

/** Limite por campo (caracteres) para evitar payloads abusivos */
export const CLINICAL_NOTE_SECTION_MAX_LENGTH = 32_000;

/**
 * Chave da etapa de navegação universal correspondente a cada tipo de evolução.
 * Alinhado a `mergeUniversalStepConfigs` em oncology-navigation.service.ts.
 */
export const CLINICAL_NOTE_NAVIGATION_STEP_KEY = {
  MEDICAL: 'specialist_consultation',
  NURSING: 'navigation_consultation',
} as const;
