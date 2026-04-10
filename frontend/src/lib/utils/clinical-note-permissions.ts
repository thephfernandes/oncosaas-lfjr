/**
 * Regras alinhadas a `ClinicalNotesService` no backend (criação/edição/anulação).
 */

/** Compara IDs de usuário (UUID) de forma estável entre cliente e API */
export function sameUserId(
  a: string | undefined | null,
  b: string | undefined | null
): boolean {
  if (a == null || b == null || a === '' || b === '') return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

export type ClinicalNoteType = 'NURSING' | 'MEDICAL';
export type ClinicalNoteStatus = 'DRAFT' | 'SIGNED' | 'VOIDED';

/** Criar nota, assinar rascunho ou criar adendo do mesmo tipo */
export function canCreateClinicalNoteType(
  role: string | undefined,
  clinicalSubrole: string | null | undefined,
  noteType: ClinicalNoteType
): boolean {
  if (!role) return false;
  if (noteType === 'NURSING') {
    return (
      role === 'NURSE' ||
      role === 'NURSE_CHIEF' ||
      (role === 'COORDINATOR' && clinicalSubrole === 'NURSING') ||
      (role === 'ADMIN' && clinicalSubrole === 'NURSING')
    );
  }
  return (
    role === 'DOCTOR' ||
    role === 'ONCOLOGIST' ||
    (role === 'COORDINATOR' && clinicalSubrole === 'MEDICAL') ||
    (role === 'ADMIN' && clinicalSubrole === 'MEDICAL')
  );
}

/** Editar rascunho de terceiros (autor sempre pode) */
export function canEditDraftClinicalNote(
  role: string | undefined,
  clinicalSubrole: string | null | undefined,
  noteType: ClinicalNoteType,
  currentUserId: string | undefined,
  createdById: string
): boolean {
  if (!currentUserId) return false;
  if (sameUserId(currentUserId, createdById)) return true;
  if (noteType === 'NURSING' && role === 'NURSE_CHIEF') return true;
  if (noteType === 'MEDICAL' && role === 'ONCOLOGIST') return true;
  return canCreateClinicalNoteType(role, clinicalSubrole, noteType);
}

export function canVoidClinicalNote(
  role: string | undefined,
  clinicalSubrole: string | null | undefined,
  noteType: ClinicalNoteType,
  status: ClinicalNoteStatus,
  currentUserId: string | undefined,
  createdById: string
): boolean {
  if (status === 'VOIDED') return false;
  if (status === 'DRAFT') {
    return canEditDraftClinicalNote(
      role,
      clinicalSubrole,
      noteType,
      currentUserId,
      createdById
    );
  }
  if (noteType === 'NURSING') {
    return (
      role === 'NURSE_CHIEF' ||
      (role === 'COORDINATOR' && clinicalSubrole === 'NURSING') ||
      (role === 'ADMIN' && clinicalSubrole === 'NURSING')
    );
  }
  return (
    role === 'ONCOLOGIST' ||
    role === 'DOCTOR' ||
    (role === 'COORDINATOR' && clinicalSubrole === 'MEDICAL') ||
    (role === 'ADMIN' && clinicalSubrole === 'MEDICAL')
  );
}
