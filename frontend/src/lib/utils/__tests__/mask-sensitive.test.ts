import { describe, expect, it } from 'vitest';
import { maskCpf, maskPhone } from '../mask-sensitive';

describe('maskCpf', () => {
  it('mascara CPF com 11 dígitos', () => {
    expect(maskCpf('123.456.789-01')).toBe('***.***.789-01');
  });

  it('retorna placeholder para vazio ou inválido', () => {
    expect(maskCpf('')).toBe('—');
    expect(maskCpf('123')).toBe('***');
  });
});

describe('maskPhone', () => {
  it('mostra últimos 4 dígitos', () => {
    expect(maskPhone('+55 27 99999-1234')).toBe('*** ****-1234');
  });
});
