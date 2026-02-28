import { apiClient } from './client';

export interface Observation {
  id: string;
  tenantId: string;
  patientId: string;
  messageId: string | null;
  code: string; // LOINC code
  display: string;
  valueQuantity: number | null;
  valueString: string | null;
  unit: string | null;
  effectiveDateTime: string;
  status: 'preliminary' | 'final' | 'amended' | 'corrected';
  fhirResourceId: string | null;
  syncedToEHR: boolean;
  syncedAt: string | null;
  createdAt: string;
  patient?: {
    id: string;
    name: string;
  };
}

export interface CreateObservationDto {
  patientId: string;
  messageId?: string;
  code: string;
  display: string;
  valueQuantity?: number;
  valueString?: string;
  unit?: string;
  effectiveDateTime: string;
  status: 'preliminary' | 'final' | 'amended' | 'corrected';
}

export interface UpdateObservationDto extends Partial<CreateObservationDto> {}

export const observationsApi = {
  async getAll(patientId?: string, code?: string): Promise<Observation[]> {
    const params = new URLSearchParams();
    if (patientId) params.append('patientId', patientId);
    if (code) params.append('code', code);
    const query = params.toString();
    return apiClient.get<Observation[]>(
      `/observations${query ? `?${query}` : ''}`
    );
  },

  async getById(id: string): Promise<Observation> {
    return apiClient.get<Observation>(`/observations/${id}`);
  },

  async create(data: CreateObservationDto): Promise<Observation> {
    return apiClient.post<Observation>('/observations', data);
  },

  async update(id: string, data: UpdateObservationDto): Promise<Observation> {
    return apiClient.patch<Observation>(`/observations/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/observations/${id}`);
  },

  async getUnsynced(): Promise<Observation[]> {
    return apiClient.get<Observation[]>('/observations/unsynced');
  },

  async markAsSynced(id: string, fhirResourceId: string): Promise<Observation> {
    return apiClient.patch<Observation>(`/observations/${id}/sync`, {
      fhirResourceId,
    });
  },
};
