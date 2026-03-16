'use client';

import { useState, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { PatientDetail } from '@/lib/api/patients';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Edit } from 'lucide-react';
import { treatmentsApi, Treatment } from '@/lib/api/treatments';
import { TreatmentDialog } from './treatment-dialog';

interface PatientTreatmentTabProps {
  patient: PatientDetail;
}

const TREATMENT_TYPE_LABELS: Record<string, string> = {
  CHEMOTHERAPY: 'Quimioterapia',
  RADIOTHERAPY: 'Radioterapia',
  SURGERY: 'Cirurgia',
  COMBINED: 'Combinado',
  IMMUNOTHERAPY: 'Imunoterapia',
  TARGETED_THERAPY: 'Terapia-alvo',
  HORMONE_THERAPY: 'Hormonoterapia',
};

const TREATMENT_STATUS_LABELS: Record<string, string> = {
  PLANNED: 'Planejado',
  ONGOING: 'Em Andamento',
  COMPLETED: 'Completo',
  SUSPENDED: 'Suspenso',
  CANCELLED: 'Cancelado',
};

const TREATMENT_INTENT_LABELS: Record<string, string> = {
  CURATIVE: 'Curativo',
  PALLIATIVE: 'Paliativo',
  ADJUVANT: 'Adjuvante',
  NEOADJUVANT: 'Neoadjuvante',
  UNKNOWN: 'Desconhecido',
};

export function PatientTreatmentTab({ patient }: PatientTreatmentTabProps) {
  const [selectedDiagnosisId, setSelectedDiagnosisId] = useState<string | null>(
    null
  );
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Buscar tratamentos para cada diagnóstico
  const diagnoses = useMemo(() => patient.cancerDiagnoses || [], [patient.cancerDiagnoses]);
  const treatmentQueries = useQueries({
    queries: diagnoses.map((diagnosis) => ({
      queryKey: ['treatments', diagnosis.id],
      queryFn: () => treatmentsApi.getTreatmentsByDiagnosis(diagnosis.id),
      enabled: !!diagnosis.id,
    })),
  });

  // Criar um mapa de diagnóstico ID -> tratamentos
  const treatmentsByDiagnosis = useMemo(() => {
    const map = new Map<string, Treatment[]>();
    diagnoses.forEach((diagnosis, index) => {
      const query = treatmentQueries[index];
      if (query.data) {
        map.set(diagnosis.id, query.data);
      }
    });
    return map;
  }, [diagnoses, treatmentQueries]);

  const handleAddTreatment = (diagnosisId: string) => {
    setSelectedDiagnosisId(diagnosisId);
    setSelectedTreatment(null);
    setIsDialogOpen(true);
  };

  const handleEditTreatment = (treatment: Treatment) => {
    setSelectedDiagnosisId(treatment.diagnosisId);
    setSelectedTreatment(treatment);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedTreatment(null);
    setSelectedDiagnosisId(null);
  };

  return (
    <div className="space-y-6">
      {/* Tratamentos por Diagnóstico */}
      {diagnoses.length > 0 ? (
        diagnoses.map((diagnosis, index) => {
          const treatmentsQuery = treatmentQueries[index];
          const treatments = treatmentsByDiagnosis.get(diagnosis.id) || [];

          return (
            <Card key={diagnosis.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    Tratamentos - {diagnosis.cancerType}
                    {diagnosis.isPrimary && (
                      <Badge variant="outline" className="ml-2">
                        Primário
                      </Badge>
                    )}
                  </CardTitle>
                  <Button
                    size="sm"
                    onClick={() => handleAddTreatment(diagnosis.id)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Tratamento
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {treatmentsQuery.isLoading ? (
                  <p className="text-muted-foreground">Carregando...</p>
                ) : treatments.length > 0 ? (
                  <div className="space-y-4">
                    {treatments.map((treatment) => (
                      <div
                        key={treatment.id}
                        className="border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">
                              {treatment.treatmentName ||
                                TREATMENT_TYPE_LABELS[
                                  treatment.treatmentType
                                ] ||
                                treatment.treatmentType}
                            </h4>
                            {treatment.line && (
                              <Badge variant="outline">
                                {treatment.line}ª linha
                              </Badge>
                            )}
                            {treatment.status && (
                              <Badge variant="outline">
                                {TREATMENT_STATUS_LABELS[treatment.status] ||
                                  treatment.status}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTreatment(treatment)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          {treatment.protocol && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Protocolo:
                              </span>
                              <p className="mt-1">{treatment.protocol}</p>
                            </div>
                          )}
                          {treatment.intent && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Intenção:
                              </span>
                              <p className="mt-1">
                                {TREATMENT_INTENT_LABELS[treatment.intent] ||
                                  treatment.intent}
                              </p>
                            </div>
                          )}
                          {treatment.startDate && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Início:
                              </span>
                              <p className="mt-1">
                                {format(
                                  new Date(treatment.startDate),
                                  'dd/MM/yyyy',
                                  {
                                    locale: ptBR,
                                  }
                                )}
                              </p>
                            </div>
                          )}
                          {treatment.plannedEndDate && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Término Previsto:
                              </span>
                              <p className="mt-1">
                                {format(
                                  new Date(treatment.plannedEndDate),
                                  'dd/MM/yyyy',
                                  { locale: ptBR }
                                )}
                              </p>
                            </div>
                          )}
                          {treatment.actualEndDate && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Término Real:
                              </span>
                              <p className="mt-1">
                                {format(
                                  new Date(treatment.actualEndDate),
                                  'dd/MM/yyyy',
                                  { locale: ptBR }
                                )}
                              </p>
                            </div>
                          )}
                          {treatment.cyclesPlanned && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Ciclos Planejados:
                              </span>
                              <p className="mt-1">{treatment.cyclesPlanned}</p>
                            </div>
                          )}
                          {treatment.cyclesCompleted !== null && (
                            <div>
                              <span className="font-medium text-muted-foreground">
                                Ciclos Completados:
                              </span>
                              <p className="mt-1">
                                {treatment.cyclesCompleted}
                              </p>
                            </div>
                          )}
                        </div>

                        {treatment.notes && (
                          <div>
                            <span className="text-sm font-medium text-muted-foreground">
                              Notas:
                            </span>
                            <p className="text-sm mt-1">{treatment.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    Nenhum tratamento registrado para este diagnóstico
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Tratamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nenhum diagnóstico de câncer registrado. Adicione um diagnóstico
              primeiro para registrar tratamentos.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Dialog para criar/editar tratamento */}
      {selectedDiagnosisId && (
        <TreatmentDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          diagnosisId={selectedDiagnosisId}
          treatment={selectedTreatment || undefined}
          patientId={patient.id}
        />
      )}
    </div>
  );
}
