import { describe, expect, it } from '@jest/globals';
import { validateSync } from 'class-validator';
import { IsOptional, IsString } from 'class-validator';
import { IsPlainText } from './is-plain-text.decorator';

class SampleDto {
  @IsString()
  @IsOptional()
  @IsPlainText()
  value?: string;
}

describe('IsPlainText', () => {
  it('aceita texto normal', () => {
    const dto = new SampleDto();
    dto.value = 'Observação: paciente está bem. <3';
    const errors = validateSync(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejeita tags HTML típicas', () => {
    const dto = new SampleDto();
    dto.value = '<img src=x onerror=alert(1)>';
    const errors = validateSync(dto);
    expect(errors).not.toHaveLength(0);
  });

  it('rejeita fechamento de tag', () => {
    const dto = new SampleDto();
    dto.value = '</script>';
    const errors = validateSync(dto);
    expect(errors).not.toHaveLength(0);
  });
});

