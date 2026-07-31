import { defineConfig, devices } from '@playwright/test';
import path from 'path';

const formsBase =
  process.env.E2E_FORMS_URL ||
  process.env.NEXT_PUBLIC_FORMS_URL ||
  'http://localhost:3007';

const publicAppBase =
  process.env.E2E_PUBLIC_APP_URL || 'http://localhost:3006';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  reporter: process.env.CI ? [['github'], ['list']] : [['list']],
  globalSetup: path.join(__dirname, 'e2e/global-setup.ts'),
  use: {
    ...devices['Desktop Chrome'],
    locale: 'ar',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'forms-dashboard',
      testMatch: '**/golden-path.spec.ts',
      use: {
        baseURL: formsBase,
      },
    },
    {
      name: 'public-form',
      testMatch: '**/public-form.spec.ts',
      use: {
        baseURL: publicAppBase,
      },
    },
  ],
});
