import {
  hasUnsafeApiPathSegments,
  isUnsafeApiPathSegment,
} from '../assert-safe-api-path';

describe('assert-safe-api-path (proxy BFF)', () => {
  it('aceita segmentos normais', () => {
    expect(hasUnsafeApiPathSegments(['auth', 'login'])).toBe(false);
    expect(hasUnsafeApiPathSegments(undefined)).toBe(false);
    expect(hasUnsafeApiPathSegments([])).toBe(false);
  });

  it('rejeita traversal e segmentos vazios', () => {
    expect(isUnsafeApiPathSegment('..')).toBe(true);
    expect(isUnsafeApiPathSegment('.')).toBe(true);
    expect(isUnsafeApiPathSegment('')).toBe(true);
    expect(hasUnsafeApiPathSegments(['auth', '..'])).toBe(true);
  });
});
