type NextResponseInit = {
  status?: number;
  statusText?: string;
  headers?: HeadersInit;
};

/**
 * Mock mínimo de `next/server` para testes Vitest.
 *
 * Motivo: importar `next/server` em ambiente Vitest/jsdom pode tentar carregar
 * configuração interna do Next e quebrar a suíte.
 */
export class NextResponse {
  headers: Headers;
  status: number;
  statusText: string;
  body?: BodyInit | null;

  constructor(body?: BodyInit | null, init?: NextResponseInit) {
    this.body = body ?? null;
    this.status = init?.status ?? 200;
    this.statusText = init?.statusText ?? '';
    this.headers = new Headers(init?.headers);
  }

  static next(): NextResponse {
    return new NextResponse(null, { status: 200 });
  }

  static redirect(url: URL | string, status = 307): NextResponse {
    const res = new NextResponse(null, { status });
    res.headers.set('location', typeof url === 'string' ? url : url.toString());
    return res;
  }

  static json(body: unknown, init?: NextResponseInit): NextResponse {
    const res = new NextResponse(JSON.stringify(body), {
      ...init,
      headers: {
        'content-type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
    return res;
  }
}

export class NextRequest {
  url: string;
  headers: Headers;
  nextUrl: URL;
  cookies: {
    get: (name: string) => { value: string } | undefined;
  };

  constructor(url: string, init?: { headers?: HeadersInit }) {
    this.url = url;
    this.headers = new Headers(init?.headers);
    this.nextUrl = new URL(url);

    this.cookies = {
      get: (name: string) => {
        const cookieHeader = this.headers.get('cookie') ?? '';
        const cookies = cookieHeader
          .split(';')
          .map((c) => c.trim())
          .filter(Boolean);
        for (const c of cookies) {
          const idx = c.indexOf('=');
          if (idx === -1) continue;
          const k = c.slice(0, idx).trim();
          const v = c.slice(idx + 1);
          if (k === name) return { value: v };
        }
        return undefined;
      },
    };
  }
}

