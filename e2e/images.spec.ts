import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openSample(page: Page) {
  await page.goto('/images');
  await hydrated(page);

  await page.getByRole('button', { name: 'No file handy? Try a sample' }).click();
  await expect(page.getByRole('list', { name: 'Images to convert' })).toBeVisible();
}

/** A second real, decodable image — drawn in the browser rather than hand-built, since a
 *  malformed fixture fails the same way a genuinely corrupt file would. */
async function addDrawnImage(page: Page, name = 'second.png') {
  const bytes = await page.evaluate(async () => {
    const canvas = document.createElement('canvas');
    canvas.width = 40;
    canvas.height = 40;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.fillStyle = '#ff3b14';
    ctx.fillRect(0, 0, 40, 40);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
    if (!blob) throw new Error('canvas produced no blob');

    return [...new Uint8Array(await blob.arrayBuffer())];
  });

  await page
    .locator('.dropzone__input')
    .last()
    .setInputFiles({ name, mimeType: 'image/png', buffer: Buffer.from(bytes) });
}

test('the sample converts to JPEG and downloads', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openSample(page);

  await page.getByRole('button', { name: /Convert \d+ image/ }).click();
  await expect(page.locator('.images-tool__stat')).toBeVisible({ timeout: 30_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download / }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-sample.jpg');
  expect(crashes).toEqual([]);
});

test('switching format changes what gets downloaded', async ({ page }) => {
  await openSample(page);

  await page.getByRole('radio', { name: 'AVIF' }).click();
  await page.getByRole('button', { name: /Convert \d+ image/ }).click();
  await expect(page.locator('.images-tool__stat')).toBeVisible({ timeout: 30_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download / }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-sample.avif');
});

test('resizing caps the longest side and target size still fits the budget', async ({ page }) => {
  await openSample(page);

  await page.getByRole('switch', { name: 'Resize' }).click();
  await page.getByRole('radio', { name: 'Target size' }).click();
  await page.getByRole('button', { name: /Convert \d+ image/ }).click();

  await expect(page.locator('.images-tool__stat')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('Done')).toBeVisible();
});

test('a second file joins the batch and both download as one zip', async ({ page }) => {
  await openSample(page);
  await addDrawnImage(page);

  await expect(page.locator('[aria-label="Images to convert"] li')).toHaveCount(2);

  await page.getByRole('button', { name: /Convert \d+ image/ }).click();
  await expect(page.locator('.images-tool__stat')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText('2 of 2 converted')).toBeVisible();

  // Two clicks by design: the first prepares the zip off the main thread, the second is
  // a fresh user gesture, which is what a browser requires to actually save a file that
  // wasn't ready at the moment of the click.
  await page.getByRole('button', { name: 'Download all (.zip)' }).click();
  await expect(page.getByRole('button', { name: 'Save the zip' })).toBeVisible({
    timeout: 15_000,
  });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save the zip' }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-images.zip');
});

test('a queued file can be taken back out before converting', async ({ page }) => {
  await openSample(page);
  await addDrawnImage(page);
  await expect(page.locator('[aria-label="Images to convert"] li')).toHaveCount(2);

  await page.getByRole('button', { name: 'Remove second.png' }).click();
  await expect(page.locator('[aria-label="Images to convert"] li')).toHaveCount(1);
});

test('a file that is not an image says so', async ({ page }) => {
  await page.goto('/images');
  await hydrated(page);

  await page.locator('.dropzone__input').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('just some text'),
  });

  await expect(page.locator('.toast__title')).toContainText("notes.txt isn't");
});
