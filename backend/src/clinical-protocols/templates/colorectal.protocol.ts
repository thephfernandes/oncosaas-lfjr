export const COLORECTAL_PROTOCOL = {
  cancerType: 'colorectal',
  name: 'Protocolo de Navegação - Câncer Colorretal',

  journeyStages: {
    SCREENING: {
      steps: [
        {
          key: 'initial_assessment',
          name: 'Avaliação Inicial',
          daysToComplete: 7,
        },
        {
          key: 'fecal_occult_blood',
          name: 'Pesquisa de Sangue Oculto',
          daysToComplete: 14,
        },
        {
          key: 'colonoscopy_referral',
          name: 'Encaminhamento Colonoscopia',
          daysToComplete: 30,
        },
      ],
    },
    DIAGNOSIS: {
      steps: [
        { key: 'colonoscopy', name: 'Colonoscopia', daysToComplete: 30 },
        {
          key: 'biopsy',
          name: 'Biópsia',
          daysToComplete: 14,
          dependsOn: 'colonoscopy',
        },
        {
          key: 'pathology_report',
          name: 'Laudo Anatomopatológico',
          daysToComplete: 21,
          dependsOn: 'biopsy',
        },
        { key: 'staging_ct', name: 'TC de Estadiamento', daysToComplete: 21 },
        { key: 'cea_baseline', name: 'CEA Basal', daysToComplete: 7 },
        {
          key: 'staging_complete',
          name: 'Estadiamento Completo',
          dependsOn: ['pathology_report', 'staging_ct', 'cea_baseline'],
        },
      ],
    },
    TREATMENT: {
      steps: [
        {
          key: 'mdt_discussion',
          name: 'Discussão Multidisciplinar',
          daysToComplete: 14,
        },
        {
          key: 'treatment_plan',
          name: 'Plano de Tratamento',
          daysToComplete: 7,
          dependsOn: 'mdt_discussion',
        },
        {
          key: 'surgery',
          name: 'Cirurgia',
          daysToComplete: 30,
          conditional: 'if surgical candidate',
        },
        {
          key: 'chemotherapy',
          name: 'Quimioterapia',
          conditional: 'if indicated',
        },
        {
          key: 'radiotherapy',
          name: 'Radioterapia',
          conditional: 'if indicated',
        },
      ],
    },
    FOLLOW_UP: {
      steps: [
        {
          key: 'post_surgery_review',
          name: 'Revisão Pós-Cirúrgica',
          daysAfterTreatmentStart: 30,
        },
        {
          key: 'follow_up_cea',
          name: 'CEA de Seguimento',
          recurring: 'every 3 months for 2 years',
        },
        {
          key: 'follow_up_ct',
          name: 'TC de Seguimento',
          recurring: 'every 6 months for 2 years',
        },
        {
          key: 'follow_up_colonoscopy',
          name: 'Colonoscopia de Seguimento',
          recurring: 'at 1 year',
        },
      ],
    },
  },

  checkInRules: {
    SCREENING: { frequency: 'weekly', questionnaire: null },
    DIAGNOSIS: { frequency: 'twice_weekly', questionnaire: null },
    TREATMENT: { frequency: 'daily', questionnaire: 'ESAS' },
    FOLLOW_UP: { frequency: 'weekly', questionnaire: 'PRO_CTCAE' },
  },

  criticalSymptoms: [
    {
      keyword: 'sangramento retal',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'obstrução intestinal',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'febre neutropênica',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    { keyword: 'diarreia severa', severity: 'HIGH', action: 'ALERT_NURSING' },
    { keyword: 'mucosite', severity: 'HIGH', action: 'ALERT_NURSING' },
    {
      keyword: 'neuropatia',
      severity: 'MEDIUM',
      action: 'RECORD_AND_MONITOR',
    },
  ],

  riskAdjustment: {
    increaseFrequency: [
      { condition: 'priorityCategory === "CRITICAL"', multiplier: 2 },
      { condition: 'lastSymptomSeverity >= 7', multiplier: 1.5 },
      { condition: 'missedCheckIns >= 2', multiplier: 1.5 },
    ],
  },
};
