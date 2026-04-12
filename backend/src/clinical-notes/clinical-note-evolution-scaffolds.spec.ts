import {
  ClinicalNoteType,
  JourneyStage,
  NavigationStepStatus,
} from '@generated/prisma/client';
import {
  baseNavigationStepKey,
  buildEvolutionSectionScaffolds,
  cancerTypeLabelPt,
} from './clinical-note-evolution-scaffolds';

describe('clinical-note-evolution-scaffolds', () => {
  it('baseNavigationStepKey removes numeric suffix', () => {
    expect(baseNavigationStepKey('intravesical_bcg')).toBe('intravesical_bcg');
    expect(baseNavigationStepKey('intravesical_bcg-2')).toBe('intravesical_bcg');
  });

  it('cancerTypeLabelPt maps known types', () => {
    expect(cancerTypeLabelPt('bladder')).toContain('bexiga');
    expect(cancerTypeLabelPt('unknown_x')).toBe('unknown_x');
  });

  it('buildEvolutionSectionScaffolds adds MEDICAL narrative templates', () => {
    const { sections, examesComplementaresAppend } =
      buildEvolutionSectionScaffolds({
        cancerType: 'bladder',
        currentStage: JourneyStage.TREATMENT,
        noteType: ClinicalNoteType.MEDICAL,
        navigationSteps: [
          {
            id: 's1',
            stepKey: 'cystoscopy',
            stepName: 'Cistoscopia',
            status: NavigationStepStatus.PENDING,
            journeyStage: JourneyStage.TREATMENT,
            stepOrder: 1,
            notes: null,
            dueDate: null,
          },
        ],
        focusNavigationStepId: 's1',
      });
    expect(sections.hda).toContain('História da doença atual');
    expect(sections.navegacao).toContain('Cistoscopia');
    expect(sections.navegacao).toContain('Foco clínico desta etapa');
    expect(examesComplementaresAppend).toContain('Sugestões de registro');
  });

  it('buildEvolutionSectionScaffolds uses NURSING templates', () => {
    const { sections } = buildEvolutionSectionScaffolds({
      cancerType: 'breast',
      currentStage: JourneyStage.DIAGNOSIS,
      noteType: ClinicalNoteType.NURSING,
      navigationSteps: [],
      focusNavigationStepId: null,
    });
    expect(sections.hda).toContain('História de enfermagem');
    expect(sections.conduta).toContain('Conduta de enfermagem');
  });
});
