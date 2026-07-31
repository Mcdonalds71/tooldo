import { expect, test } from '@playwright/test';
import { tools } from '../src/lib/tools';

test('the home page shows every registered tool', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

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
 * Runs under the reduced-motion project too, which is the point: the bento has to
 * reach its resting state from CSS alone, without waiting on GSAP.
 */
test('the hero bento shows the preview, the badge, and the promise', async ({ page }) => {
  await page.goto('/');

  await expect(page.locator('.preview__saved')).toHaveText(/86%/);
  await expect(page.getByRole('link', { name: 'Start here' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Read the privacy promise' })).toBeVisible();
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
