import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openTimezones(page: Page) {
  await page.goto('/timezones');
  await hydrated(page);
}

test('the sample adds five cities with live clocks', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openTimezones(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  await expect(page.locator('.timezone-row')).toHaveCount(5);
  await expect(page.getByText('Lagos')).toBeVisible();
  await expect(page.getByText('Tokyo')).toBeVisible();

  expect(crashes).toEqual([]);
});

test('searching adds a city, and removing it takes it back out', async ({ page }) => {
  await openTimezones(page);

  // A fresh visit already carries one row - the visitor's own detected city - added by
  // a client-only effect a moment after hydration (see ADR 0011), so the first row has
  // to actually be there before the baseline is read, or this can race and catch zero.
  await expect(page.locator('.timezone-row').first()).toBeVisible();
  const startingCount = await page.locator('.timezone-row').count();

  await page.getByLabel('Add a city').fill('Nairobi');
  await page.getByRole('button', { name: /Nairobi/ }).click();

  await expect(page.locator('.timezone-row', { hasText: 'Nairobi' })).toBeVisible();
  await expect(page.locator('.timezone-row')).toHaveCount(startingCount + 1);

  await page.getByRole('button', { name: 'Remove Nairobi' }).click();
  await expect(page.locator('.timezone-row')).toHaveCount(startingCount);
});

test("dragging the time cursor updates every city's clock live", async ({ page }) => {
  await openTimezones(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const tokyoRow = page.locator('.timezone-row', { hasText: 'Tokyo' });
  const before = await tokyoRow.locator('.timezone-row__clock').textContent();

  const slider = page.getByRole('slider', { name: 'Time' });
  await slider.focus();
  // step is 15 minutes; eight presses moves the reading a full two hours, which is
  // never a rounding no-op regardless of what second the test happens to run in.
  for (let index = 0; index < 8; index++) {
    await page.keyboard.press('ArrowRight');
  }

  await expect(tokyoRow.locator('.timezone-row__clock')).not.toHaveText(before ?? '');
});

test('adding a city updates the shareable URL', async ({ page }) => {
  await openTimezones(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  await expect(page).toHaveURL(/cities=/);
});
