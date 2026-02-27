export const RENAL_PROTOCOL = {
  cancerType: 'renal',
  name: 'Protocolo de Navegação - Câncer Renal',

  journeyStages: {
    SCREENING: {
      steps: [
        {
          key: 'initial_assessment',
          name: 'Avaliação Inicial',
          daysToComplete: 7,
        },
        {
          key: 'renal_ultrasound',
          name: 'Ultrassonografia Renal',
          daysToComplete: 14,
        },
        {
          key: 'urology_referral',
          name: 'Encaminhamento Urologia',
          daysToComplete: 21,
        },
      ],
    },
    DIAGNOSIS: {
      steps: [
        {
          key: 'ct_abdomen',
          name: 'TC Abdome com Contraste',
          daysToComplete: 21,
        },
        {
          key: 'renal_biopsy',
          name: 'Biópsia Renal',
          daysToComplete: 21,
          conditional: 'if indicated',
        },
        {
          key: 'pathology_report',
          name: 'Laudo Anatomopatológico',
          daysToComplete: 21,
          dependsOn: 'renal_biopsy',
        },
        { key: 'chest_ct', name: 'TC de Tórax', daysToComplete: 21 },
        {
          key: 'bone_scan',
          name: 'Cintilografia Óssea',
          daysToComplete: 21,
          conditional: 'if symptomatic',
        },
        {
          key: 'staging_complete',
          name: 'Estadiamento Completo',
          dependsOn: ['ct_abdomen', 'chest_ct'],
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
          key: 'nephrectomy',
          name: 'Nefrectomia (Parcial ou Radical)',
          daysToComplete: 30,
          conditional: 'if surgical candidate',
        },
        {
          key: 'targeted_therapy',
          name: 'Terapia Alvo (TKI)',
          conditional: 'if metastatic',
        },
        {
          key: 'immunotherapy',
          name: 'Imunoterapia',
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
          key: 'follow_up_ct',
          name: 'TC de Seguimento',
          recurring: 'every 6 months for 3 years',
        },
        {
          key: 'follow_up_renal_function',
          name: 'Função Renal',
          recurring: 'every 3 months for 2 years',
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
      keyword: 'hematúria macroscópica',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'dor lombar intensa',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'febre neutropênica',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'hipertensão severa',
      severity: 'HIGH',
      action: 'ALERT_NURSING',
    },
    { keyword: 'proteinúria', severity: 'HIGH', action: 'ALERT_NURSING' },
    {
      keyword: 'fadiga intensa',
      severity: 'MEDIUM',
      action: 'RECORD_AND_MONITOR',
    },
    {
      keyword: 'síndrome mão-pé',
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
