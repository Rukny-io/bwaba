import type { BrowserContext, Page } from '@playwright/test';
import type { E2eFixtures } from './fixtures';

const formsBaseUrl =
  process.env.E2E_FORMS_URL || process.env.NEXT_PUBLIC_FORMS_URL || 'http://localhost:3007';

export function getFormsBaseUrl(): string {
  return formsBaseUrl.replace(/\/$/, '');
}

export function getPublicAppBaseUrl(): string {
  return (process.env.E2E_PUBLIC_APP_URL || 'http://localhost:3006').replace(
    /\/$/,
    '',
  );
}

export async function authenticateFormsDashboard(
  context: BrowserContext,
  fixtures: Pick<E2eFixtures, 'accessToken' | 'accessCookieName'>,
) {
  const base = new URL(getFormsBaseUrl());
  await context.addCookies([
    {
      name: fixtures.accessCookieName,
      value: fixtures.accessToken,
      domain: base.hostname,
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
    },
  ]);
}

export async function gotoFormsApp(page: Page, path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  await page.goto(`${getFormsBaseUrl()}${normalized}`);
}

export async function gotoPublicForm(page: Page, slug: string) {
  await page.goto(`${getPublicAppBaseUrl()}/f/${slug}`);
}
