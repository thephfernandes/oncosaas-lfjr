import { apiClient } from './client';

export type InterventionType =
  | 'ASSUME'
  | 'RESPONSE'
  | 'ALERT_RESOLVED'
  | 'NOTE_ADDED'
  | 'PRIORITY_UPDATED';

export interface Intervention {
  id: string;
  tenantId: string;
  patientId: string;
  userId: string;
  messageId?: string;
  type: InterventionType;
  notes?: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  patient: {
    id: string;
    name: string;
  };
  message?: {
    id: string;
    content: string;
    direction: string;
    createdAt: string;
  };
}

export interface CreateInterventionDto {
  patientId: string;
  type: InterventionType;
  messageId?: string;
  notes?: string;
}

export const interventionsApi = {
  async getMyInterventions(): Promise<Intervention[]> {
    const response = await apiClient.get<Intervention[]>('/interventions/me');
    return response;
  },

  async getByPatient(patientId: string): Promise<Intervention[]> {
    const response = await apiClient.get<Intervention[]>(
      `/interventions/patient/${patientId}`
    );
    return response;
  },

  async getById(id: string): Promise<Intervention> {
    const response = await apiClient.get<Intervention>(`/interventions/${id}`);
    return response;
  },

  async create(data: CreateInterventionDto): Promise<Intervention> {
    const response = await apiClient.post<Intervention>('/interventions', data);
    return response;
  },
};
