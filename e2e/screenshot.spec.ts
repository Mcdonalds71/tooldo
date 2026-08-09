import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openScreenshot(page: Page) {
  await page.goto('/screenshot');
  await hydrated(page);
}

test('the sample loads and renders a styled preview', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openScreenshot(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const preview = page.getByRole('img', { name: 'Styled preview of your screenshot' });
  await expect(preview).toBeVisible();
  await expect(preview).toHaveAttribute('src', /^blob:/);

  expect(crashes).toEqual([]);
});

test('changing an option re-renders the preview', async ({ page }) => {
  await openScreenshot(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const preview = page.getByRole('img', { name: 'Styled preview of your screenshot' });
  await expect(preview).toBeVisible();
  const before = await preview.getAttribute('src');

  await page.getByLabel('Background').selectOption('ink');

  await expect(preview).not.toHaveAttribute('src', before ?? '');
});

test('toggling the browser frame re-renders the preview', async ({ page }) => {
  await openScreenshot(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const preview = page.getByRole('img', { name: 'Styled preview of your screenshot' });
  await expect(preview).toBeVisible();
  const before = await preview.getAttribute('src');

  await page.getByLabel('Browser frame').click();

  await expect(preview).not.toHaveAttribute('src', before ?? '');
});

test('downloads a PNG named after the source file', async ({ page }) => {
  await openScreenshot(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  await expect(page.getByRole('img', { name: 'Styled preview of your screenshot' })).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();

  expect((await download).suggestedFilename()).toBe('sample-dashboard-beautified.png');
});

test('starting over returns to the dropzone', async ({ page }) => {
  await openScreenshot(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await expect(page.getByRole('img', { name: 'Styled preview of your screenshot' })).toBeVisible();

  await page.getByRole('button', { name: 'Start over' }).click();

  await expect(page.getByRole('button', { name: 'Try a sample' })).toBeVisible();
});
