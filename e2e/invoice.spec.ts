import { expect, type Page, test } from '@playwright/test';
import { hydrated } from './support';

async function openInvoice(page: Page) {
  await page.goto('/invoice');
  await hydrated(page);
}

/** Desktop shows both panes at once, so the toggle is hidden and there's nothing to
 *  click. Mobile shows one at a time — a hidden pane drops out of the accessibility
 *  tree entirely, so switching tabs first is what a real visitor would do too. */
async function showPreview(page: Page) {
  const toggle = page.getByRole('radio', { name: 'Preview' });
  if (await toggle.isVisible()) await toggle.click();
}

async function showEdit(page: Page) {
  const toggle = page.getByRole('radio', { name: 'Edit' });
  if (await toggle.isVisible()) await toggle.click();
}

test('the sample fills the form and the live preview updates as you type', async ({ page }) => {
  const crashes: string[] = [];
  page.on('pageerror', (error) => crashes.push(error.message));

  await openInvoice(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  await showPreview(page);
  const preview = page.getByRole('region', { name: 'Invoice preview' });
  await expect(preview).toContainText('Northwind Studio');
  await expect(preview).toContainText('Harlow & Finch Co');

  await showEdit(page);
  await page.getByLabel('Business name').fill('Acme Rocket Co');

  await showPreview(page);
  await expect(preview).toContainText('Acme Rocket Co');

  expect(crashes).toEqual([]);
});

test('downloads a PDF named after the invoice number', async ({ page }) => {
  await openInvoice(page);
  await page.getByRole('button', { name: 'Try a sample' }).click();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download PDF' }).click();

  expect((await download).suggestedFilename()).toBe('invoice-1042.pdf');
});

test('the totals in the preview reflect tax and discount', async ({ page }) => {
  await openInvoice(page);

  await page.locator('.line-items__description').first().fill('Consulting');
  await page.locator('.line-items__qty').first().fill('1');
  await page.locator('.line-items__price').first().fill('100');
  await page.getByLabel('Tax %').fill('10');
  await page.getByLabel('Discount %').fill('20');

  await showPreview(page);
  const preview = page.getByRole('region', { name: 'Invoice preview' });
  // 100 - 20% discount = 80, +10% tax on 80 = 8 → 88 total.
  await expect(preview).toContainText('$88.00');
});

test('the last line item cannot be removed', async ({ page }) => {
  await openInvoice(page);

  const removeButtons = page.getByRole('button', { name: /Remove line/ });
  await expect(removeButtons).toHaveCount(1);
  await expect(removeButtons.first()).toBeDisabled();
});
