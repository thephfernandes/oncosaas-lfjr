import { middleware } from './middleware';

function buildRequest(pathname: string, cookie?: string) {
  const url = `https://onconav.local${pathname}`;
  const headers = new Headers(cookie ? { cookie } : {});

  const request = {
    url,
    headers,
    nextUrl: new URL(url),
  };

  return request as unknown as Parameters<typeof middleware>[0];
}

describe('middleware auth gating (probe no backend)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Garantir que `fetch` e outros globals stubados não vazem entre testes.
    vi.unstubAllGlobals?.();
  });

  it('allows public password recovery routes without session cookie', async () => {
    const forgotResponse = await middleware(buildRequest('/forgot-password'));
    const resetResponse = await middleware(buildRequest('/reset-password/token-123'));

    expect(forgotResponse.headers.get('location')).toBeNull();
    expect(resetResponse.headers.get('location')).toBeNull();
  });

  it('redirects unauthenticated access to protected pages and preserves intent', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })));
    const response = await middleware(buildRequest('/dashboard'));
    const location = response.headers.get('location');

    expect(location).toContain('/login');
    expect(location).toContain('redirect=%2Fdashboard');
  });

  it('permite rota protegida quando o backend retorna 200 no probe (cookie presente)', async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ id: 'u1' }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    const response = await middleware(
      buildRequest('/dashboard', 'access_token=token')
    );
    expect(response.headers.get('location')).toBeNull();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [calledUrl, init] = fetchMock.mock.calls[0] as unknown as [URL, RequestInit];
    expect(String(calledUrl)).toBe('https://onconav.local/api/v1/auth/profile');
    expect(init?.method).toBe('GET');
    expect((init?.headers as Record<string, string>)?.cookie).toContain('access_token=token');
  });

  it('redireciona rota protegida quando o backend retorna 401 no probe', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 401 })));
    const response = await middleware(buildRequest('/dashboard', 'access_token=token'));
    const location = response.headers.get('location');

    expect(location).toContain('/login');
  });

  it('redireciona rota protegida quando o probe falha (erro/timeout)', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('network');
    }));
    const response = await middleware(buildRequest('/dashboard', 'access_token=token'));
    const location = response.headers.get('location');

    expect(location).toContain('/login');
  });
});
