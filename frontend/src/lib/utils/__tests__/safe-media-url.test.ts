import { buildSafeMediaSrc } from '../safe-media-url';

describe('buildSafeMediaSrc', () => {
  it('aceita http/https', () => {
    expect(buildSafeMediaSrc('https://cdn.example.com/a.mp3')).toBe(
      'https://cdn.example.com/a.mp3'
    );
    expect(buildSafeMediaSrc('http://localhost:3002/uploads/a.mp3')).toBe(
      'http://localhost:3002/uploads/a.mp3'
    );
  });

  it('aceita path relativo seguro', () => {
    expect(buildSafeMediaSrc('/uploads/a.mp3')).toBe('/uploads/a.mp3');
  });

  it('aceita blob:', () => {
    expect(buildSafeMediaSrc('blob:https://app.local/uuid')).toBe(
      'blob:https://app.local/uuid'
    );
  });

  it('rejeita protocol-relative e esquemas perigosos', () => {
    expect(buildSafeMediaSrc('//evil.com/a.mp3')).toBeNull();
    expect(buildSafeMediaSrc('javascript:alert(1)')).toBeNull();
    expect(buildSafeMediaSrc('data:text/html,<svg onload=alert(1)>')).toBeNull();
    expect(buildSafeMediaSrc('file:///etc/passwd')).toBeNull();
  });

  it('rejeita strings inválidas', () => {
    expect(buildSafeMediaSrc('   ')).toBeNull();
    expect(buildSafeMediaSrc('not a url')).toBeNull();
  });
});

