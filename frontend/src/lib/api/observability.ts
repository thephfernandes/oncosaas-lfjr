import { apiClient } from './client';

export interface PipelineSpan {
  name: string;
  duration_ms: number | null;
  data: Record<string, unknown>;
}

export interface LlmCall {
  step: string;
  provider: string;
  model: string;
  duration_ms: number;
  error: string | null;
}

export interface AgentTrace {
  trace_id: string;
  patient_id: string;
  tenant_id: string;
  timestamp: string;
  total_duration_ms: number | null;
  pipeline_path: string;
  intent: string | null;
  intent_confidence: number | null;
  symptoms_detected: number;
  overall_severity: string | null;
  clinical_disposition: string | null;
  clinical_rules_fired: string[];
  actions_generated: string[];
  subagents_called: string[];
  llm_calls: LlmCall[];
  spans: PipelineSpan[];
  error: string | null;
}

export interface ObservabilityStats {
  total_traces: number;
  error_rate_pct: number;
  avg_duration_ms: number;
  p95_duration_ms: number;
  llm_usage_rate_pct: number;
  intent_distribution: Record<string, number>;
  disposition_distribution: Record<string, number>;
  severity_distribution: Record<string, number>;
  pipeline_path_distribution: Record<string, number>;
  avg_span_durations_ms: Record<string, number>;
  avg_llm_duration_ms: number;
  subagent_usage: Record<string, number>;
}

export const observabilityApi = {
  async getTraces(limit = 50): Promise<{ traces: AgentTrace[] }> {
    return apiClient.get<{ traces: AgentTrace[] }>(
      `/agent/observability/traces?limit=${limit}`
    );
  },

  async getStats(): Promise<ObservabilityStats> {
    return apiClient.get<ObservabilityStats>('/agent/observability/stats');
  },

  async clearTraces(): Promise<void> {
    return apiClient.delete('/agent/observability/traces');
  },
};
