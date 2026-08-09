import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openCsv(page: Page) {
  await page.goto('/csv');
  await hydrated(page);
}

test('the sample loads and renders a sortable table', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openCsv(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  await expect(page.locator('.data-table')).toBeVisible();
  await expect(page.locator('.data-table thead th')).toHaveCount(4);
  await expect(page.locator('.data-table tbody tr')).toHaveCount(5);

  expect(crashes).toEqual([]);
});

test('clicking a header sorts ascending, clicking again reverses it', async ({ page }) => {
  await openCsv(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const firstCell = () => page.locator('.data-table tbody tr').first().locator('td').first();

  // The sample's names, alphabetically: Canvas Tote, Leather Wallet, Rain Shell,
  // Trail Runner Jacket, Wool Beanie — so ascending starts at Canvas Tote and
  // descending starts at Wool Beanie. There is no third "unsorted" click state; the
  // toggle is a plain two-way asc/desc cycle once a column is chosen.
  await page.getByRole('button', { name: 'Sort by name' }).click();
  await expect(firstCell()).toHaveText('Canvas Tote');

  await page.getByRole('button', { name: 'Sort by name' }).click();
  await expect(firstCell()).toHaveText('Wool Beanie');
});

test('downloads both CSV and JSON', async ({ page }) => {
  await openCsv(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const csvDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download CSV' }).click();
  expect((await csvDownload).suggestedFilename()).toBe('data.csv');

  const jsonDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  expect((await jsonDownload).suggestedFilename()).toBe('data.json');
});

test('a malformed JSON file shows an error, not a crash', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openCsv(page);
  await page.setInputFiles('input[type="file"]', {
    name: 'broken.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{not valid json'),
  });

  await expect(page.getByText("That file isn't valid JSON")).toBeVisible();
  await expect(page.getByRole('button', { name: 'Try again' })).toBeVisible();
  expect(crashes).toEqual([]);
});

test('start over returns to the dropzone', async ({ page }) => {
  await openCsv(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await expect(page.locator('.data-table')).toBeVisible();

  await page.getByRole('button', { name: 'Start over' }).click();
  await expect(page.getByRole('button', { name: 'Try a sample' })).toBeVisible();
});
