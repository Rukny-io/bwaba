import { expect, test } from '@playwright/test';
import {
  authenticateFormsDashboard,
  getFormsBaseUrl,
  getPublicAppBaseUrl,
  gotoFormsApp,
  gotoPublicForm,
} from './auth';
import { E2E_SKIP_REASON, loadE2eFixtures } from './fixtures';

const fixtures = loadE2eFixtures();

test.describe('Golden path — dashboard', () => {
  test.skip(!fixtures, E2E_SKIP_REASON);

  test.beforeEach(async ({ context }) => {
    await authenticateFormsDashboard(context, fixtures!);
  });

  test('login → create form → add field → publish', async ({ page }) => {
    const title = `E2E Golden ${Date.now()}`;

    await gotoFormsApp(page, '/app/forms');
    await expect(page.getByRole('heading', { name: 'نماذجي' })).toBeVisible();

    await page.getByRole('link', { name: 'إنشاء نموذج' }).click();
    await page.waitForURL(/\/forms\/n\/[^/]+\/creating/, { timeout: 30_000 });

    await page.getByPlaceholder('عنوان النموذج').fill(title);

    const insertField = page.getByRole('textbox', { name: 'إدراج حقل جديد' });
    await insertField.click();
    await insertField.fill('/');
    await page.getByRole('button', { name: 'نص قصير' }).click();

    await expect(page.getByRole('button', { name: 'نشر' })).toBeEnabled({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'نشر' }).click();

    await page.waitForURL(/\/app\/forms\/[^/]+$/, { timeout: 30_000 });
    await expect(page.getByRole('heading', { name: title })).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByRole('link', { name: 'افتح المحرّر' })).toBeVisible();
  });
});

test.describe('Golden path — submission roundtrip', () => {
  test.skip(!fixtures, E2E_SKIP_REASON);

  test('public submit appears in dashboard submissions', async ({
    page,
    context,
  }) => {
    const { slug, formId } = fixtures!;
    const answer = `مستجيب E2E ${Date.now()}`;

    await gotoPublicForm(page, slug);
    await expect(page.getByRole('heading', { name: fixtures!.title })).toBeVisible();

    const textInput = page.locator('input[type="text"], input:not([type])').first();
    await textInput.fill(answer);
    await page.getByRole('button', { name: 'إرسال' }).click();
    await expect(page.getByRole('heading', { name: 'شكراً لمشاركتك' })).toBeVisible({
      timeout: 15_000,
    });

    await authenticateFormsDashboard(context, fixtures!);
    await gotoFormsApp(page, `/app/forms/${formId}/submissions`);
    await expect(page.getByText('لا توجد استجابات بعد')).not.toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(answer)).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Golden path — smoke URLs', () => {
  test.skip(!fixtures, E2E_SKIP_REASON);

  test('forms and public apps respond', async ({ request }) => {
    const formsHealth = await request.get(`${getFormsBaseUrl()}/login`);
    expect(formsHealth.ok()).toBeTruthy();

    const publicHealth = await request.get(`${getPublicAppBaseUrl()}/f/${fixtures!.slug}`);
    expect(publicHealth.ok()).toBeTruthy();
  });
});
