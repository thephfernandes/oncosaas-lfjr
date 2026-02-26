import { Patient } from '@/lib/api/patients';

/**
 * Ordena pacientes por prioridade (CRITICAL > HIGH > MEDIUM > LOW)
 * Dentro da mesma categoria, ordena por score (maior primeiro)
 * Como último critério, ordena por data de criação (mais recente primeiro)
 */
export function sortPatientsByPriority(patients: Patient[]): Patient[] {
  const priorityOrder = {
    CRITICAL: 0,
    HIGH: 1,
    MEDIUM: 2,
    LOW: 3,
  };

  return [...patients].sort((a, b) => {
    const priorityA = priorityOrder[a.priorityCategory || 'MEDIUM'] ?? 2;
    const priorityB = priorityOrder[b.priorityCategory || 'MEDIUM'] ?? 2;

    // Primeiro critério: categoria de prioridade
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }

    // Segundo critério: score de prioridade (maior primeiro)
    const scoreA = a.priorityScore || 0;
    const scoreB = b.priorityScore || 0;
    if (scoreA !== scoreB) {
      return scoreB - scoreA;
    }

    // Terceiro critério: data de criação (mais recente primeiro)
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return dateB - dateA;
  });
}
