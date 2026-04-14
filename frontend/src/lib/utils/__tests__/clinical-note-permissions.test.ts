import {
  canCreateClinicalNoteType,
  canEditDraftClinicalNote,
  canVoidClinicalNote,
  sameUserId,
} from '../clinical-note-permissions';

describe('sameUserId', () => {
  it('ignora diferença de maiúsculas em UUID', () => {
    expect(
      sameUserId(
        '550e8400-e29b-41d4-a716-446655440000',
        '550E8400-E29B-41D4-A716-446655440000'
      )
    ).toBe(true);
  });
});

describe('canCreateClinicalNoteType', () => {
  it('permite enfermagem para NURSE e NURSE_CHIEF', () => {
    expect(canCreateClinicalNoteType('NURSE', null, 'NURSING')).toBe(true);
    expect(canCreateClinicalNoteType('NURSE_CHIEF', null, 'NURSING')).toBe(true);
  });

  it('permite enfermagem para COORDINATOR/ADMIN apenas com subpapel NURSING', () => {
    expect(
      canCreateClinicalNoteType('COORDINATOR', 'NURSING', 'NURSING')
    ).toBe(true);
    expect(
      canCreateClinicalNoteType('COORDINATOR', 'MEDICAL', 'NURSING')
    ).toBe(false);
    expect(canCreateClinicalNoteType('ADMIN', 'NURSING', 'NURSING')).toBe(
      true
    );
    expect(canCreateClinicalNoteType('ADMIN', 'MEDICAL', 'NURSING')).toBe(
      false
    );
  });

  it('permite médica para DOCTOR/ONCOLOGIST e COORDINATOR/ADMIN com MEDICAL', () => {
    expect(canCreateClinicalNoteType('DOCTOR', null, 'MEDICAL')).toBe(true);
    expect(canCreateClinicalNoteType('ONCOLOGIST', null, 'MEDICAL')).toBe(
      true
    );
    expect(
      canCreateClinicalNoteType('COORDINATOR', 'MEDICAL', 'MEDICAL')
    ).toBe(true);
    expect(canCreateClinicalNoteType('ADMIN', 'MEDICAL', 'MEDICAL')).toBe(
      true
    );
    expect(
      canCreateClinicalNoteType('COORDINATOR', 'NURSING', 'MEDICAL')
    ).toBe(false);
  });
});

describe('canEditDraftClinicalNote', () => {
  it('autor sempre pode editar próprio rascunho', () => {
    expect(
      canEditDraftClinicalNote('NURSE', null, 'NURSING', 'u1', 'u1')
    ).toBe(true);
  });

  it('NURSE_CHIEF pode editar rascunho de enfermagem de outro', () => {
    expect(
      canEditDraftClinicalNote('NURSE_CHIEF', null, 'NURSING', 'u1', 'u2')
    ).toBe(true);
  });
});

describe('canVoidClinicalNote', () => {
  it('rascunho: mesma regra de edição', () => {
    expect(
      canVoidClinicalNote('NURSE', null, 'NURSING', 'DRAFT', 'u1', 'u1')
    ).toBe(true);
  });

  it('assinada enfermagem: chefe / coord nursing / admin nursing', () => {
    expect(
      canVoidClinicalNote('NURSE_CHIEF', null, 'NURSING', 'SIGNED', 'a', 'b')
    ).toBe(true);
    expect(
      canVoidClinicalNote(
        'COORDINATOR',
        'NURSING',
        'NURSING',
        'SIGNED',
        'a',
        'b'
      )
    ).toBe(true);
    expect(
      canVoidClinicalNote('NURSE', null, 'NURSING', 'SIGNED', 'a', 'b')
    ).toBe(false);
  });
});
