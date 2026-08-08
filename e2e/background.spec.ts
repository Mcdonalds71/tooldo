import { expect, test } from '@playwright/test';
import { hydrated } from './support';

test('the sample loses its background and downloads as a transparent PNG', async ({ page }) => {
  // The one thing that makes this spec different from every other tool's smoke test:
  // the first run downloads a real model from Hugging Face and runs it, rather than
  // everything else in the suite, which is fully self-contained. Everything else about
  // the shape — load, try the sample, assert a real download — is the same.
  test.setTimeout(180_000);

  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await page.goto('/background');
  await hydrated(page);

  await page.getByRole('button', { name: 'No photo handy? Try a sample' }).click();
  await expect(page.getByRole('list', { name: 'Photos to process' })).toBeVisible();

  await page.getByRole('button', { name: /Remove \d+ background/ }).click();
  await expect(page.locator('.background-tool__stat')).toBeVisible({ timeout: 150_000 });

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: /^Download / }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-sample.png');
  expect(crashes).toEqual([]);
});

test('a queued photo can be taken back out before running', async ({ page }) => {
  await page.goto('/background');
  await hydrated(page);

  await page.getByRole('button', { name: 'No photo handy? Try a sample' }).click();
  await expect(page.locator('[aria-label="Photos to process"] li')).toHaveCount(1);

  await page.getByRole('button', { name: 'Remove tooldo-sample.png' }).click();
  await expect(page.locator('[aria-label="Photos to process"] li')).toHaveCount(0);
});

test('a model that will not download blames the connection, not the photo', async ({ page }) => {
  // Routed on the context, not the page: the model is fetched from inside a Worker, and
  // page-level interception doesn't reach it. Blocking the host is also what makes this
  // the one spec here that needs no network at all — the failure is the assertion.
  await page.context().route('**huggingface.co/**', (route) => route.abort());

  await page.goto('/background');
  await hydrated(page);

  await page.getByRole('button', { name: 'No photo handy? Try a sample' }).click();
  await expect(page.getByRole('list', { name: 'Photos to process' })).toBeVisible();

  await page.getByRole('button', { name: /Remove \d+ background/ }).click();

  const failure = page.getByRole('alert');
  await expect(failure).toContainText('check your connection', { timeout: 60_000 });
  // The photo is not the thing to change, so the copy must not send anyone chasing it.
  await expect(failure).not.toContainText('a different photo');
});

test('a file that is not a photo says so', async ({ page }) => {
  await page.goto('/background');
  await hydrated(page);

  await page.locator('.dropzone__input').setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('just some text'),
  });

  await expect(page.locator('.toast__title')).toContainText("notes.txt isn't");
});
