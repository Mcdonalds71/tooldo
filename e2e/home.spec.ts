import { expect, test } from '@playwright/test';
import { tools } from '../src/lib/tools';

test('the home page shows every registered tool', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('everyday');

  const cards = page.locator('#tools li');
  await expect(cards).toHaveCount(tools.length);

  for (const tool of tools) {
    await expect(page.getByRole('heading', { name: tool.name, exact: true })).toBeVisible();
  }
});

test('no tool card links to a page that does not exist yet', async ({ page }) => {
  await page.goto('/');

  for (const tool of tools.filter((candidate) => candidate.status === 'planned')) {
    await expect(page.locator(`#tools a[href="/${tool.slug}"]`)).toHaveCount(0);
  }
});

/**
 * Runs under the reduced-motion project too, which is the point: the deck has to reach
 * its finished state from CSS alone, without waiting on GSAP.
 */
test('the hero deck deals out five files and lands on the total', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.deck__card')).toHaveCount(5);
  await expect(page.getByRole('list', { name: /five everyday files/i })).toBeVisible();
  await expect(page.locator('.deck__saved')).toHaveText('85% smaller');
});

test('the keyboard path starts with a skip link', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');

  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toBeInViewport();
});

test('the privacy promise is reachable and states the promise', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Read the privacy promise' }).click();

  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Your files never leave your device.',
  );
});
