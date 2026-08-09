import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openQr(page: Page) {
  await page.goto('/qr');
  await hydrated(page);
}

test('the sample fills in content and a QR code appears', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openQr(page);
  await expect(page.locator('.qr-tool__hint')).toBeVisible();

  await page.getByRole('button', { name: 'Try a sample' }).click();

  await expect(page.locator('.qr-tool__canvas canvas, .qr-tool__canvas svg')).toBeVisible();
  await expect(page.getByLabel('Content')).toHaveValue('https://tooldo.online');

  expect(crashes).toEqual([]);
});

test('typing content shows the code, clearing it returns to the hint', async ({ page }) => {
  await openQr(page);

  await page.getByLabel('Content').fill('https://example.com');
  await expect(page.locator('.qr-tool__canvas canvas, .qr-tool__canvas svg')).toBeVisible();

  await page.getByLabel('Content').fill('');
  await expect(page.locator('.qr-tool__hint')).toBeVisible();
});

test('downloads a PNG named after the content', async ({ page }) => {
  await openQr(page);
  await page.getByLabel('Content').fill('https://tooldo.online');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PNG' }).click();

  expect((await download).suggestedFilename()).toBe('qr-tooldo-online.png');
});

test('adding a logo raises the error correction so the code still renders', async ({ page }) => {
  await openQr(page);
  await page.getByLabel('Content').fill('https://tooldo.online');
  await expect(page.locator('.qr-tool__canvas canvas, .qr-tool__canvas svg')).toBeVisible();

  await page.setInputFiles('.qr-tool input[type="file"]', {
    name: 'logo.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
      'base64',
    ),
  });

  await expect(page.getByRole('img', { name: 'Your logo' })).toBeVisible();
  await expect(page.locator('.qr-tool__canvas canvas, .qr-tool__canvas svg')).toBeVisible();
});
