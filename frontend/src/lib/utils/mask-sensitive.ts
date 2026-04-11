/** Mascara CPF para exibição (LGPD / shoulder surfing). */
export function maskCpf(cpf: string | null | undefined): string {
  if (!cpf || typeof cpf !== 'string') {
    return '—';
  }
  const digits = cpf.replace(/\D/g, '');
  if (digits.length !== 11) {
    return '***';
  }
  return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

/** Mascara telefone brasileiro para exibição. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone || typeof phone !== 'string') {
    return '—';
  }
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 8) {
    return '***';
  }
  return `*** ****-${digits.slice(-4)}`;
}
