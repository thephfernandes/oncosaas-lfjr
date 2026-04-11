import { describe, expect, it } from 'vitest';
import { buildSafeApiFileHref } from '../safe-api-url';

describe('buildSafeApiFileHref', () => {
  it('combina base e path relativo', () => {
    expect(buildSafeApiFileHref('http://localhost:3002', '/uploads/x.pdf')).toBe(
      'http://localhost:3002/uploads/x.pdf'
    );
  });

  it('normaliza path sem barra inicial', () => {
    expect(buildSafeApiFileHref('http://localhost:3002/', 'uploads/x.pdf')).toBe(
      'http://localhost:3002/uploads/x.pdf'
    );
  });

  it('remove barras finais da base', () => {
    expect(buildSafeApiFileHref('http://localhost:3002///', '/a')).toBe(
      'http://localhost:3002/a'
    );
  });

  it('rejeita protocol-relative, esquemas e javascript:', () => {
    expect(buildSafeApiFileHref('http://localhost:3002', '//evil.com/x')).toBeNull();
    expect(buildSafeApiFileHref('http://localhost:3002', 'https://evil.com/x')).toBeNull();
    expect(buildSafeApiFileHref('http://localhost:3002', 'javascript:alert(1)')).toBeNull();
    expect(buildSafeApiFileHref('http://localhost:3002', '/x:y')).toBeNull();
  });

  it('rejeita path traversal', () => {
    expect(buildSafeApiFileHref('http://localhost:3002', '/../etc/passwd')).toBeNull();
  });
});
