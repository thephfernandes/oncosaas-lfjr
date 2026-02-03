import { apiClient } from './client';
import { getApiUrl } from '@/lib/utils/api-config';

export interface CancerDiagnosis {
  id: string;
  tenantId: string;
  patientId: string;
  cancerType: string;
  icd10Code: string | null;
  // Estadiamento TNM Estruturado
  stage: string | null;
  tStage: string | null;
  nStage: string | null;
  mStage: string | null;
  grade: string | null;
  stagingDate: string | null;
  // Tipo Histológico
  histologicalType: string | null;
  // Diagnóstico
  diagnosisDate: string;
  diagnosisConfirmed: boolean;
  pathologyReport: string | null;
  confirmedBy: string | null;
  // Biomarcadores - Câncer de Mama
  her2Status: string | null;
  erStatus: string | null;
  prStatus: string | null;
  ki67Percentage: number | null;
  // Biomarcadores - Câncer de Pulmão/Colorretal
  egfrMutation: string | null;
  alkRearrangement: string | null;
  ros1Rearrangement: string | null;
  brafMutation: string | null;
  krasMutation: string | null;
  nrasMutation: string | null;
  pdl1Expression: number | null;
  msiStatus: string | null;
  // Biomarcadores - Câncer de Próstata
  psaBaseline: number | null;
  gleasonScore: string | null;
  // Marcadores Tumorais
  ceaBaseline: number | null;
  ca199Baseline: number | null;
  ca125Baseline: number | null;
  ca153Baseline: number | null;
  afpBaseline: number | null;
  hcgBaseline: number | null;
  // Status
  isPrimary: boolean;
  isActive: boolean;
  resolvedDate: string | null;
  resolutionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientJourney {
  id: string;
  tenantId: string;
  patientId: string;
  screeningDate: string | null;
  screeningResult: string | null;
  diagnosisDate: string | null;
  diagnosisConfirmed: boolean;
  pathologyReport: string | null;
  stagingDate: string | null;
  treatmentStartDate: string | null;
  treatmentType: string | null;
  treatmentProtocol: string | null;
  currentCycle: number | null;
  totalCycles: number | null;
  lastFollowUpDate: string | null;
  nextFollowUpDate: string | null;
  currentStep: string | null;
  nextStep: string | null;
  blockers: string[];
  updatedAt: string;
}

export interface Comorbidity {
  name: string;
  severity: string;
  controlled: boolean;
}

export interface FamilyHistory {
  relationship: string;
  cancerType: string;
  ageAtDiagnosis?: number;
}

export interface Patient {
  id: string;
  tenantId: string;
  name: string;
  cpf: string | null;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email: string | null;
  cancerType: string | null; // Pode ser null para pacientes em rastreio
  stage: string | null;
  diagnosisDate: string | null;
  performanceStatus: number | null;
  // Comorbidades e Fatores de Risco
  comorbidities: Comorbidity[] | null;
  smokingHistory: string | null;
  alcoholHistory: string | null;
  occupationalExposure: string | null;
  familyHistory: FamilyHistory[] | null;
  currentStage: string; // SCREENING, NAVIGATION, DIAGNOSIS, TREATMENT, FOLLOW_UP
  currentSpecialty: string | null;
  priorityScore: number;
  priorityCategory: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  priorityReason: string | null;
  priorityUpdatedAt: string | null;
  ehrPatientId: string | null;
  lastSyncAt: string | null;
  status: string;
  lastInteraction: string | null;
  createdAt: string;
  updatedAt: string;
  journey?: PatientJourney | null; // Jornada do paciente (rastreio, diagnóstico, tratamento)
  cancerDiagnoses?: CancerDiagnosis[]; // Múltiplos diagnósticos de câncer
  _count?: {
    messages: number;
    alerts: number;
    observations: number;
  };
}

export interface CreatePatientDto {
  name: string;
  cpf?: string;
  birthDate: string;
  gender: 'male' | 'female' | 'other';
  phone: string;
  email?: string;
  cancerType: string;
  stage: string;
  diagnosisDate?: string;
  performanceStatus?: string;
  currentStage: string;
  currentSpecialty?: string;
}

export interface UpdatePatientDto extends Partial<CreatePatientDto> {}

export interface NavigationStep {
  id: string;
  tenantId: string;
  patientId: string;
  journeyId: string | null;
  cancerType: string;
  journeyStage: string;
  stepKey: string;
  stepName: string;
  stepDescription: string | null;
  status:
    | 'PENDING'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'OVERDUE'
    | 'CANCELLED'
    | 'NOT_APPLICABLE';
  isRequired: boolean;
  isCompleted: boolean;
  completedAt: string | null;
  completedBy: string | null;
  expectedDate: string | null;
  dueDate: string | null;
  actualDate: string | null;
  institutionName: string | null;
  professionalName: string | null;
  result: string | null;
  findings: any;
  metadata: any;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PatientDetail extends Patient {
  journey: PatientJourney | null;
  cancerDiagnoses: CancerDiagnosis[];
  navigationSteps: NavigationStep[];
  alerts: Array<{
    id: string;
    type: string;
    severity: string;
    status: string;
    message: string;
    createdAt: string;
  }>;
  _count?: {
    messages: number;
    alerts: number;
    observations: number;
  };
}

export interface ImportCsvResult {
  message: string;
  success: number;
  errors: Array<{ row: number; errors: string[] }>;
  created: Patient[];
}

export const patientsApi = {
  async getAll(): Promise<Patient[]> {
    return apiClient.get<Patient[]>('/patients');
  },

  async getById(id: string): Promise<Patient> {
    return apiClient.get<Patient>(`/patients/${id}`);
  },

  async getDetail(id: string): Promise<PatientDetail> {
    const response = await apiClient.get<{ data: PatientDetail }>(
      `/patients/${id}/detail`
    );
    return response.data;
  },

  async create(data: CreatePatientDto): Promise<Patient> {
    return apiClient.post<Patient>('/patients', data);
  },

  async update(id: string, data: UpdatePatientDto): Promise<Patient> {
    return apiClient.patch<Patient>(`/patients/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/patients/${id}`);
  },

  async importCsv(file: File): Promise<ImportCsvResult> {
    const formData = new FormData();
    formData.append('file', file);

    const API_URL = getApiUrl();
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    const tenantId =
      typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null;

    const axios = (await import('axios')).default;
    const response = await axios.post<ImportCsvResult>(
      `${API_URL}/api/v1/patients/import`,
      formData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Tenant-Id': tenantId || '',
        },
      }
    );

    return response.data;
  },

  // Cancer Diagnosis APIs
  async getCancerDiagnoses(patientId: string): Promise<CancerDiagnosis[]> {
    const response = await apiClient.get<{ data: CancerDiagnosis[] }>(
      `/patients/${patientId}/cancer-diagnoses`
    );
    return response.data;
  },

  async createCancerDiagnosis(
    patientId: string,
    data: any // CancerDiagnosisFormData
  ): Promise<CancerDiagnosis> {
    const response = await apiClient.post<{ data: CancerDiagnosis }>(
      `/patients/${patientId}/cancer-diagnoses`,
      data
    );
    return response.data;
  },

  async updateCancerDiagnosis(
    patientId: string,
    diagnosisId: string,
    data: any // CancerDiagnosisFormData
  ): Promise<CancerDiagnosis> {
    const response = await apiClient.patch<{ data: CancerDiagnosis }>(
      `/patients/${patientId}/cancer-diagnoses/${diagnosisId}`,
      data
    );
    return response.data;
  },
};
