import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openText(page: Page) {
  await page.goto('/text');
  await hydrated(page);
}

test('the sample fills in text and live stats update', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openText(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const input = page.getByLabel('Your text');
  await expect(input).not.toHaveValue('');

  const output = page.getByLabel('Result');
  // The sample's cleanup options are on, so the result differs from the messy input.
  await expect(output).not.toHaveValue(await input.inputValue());

  expect(crashes).toEqual([]);
});

test('a cleanup toggle changes the live result', async ({ page }) => {
  await openText(page);
  await page.getByLabel('Your text').fill('a    b    c');

  const output = page.getByLabel('Result');
  await expect(output).toHaveValue('a    b    c');

  await page.getByLabel('Collapse multiple spaces').click();
  await expect(output).toHaveValue('a b c');
});

test('changing the case option changes the live result', async ({ page }) => {
  await openText(page);
  await page.getByLabel('Your text').fill('hello there');

  await page.getByLabel('Change case').selectOption('upper');
  await expect(page.getByLabel('Result')).toHaveValue('HELLO THERE');
});

test('switching to compare mode shows a real line diff', async ({ page }) => {
  await openText(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await page.getByRole('radio', { name: 'Compare' }).click();

  await expect(page.getByLabel('Original')).not.toHaveValue('');
  await expect(page.locator('.text-tool__diff-line--added')).not.toHaveCount(0);
  await expect(page.locator('.text-tool__diff-line--removed')).not.toHaveCount(0);
});

test('compare mode with no text shows an inviting hint, not an empty diff', async ({ page }) => {
  await openText(page);
  await page.getByRole('radio', { name: 'Compare' }).click();

  await expect(page.getByText('Add text on both sides to see what changed.')).toBeVisible();
});

test('downloads the result as a .txt file', async ({ page }) => {
  await openText(page);
  await page.getByLabel('Your text').fill('hello world');

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .txt' }).click();

  expect((await download).suggestedFilename()).toBe('cleaned-text.txt');
});

test('clear all resets both modes', async ({ page }) => {
  await openText(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();
  await expect(page.getByLabel('Your text')).not.toHaveValue('');

  await page.getByRole('button', { name: 'Clear all' }).click();
  await expect(page.getByLabel('Your text')).toHaveValue('');
});
