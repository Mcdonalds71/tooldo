import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openVideo(page: Page) {
  await page.goto('/video');
  await hydrated(page);
}

async function trySample(page: Page) {
  await page.getByRole('button', { name: 'No file handy? Try a sample' }).click();
  await expect(page.getByRole('list', { name: 'Video to compress' })).toBeVisible({
    timeout: 30_000,
  });
}

test('the sample compresses to MP4 and downloads', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openVideo(page);
  await trySample(page);

  await page.getByRole('button', { name: 'Compress video' }).click();
  await expect(page.getByRole('heading', { name: 'Your video is ready' })).toBeVisible({
    timeout: 30_000,
  });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-sample-compressed.mp4');
  expect(crashes).toEqual([]);
});

test('switching to GIF converts and downloads a .gif', async ({ page }) => {
  await openVideo(page);
  await trySample(page);

  await page.getByRole('radio', { name: 'GIF' }).click();
  await page.getByRole('button', { name: 'Convert to GIF' }).click();
  await expect(page.getByRole('heading', { name: 'Your GIF is ready' })).toBeVisible({
    timeout: 30_000,
  });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-sample.gif');
});

test('a file that is not a video says so', async ({ page }) => {
  await openVideo(page);

  await page.locator('.dropzone__input').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('just some text'),
  });

  await expect(page.locator('.toast__title')).toContainText("notes.txt isn't");
});
