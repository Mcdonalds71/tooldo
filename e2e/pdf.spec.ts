import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

const SAMPLE_PAGES = 6;

async function openSample(page: Page) {
  await page.goto('/pdf');
  await hydrated(page);

  await page.getByRole('button', { name: 'No file handy? Try a sample' }).click();
  await expect(page.getByRole('list', { name: 'Pages in your document' })).toBeVisible();
  await expect(page.locator('.page-card')).toHaveCount(SAMPLE_PAGES);
}

/** Object URLs are per page, so they identify a card wherever it has moved to. */
function previewSources(page: Page): Promise<string[]> {
  return page
    .locator('.page-card__preview')
    .evaluateAll((images) => images.map((image) => (image as HTMLImageElement).src));
}

test('the sample runs the whole flow and hands back a PDF', async ({ page }) => {
  // Two workers and a canvas run in here, and a throw in any of them leaves the UI
  // sitting on a spinner rather than failing loudly.
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openSample(page);

  await page.getByRole('button', { name: 'Save PDF' }).click();
  await expect(page.getByRole('heading', { name: 'Your PDF is ready' })).toBeVisible();
  await expect(page.getByText(`${SAMPLE_PAGES} pages`)).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();

  expect((await download).suggestedFilename()).toBe('tooldo-sample-edited.pdf');
  expect(crashes).toEqual([]);
});

test('every page gets a preview and can be turned', async ({ page }) => {
  await openSample(page);
  await expect(page.locator('.page-card__preview')).toHaveCount(SAMPLE_PAGES);

  const first = page.locator('.page-card__preview').first();
  await expect(first).not.toHaveAttribute('data-turned');

  await page.getByRole('button', { name: 'Turn page 1' }).click();
  await expect(first).toHaveAttribute('data-turned', 'true');
});

test('a page moves from the keyboard, not only by dragging', async ({ page }) => {
  await openSample(page);
  await expect(page.locator('.page-card__preview')).toHaveCount(SAMPLE_PAGES);

  const before = await previewSources(page);
  await page.getByRole('button', { name: 'Move page 1 later' }).click();
  const after = await previewSources(page);

  expect(after[0]).toBe(before[1]);
  expect(after[1]).toBe(before[0]);
});

test('a page moves by dragging it across the board', async ({ page }) => {
  await openSample(page);
  await expect(page.locator('.page-card__preview')).toHaveCount(SAMPLE_PAGES);

  const cards = page.locator('.page-slot');
  await cards.first().scrollIntoViewIfNeeded();
  const from = await cards.nth(0).boundingBox();
  const to = await cards.nth(3).boundingBox();
  if (!from || !to) throw new Error('a page card has no box to drag from or to');

  const before = await previewSources(page);

  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 12 });
  await page.mouse.up();

  const after = await previewSources(page);
  expect(after).not.toEqual(before);
  expect(after[3]).toBe(before[0]);
});

test('removing every page returns the tool to its opening state', async ({ page }) => {
  await openSample(page);

  for (let remaining = SAMPLE_PAGES; remaining > 0; remaining -= 1) {
    await page.getByRole('button', { name: 'Remove page 1' }).click();
  }

  await expect(page.getByRole('heading', { name: /Drop a PDF/ })).toBeVisible();
});

/**
 * Round trip: save the sample, then drop what came back in twice under two names. It
 * covers merging and sorting at once, and it only passes if the PDF the tool wrote is
 * one the tool can read again.
 */
test('two files merge onto one board and sort by name', async ({ page }, testInfo) => {
  await openSample(page);
  await page.getByRole('button', { name: 'Save PDF' }).click();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();

  const beta = join(testInfo.outputDir, 'beta.pdf');
  const alpha = join(testInfo.outputDir, 'alpha.pdf');
  await (await download).saveAs(beta);
  copyFileSync(beta, alpha);

  await page.getByRole('button', { name: 'Start over' }).click();
  await page.locator('.dropzone__input').setInputFiles([beta, alpha]);

  await expect(page.locator('.page-card')).toHaveCount(SAMPLE_PAGES * 2);
  await expect(page.getByText('across 2 files')).toBeVisible();

  const origins = page.locator('.page-card__origin');
  await expect(origins.first()).toHaveText('beta.pdf');

  await page.getByRole('button', { name: 'A–Z' }).click();
  await expect(origins.first()).toHaveText('alpha.pdf');

  await page.getByRole('button', { name: 'Z–A' }).click();
  await expect(origins.first()).toHaveText('beta.pdf');
});

test('a file that claims to be a PDF but is not says so', async ({ page }) => {
  await page.goto('/pdf');
  await hydrated(page);

  await page.locator('.dropzone__input').setInputFiles({
    name: 'not-really.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('this is not a PDF'),
  });

  await expect(page.getByRole('alert')).toContainText("isn't a PDF we can read");
});
