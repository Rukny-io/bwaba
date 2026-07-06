import { expect, test } from '@playwright/test';
import { gotoPublicForm } from './auth';
import { E2E_SKIP_REASON, loadE2eFixtures } from './fixtures';

const fixtures = loadE2eFixtures();

test.describe('Public form UI', () => {
  test.skip(!fixtures, E2E_SKIP_REASON);

  test('respondent can fill and submit published form', async ({ page }) => {
    const { title } = fixtures!;

    await gotoPublicForm(page, fixtures!.slug);
    await expect(page.getByRole('heading', { name: title })).toBeVisible();

    const textInput = page.locator('input[type="text"], input:not([type])').first();
    await textInput.fill('مستجيب E2E');

    await page.getByRole('button', { name: 'إرسال' }).click();

    await expect(page.getByRole('heading', { name: 'شكراً لمشاركتك' })).toBeVisible({
      timeout: 15_000,
    });
  });
});
