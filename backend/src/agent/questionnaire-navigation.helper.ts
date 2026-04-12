import { PrismaService } from '../prisma/prisma.service';
import { CLINICAL_NOTE_NAVIGATION_STEP_KEY } from '../clinical-notes/clinical-notes.constants';

/**
 * Para questionários aplicados pelo agente (canal WhatsApp), associa à etapa
 * universal "consulta de navegação oncológica" na fase atual da jornada;
 * se não existir nessa fase, usa qualquer etapa com a mesma chave do paciente.
 */
export async function resolveNavigationStepIdForAgentQuestionnaire(
  prisma: PrismaService,
  tenantId: string,
  patientId: string
): Promise<string | undefined> {
  const patient = await prisma.patient.findFirst({
    where: { id: patientId, tenantId },
    select: { currentStage: true },
  });
  if (!patient) {
    return undefined;
  }

  const stepKey = CLINICAL_NOTE_NAVIGATION_STEP_KEY.NURSING;

  const inStage = await prisma.navigationStep.findFirst({
    where: {
      tenantId,
      patientId,
      stepKey,
      journeyStage: patient.currentStage,
    },
    orderBy: { stepOrder: 'asc' },
    select: { id: true },
  });
  if (inStage) {
    return inStage.id;
  }

  const anyNav = await prisma.navigationStep.findFirst({
    where: {
      tenantId,
      patientId,
      stepKey,
    },
    orderBy: { updatedAt: 'desc' },
    select: { id: true },
  });
  return anyNav?.id;
}
