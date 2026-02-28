import * as crypto from 'crypto';

/**
 * Normaliza número de telefone para formato internacional brasileiro
 * Remove caracteres não numéricos e garante formato: 55XXXXXXXXXXX
 *
 * @param phone Número de telefone em qualquer formato
 * @returns Número normalizado (ex: "5511999999999")
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required');
  }

  // Remover caracteres não numéricos
  let normalized = phone.replace(/\D/g, '');

  // Se não começa com código do país, adicionar 55 (Brasil)
  if (!normalized.startsWith('55')) {
    normalized = '55' + normalized;
  }

  // Se começa com 0 após código do país, remover
  if (normalized.startsWith('550')) {
    normalized = '55' + normalized.substring(2);
  }

  // Validar tamanho mínimo (código país + DDD + número)
  if (normalized.length < 12) {
    throw new Error(`Invalid phone number format: ${phone}`);
  }

  return normalized;
}

/**
 * Gera hash SHA-256 do telefone normalizado para busca eficiente
 *
 * @param phone Número de telefone normalizado
 * @returns Hash hexadecimal do telefone
 */
export function hashPhoneNumber(phone: string): string {
  const normalized = normalizePhoneNumber(phone);
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Valida formato de telefone brasileiro
 *
 * @param phone Número de telefone
 * @returns true se válido, false caso contrário
 */
export function isValidPhoneNumber(phone: string): boolean {
  try {
    const normalized = normalizePhoneNumber(phone);
    // Formato brasileiro: 55 + DDD (2 dígitos) + número (8-9 dígitos)
    // Total: 12-13 dígitos
    return normalized.length >= 12 && normalized.length <= 13;
  } catch {
    return false;
  }
}
