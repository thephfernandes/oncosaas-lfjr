export const PROSTATE_PROTOCOL = {
  cancerType: 'prostate',
  name: 'Protocolo de Navegação - Câncer de Próstata',

  journeyStages: {
    SCREENING: {
      steps: [
        {
          key: 'initial_assessment',
          name: 'Avaliação Inicial',
          daysToComplete: 7,
        },
        {
          key: 'psa_test',
          name: 'PSA Sérico',
          daysToComplete: 7,
        },
        {
          key: 'digital_rectal_exam',
          name: 'Toque Retal',
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
          key: 'multiparametric_mri',
          name: 'Ressonância Magnética Multiparamétrica',
          daysToComplete: 30,
        },
        {
          key: 'prostate_biopsy',
          name: 'Biópsia de Próstata',
          daysToComplete: 21,
          dependsOn: 'multiparametric_mri',
        },
        {
          key: 'pathology_report',
          name: 'Laudo Anatomopatológico (Gleason)',
          daysToComplete: 21,
          dependsOn: 'prostate_biopsy',
        },
        {
          key: 'bone_scan',
          name: 'Cintilografia Óssea',
          daysToComplete: 21,
          conditional: 'if PSA > 20 or Gleason >= 8',
        },
        {
          key: 'staging_ct',
          name: 'TC Abdome/Pelve',
          daysToComplete: 21,
          conditional: 'if locally advanced',
        },
        {
          key: 'staging_complete',
          name: 'Estadiamento Completo',
          dependsOn: ['pathology_report'],
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
          key: 'active_surveillance',
          name: 'Vigilância Ativa',
          conditional: 'if low risk (Gleason 6)',
        },
        {
          key: 'radical_prostatectomy',
          name: 'Prostatectomia Radical',
          daysToComplete: 30,
          conditional: 'if surgical candidate',
        },
        {
          key: 'radiotherapy',
          name: 'Radioterapia',
          conditional: 'if indicated',
        },
        {
          key: 'hormone_therapy',
          name: 'Hormonioterapia (ADT)',
          conditional: 'if indicated',
        },
        {
          key: 'chemotherapy',
          name: 'Quimioterapia',
          conditional: 'if metastatic castration-resistant',
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
          key: 'follow_up_psa',
          name: 'PSA de Seguimento',
          recurring: 'every 3 months for 2 years, then every 6 months',
        },
        {
          key: 'follow_up_testosterone',
          name: 'Testosterona (se em ADT)',
          recurring: 'every 6 months',
        },
        {
          key: 'bone_density',
          name: 'Densitometria Óssea (se em ADT)',
          recurring: 'annually',
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
      keyword: 'retenção urinária aguda',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'compressão medular',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'febre neutropênica',
      severity: 'CRITICAL',
      action: 'ESCALATE_IMMEDIATELY',
    },
    {
      keyword: 'hematúria intensa',
      severity: 'HIGH',
      action: 'ALERT_NURSING',
    },
    {
      keyword: 'dor óssea intensa',
      severity: 'HIGH',
      action: 'ALERT_NURSING',
    },
    {
      keyword: 'incontinência urinária',
      severity: 'MEDIUM',
      action: 'RECORD_AND_MONITOR',
    },
    {
      keyword: 'disfunção erétil',
      severity: 'MEDIUM',
      action: 'RECORD_AND_MONITOR',
    },
    {
      keyword: 'fogachos',
      severity: 'LOW',
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
