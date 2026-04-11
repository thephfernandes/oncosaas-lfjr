import { defineConfig, devices } from '@playwright/test';

/** Porta dedicada ao `next dev` levantado pelo Playwright (evita conflito com 3000/HTTPS). */
const E2E_PORT = process.env.PLAYWRIGHT_WEB_PORT ?? '3330';
const defaultBaseURL = `http://127.0.0.1:${E2E_PORT}`;

/**
 * Configuração do Playwright para testes E2E do OncoNav.
 *
 * Pré-requisitos:
 *   npx playwright install chromium   # instalar browsers
 *   Backend acessível em BACKEND_URL (default http://127.0.0.1:3002) para login real no setup.
 *   Com NEXT_PUBLIC_USE_RELATIVE_API=true o Next faz proxy para BACKEND_URL: use backend em HTTP
 *   (ex.: `USE_HTTPS=false` no Nest). Proxy para HTTPS com certificado autoassinado costuma falhar
 *   no rewrite do Next (DEPTH_ZERO_SELF_SIGNED_CERT), mesmo com NODE_TLS_REJECT_UNAUTHORIZED.
 *
 * Execução:
 *   npx playwright test               # todos os testes E2E
 *   npx playwright test --ui          # modo interativo
 *   npx playwright test e2e/auth.spec.ts  # arquivo específico
 *
 * Porta do servidor de teste: PLAYWRIGHT_WEB_PORT (default 3330). Com Next noutra origem, defina PLAYWRIGHT_BASE_URL igual à URL desse servidor.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // evitar conflito de sessão no mesmo banco de teste
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? defaultBaseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  },

  webServer: {
    command: `npx next dev -H 127.0.0.1 -p ${E2E_PORT}`,
    url: defaultBaseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      ...process.env,
      NEXT_PUBLIC_USE_RELATIVE_API: 'true',
      BACKEND_URL: process.env.BACKEND_URL ?? 'http://127.0.0.1:3002',
    },
  },

  projects: [
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});
