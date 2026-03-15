export type TimelineEventType =
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

export interface TimelineEvent {
  type: TimelineEventType;
  date: string;
  payload: Record<string, any>;
}

export interface TimelineQueryDto {
  limit?: number;
  offset?: number;
  types?: TimelineEventType[];
}

export interface TimelineResponse {
  data: TimelineEvent[];
  total: number;
  limit: number;
  offset: number;
}
