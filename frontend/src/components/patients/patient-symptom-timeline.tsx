'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Activity,
  AlertTriangle,
  FlaskConical,
  ListChecks,
  Calendar,
  FileText,
  Stethoscope,
  StickyNote,
  UserCheck,
  ClipboardList,
  Filter,
} from 'lucide-react';
import {
  usePatientTimeline,
  TimelineEvent,
  TimelineEventType,
} from '@/hooks/use-patient-timeline';
import { cn } from '@/lib/utils';

// ─── Configuração de tipos ──────────────────────────────────────────────────

interface TimelineTypeConfig {
  label: string;
  icon: React.ElementType;
  color: string;
  badgeClass: string;
}

const TYPE_CONFIG: Record<TimelineEventType, TimelineTypeConfig> = {
  symptom: {
    label: 'Sintoma',
    icon: Activity,
    color: 'text-blue-600',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  alert: {
    label: 'Alerta',
    icon: AlertTriangle,
    color: 'text-amber-600',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  exam: {
    label: 'Exame',
    icon: FlaskConical,
    color: 'text-purple-600',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  navigation_step: {
    label: 'Etapa',
    icon: ListChecks,
    color: 'text-teal-600',
    badgeClass: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  consultation: {
    label: 'Consulta',
    icon: Calendar,
    color: 'text-indigo-600',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  diagnosis: {
    label: 'Diagnóstico',
    icon: Stethoscope,
    color: 'text-rose-600',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  treatment: {
    label: 'Tratamento',
    icon: FileText,
    color: 'text-emerald-600',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  note: {
    label: 'Nota',
    icon: StickyNote,
    color: 'text-gray-600',
    badgeClass: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  intervention: {
    label: 'Intervenção',
    icon: UserCheck,
    color: 'text-orange-600',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  questionnaire: {
    label: 'Questionário',
    icon: ClipboardList,
    color: 'text-cyan-600',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
};

// ─── Filtros ────────────────────────────────────────────────────────────────

type FilterKey = 'all' | 'clinical' | TimelineEventType;

const FILTER_OPTIONS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'symptom', label: 'Sintomas' },
  { key: 'alert', label: 'Alertas' },
  { key: 'exam', label: 'Exames' },
  { key: 'navigation_step', label: 'Etapas' },
  { key: 'consultation', label: 'Consultas' },
  { key: 'clinical', label: 'Dados clínicos' },
  { key: 'questionnaire', label: 'Questionários' },
];

const CLINICAL_TYPES: TimelineEventType[] = [
  'diagnosis',
  'treatment',
  'note',
  'intervention',
];

// ─── Renderização de itens ──────────────────────────────────────────────────

const ESAS_ITEM_LABELS: Record<string, string> = {
  pain: 'Dor',
  fatigue: 'Cansaço',
  nausea: 'Náusea',
  depression: 'Humor/Depressão',
  anxiety: 'Ansiedade',
  drowsiness: 'Sonolência',
  appetite: 'Apetite',
  wellbeing: 'Bem-estar',
  dyspnea: 'Falta de ar',
};

const PRO_CTCAE_ITEM_LABELS: Record<string, string> = {
  pain: 'Dor',
  fatigue: 'Cansaço',
  nausea: 'Náusea',
  diarrhea: 'Diarreia',
  constipation: 'Constipação',
  sleep: 'Dificuldade para dormir',
  neuropathy: 'Formigamento/Dormência',
  appetite: 'Apetite',
};

const SEVERITY_MAP: Record<string, string> = {
  CRITICAL: 'Crítico',
  HIGH: 'Alta',
  MEDIUM: 'Média',
  LOW: 'Baixa',
};

const ALERT_SEVERITY_CLASS: Record<string, string> = {
  CRITICAL: 'bg-red-100 text-red-800 border-red-300',
  HIGH: 'bg-amber-100 text-amber-800 border-amber-300',
  MEDIUM: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  LOW: 'bg-gray-100 text-gray-800 border-gray-300',
};

const STEP_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluída',
  OVERDUE: 'Atrasada',
  CANCELLED: 'Cancelada',
  NOT_APPLICABLE: 'N/A',
};

const TREATMENT_INTENT_LABELS: Record<string, string> = {
  CURATIVE: 'Curativo',
  PALLIATIVE: 'Paliativo',
  ADJUVANT: 'Adjuvante',
  NEOADJUVANT: 'Neoadjuvante',
};

const INTERVENTION_TYPE_LABELS: Record<string, string> = {
  ASSUME: 'Assumiu caso',
  RESPONSE: 'Resposta',
  ALERT_RESOLVED: 'Alerta resolvido',
  NOTE_ADDED: 'Nota adicionada',
  PRIORITY_UPDATED: 'Prioridade atualizada',
};

function TimelineItemContent({ event }: { event: TimelineEvent }) {
  const { type, payload } = event;

  switch (type) {
    case 'symptom': {
      const value =
        payload.valueString ??
        (payload.valueQuantity != null ? String(payload.valueQuantity) : null);
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{payload.display}</span>
          {value && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {value}
              {payload.unit ? ` ${payload.unit}` : ''}
            </Badge>
          )}
        </div>
      );
    }
    case 'alert':
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{payload.message}</span>
          <Badge
            variant="outline"
            className={cn(
              'shrink-0 text-xs',
              ALERT_SEVERITY_CLASS[payload.severity] ?? ''
            )}
          >
            {SEVERITY_MAP[payload.severity] ?? payload.severity}
          </Badge>
          {payload.status && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {payload.status}
            </Badge>
          )}
        </div>
      );
    case 'exam':
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{payload.examName}</span>
          {payload.valueNumeric != null && (
            <Badge
              variant="outline"
              className={cn(
                'shrink-0 text-xs',
                payload.isAbnormal && 'bg-amber-100 text-amber-800 border-amber-300'
              )}
            >
              {payload.valueNumeric}
              {payload.unit ? ` ${payload.unit}` : ''}
              {payload.isAbnormal ? ' (fora ref.)' : ''}
            </Badge>
          )}
          {payload.valueNumeric == null && payload.valueText && (
            <span className="text-sm text-muted-foreground truncate">
              {payload.valueText}
            </span>
          )}
        </div>
      );
    case 'navigation_step':
    case 'consultation':
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{payload.stepName}</span>
          <Badge variant="outline" className="shrink-0 text-xs">
            {STEP_STATUS_LABELS[payload.status] ?? payload.status}
          </Badge>
          {payload.professionalName && (
            <span className="text-xs text-muted-foreground truncate">
              {payload.professionalName}
            </span>
          )}
        </div>
      );
    case 'diagnosis':
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">{payload.cancerType}</span>
          {payload.stage && (
            <Badge variant="outline" className="shrink-0 text-xs">
              {payload.stage}
            </Badge>
          )}
          {payload.isPrimary && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              Primário
            </Badge>
          )}
          {payload.diagnosisConfirmed && (
            <Badge
              variant="outline"
              className="shrink-0 text-xs bg-green-100 text-green-800 border-green-300"
            >
              Confirmado
            </Badge>
          )}
        </div>
      );
    case 'treatment': {
      const isEnd = payload.subEvent === 'end';
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium truncate">
            {payload.treatmentName ?? payload.treatmentType}
          </span>
          <Badge variant="outline" className="shrink-0 text-xs">
            {isEnd ? 'Término' : 'Início'}
          </Badge>
          {payload.protocol && (
            <span className="text-xs text-muted-foreground truncate">
              {payload.protocol}
            </span>
          )}
          {payload.intent && (
            <Badge variant="secondary" className="shrink-0 text-xs">
              {TREATMENT_INTENT_LABELS[payload.intent] ?? payload.intent}
            </Badge>
          )}
          {payload.currentCycle != null && payload.totalCycles != null && (
            <span className="text-xs text-muted-foreground">
              Ciclo {payload.currentCycle}/{payload.totalCycles}
            </span>
          )}
        </div>
      );
    }
    case 'note':
      return (
        <div className="min-w-0">
          <p className="text-sm truncate">{payload.content}</p>
        </div>
      );
    case 'intervention':
      return (
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-medium">
            {INTERVENTION_TYPE_LABELS[payload.interventionType] ??
              payload.interventionType}
          </span>
          {payload.notes && (
            <span className="text-sm text-muted-foreground truncate">
              {payload.notes}
            </span>
          )}
        </div>
      );
    case 'questionnaire': {
      const q = payload.questionnaire;
      const scores = payload.scores;
      const code = q?.code ?? '';
      const name = q?.name ?? code;
      const isESAS = code === 'ESAS';
      const labels = isESAS ? ESAS_ITEM_LABELS : PRO_CTCAE_ITEM_LABELS;
      const highThreshold = isESAS ? 7 : 3;
      const itemsObj: Record<string, number> = scores?.items ?? {};
      const alerts: Array<{
        item: string;
        score?: number;
        grade?: number;
        severity: string;
      }> = scores?.alerts ?? [];
      const interpretation: string | undefined = scores?.interpretation;

      return (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-medium">{name}</span>
            {isESAS && scores?.total != null && (
              <Badge variant="secondary" className="text-xs">
                {scores.total}/90
              </Badge>
            )}
          </div>
          {Object.keys(itemsObj).length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(itemsObj).map(([key, val]) => {
                const label = labels[key] ?? key;
                const isHigh = typeof val === 'number' && val >= highThreshold;
                return (
                  <Badge
                    key={key}
                    variant={isHigh ? 'destructive' : 'outline'}
                    className={cn(
                      'text-xs font-normal',
                      isHigh && 'bg-amber-100 text-amber-900 border-amber-300'
                    )}
                  >
                    {label}: {val}
                  </Badge>
                );
              })}
            </div>
          )}
          {alerts.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {alerts.map((a, i) => (
                <Badge
                  key={i}
                  variant="destructive"
                  className="text-xs bg-red-100 text-red-800 border-red-300"
                >
                  {labels[a.item] ?? a.item}{' '}
                  {a.score != null
                    ? `(${a.score})`
                    : a.grade != null
                      ? `(grau ${a.grade})`
                      : ''}{' '}
                  – {a.severity}
                </Badge>
              ))}
            </div>
          )}
          {interpretation && (
            <p className="text-muted-foreground text-xs">{interpretation}</p>
          )}
        </div>
      );
    }
    default:
      return (
        <span className="text-sm text-muted-foreground">
          {JSON.stringify(payload)}
        </span>
      );
  }
}

// ─── Componente principal ───────────────────────────────────────────────────

interface PatientSymptomTimelineProps {
  patientId: string;
}

/**
 * Timeline unificada do paciente.
 * Mantém o export PatientSymptomTimeline para compatibilidade.
 */
export function PatientSymptomTimeline({
  patientId,
}: PatientSymptomTimelineProps): React.ReactElement {
  const { timeline, isLoading, error } = usePatientTimeline(patientId);
  const [filter, setFilter] = useState<FilterKey>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return timeline;
    if (filter === 'clinical') {
      return timeline.filter((e) =>
        CLINICAL_TYPES.includes(e.type)
      );
    }
    return timeline.filter((e) => e.type === filter);
  }, [timeline, filter]);

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <p className="text-sm text-destructive">
            Erro ao carregar linha do tempo. Tente novamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linha do tempo do paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
        <CardTitle>Linha do tempo do paciente</CardTitle>
        <div className="flex items-center gap-1 flex-wrap">
          <Filter
            className="h-4 w-4 text-muted-foreground shrink-0"
            aria-hidden
          />
          <div className="flex gap-1 flex-wrap" role="group" aria-label="Filtros da timeline">
            {FILTER_OPTIONS.map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? 'default' : 'ghost'}
                size="sm"
                className="h-7 text-xs"
                onClick={() => setFilter(key)}
                aria-pressed={filter === key}
              >
                {label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nenhum evento registrado nesta timeline.
          </p>
        ) : (
          <ul className="space-y-0" aria-label="Eventos da timeline do paciente">
            {filtered.map((event, index) => {
              const config = TYPE_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <li
                  key={`${event.type}-${event.payload.id ?? index}-${event.date}`}
                  className="flex gap-3 py-2.5 border-b border-border/50 last:border-0"
                >
                  {/* Coluna de ícone + linha */}
                  <div className="flex flex-col items-center pt-0.5">
                    <div
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-full border',
                        config.badgeClass
                      )}
                      aria-hidden
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(event.date), 'dd/MM/yyyy HH:mm', {
                          locale: ptBR,
                        })}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn('text-xs shrink-0', config.badgeClass)}
                      >
                        {config.label}
                      </Badge>
                    </div>
                    <TimelineItemContent event={event} />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
