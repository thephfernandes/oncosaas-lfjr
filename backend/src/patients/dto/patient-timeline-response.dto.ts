export type PatientTimelineEventType =
  | 'symptom'
  | 'alert'
  | 'exam'
  | 'navigation_step'
  | 'consultation'
  | 'diagnosis'
  | 'treatment'
  | 'note'
  | 'intervention'
  | 'questionnaire';

export interface PatientTimelineEvent {
  type: PatientTimelineEventType;
  date: string;
  payload: Record<string, unknown>;
}

export interface PatientTimelineResponse {
  data: PatientTimelineEvent[];
  total: number;
  limit: number;
  offset: number;
}
