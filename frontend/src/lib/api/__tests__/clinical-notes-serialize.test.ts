import { describe, expect, it } from 'vitest';
import {
  cloneClinicalNoteSections,
  serializeClinicalNoteSections,
} from '../clinical-notes';

describe('serializeClinicalNoteSections', () => {
  it('usa ordem fixa de chaves (comparação estável para autosave)', () => {
    const a = serializeClinicalNoteSections({ planos: 'x', hda: 'y' });
    const b = serializeClinicalNoteSections({ hda: 'y', planos: 'x' });
    expect(a).toBe(b);
  });
});

describe('cloneClinicalNoteSections', () => {
  it('preenche todas as chaves do protocolo', () => {
    const c = cloneClinicalNoteSections({ hda: 'texto' });
    expect(c.hda).toBe('texto');
    expect(c.planos).toBe('');
  });
});
