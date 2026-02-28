import { apiClient } from './client';

export interface InternalNote {
  id: string;
  tenantId: string;
  patientId: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  patient: {
    id: string;
    name: string;
  };
}

export interface CreateInternalNoteDto {
  patientId: string;
  content: string;
}

export interface UpdateInternalNoteDto {
  content?: string;
}

export const internalNotesApi = {
  async getAll(patientId?: string): Promise<InternalNote[]> {
    const params = patientId ? { patientId } : {};
    const response = await apiClient.get<InternalNote[]>('/internal-notes', {
      params,
    });
    return response;
  },

  async getById(id: string): Promise<InternalNote> {
    const response = await apiClient.get<InternalNote>(`/internal-notes/${id}`);
    return response;
  },

  async create(data: CreateInternalNoteDto): Promise<InternalNote> {
    const response = await apiClient.post<InternalNote>(
      '/internal-notes',
      data
    );
    return response;
  },

  async update(id: string, data: UpdateInternalNoteDto): Promise<InternalNote> {
    const response = await apiClient.patch<InternalNote>(
      `/internal-notes/${id}`,
      data
    );
    return response;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/internal-notes/${id}`);
  },
};
