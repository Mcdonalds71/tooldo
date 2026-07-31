import { expect, type Page, test } from '@playwright/test';

/**
 * Astro drops the `ssr` attribute once an island has hydrated. Waiting on that beats
 * waiting on a timeout: a click that lands before React attaches its handlers does
 * nothing at all, which is what made these tests flaky under parallel load.
 */
async function hydrated(page: Page) {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}

/**
 * The style guide is the only page that hydrates, so it is where a broken island shows
 * up first. The security headers themselves live in public/_headers, which Cloudflare
 * applies and `astro preview` does not — `src/headers.test.ts` guards those.
 *
 * Toast text is matched on `.toast__title` rather than by text alone — Radix also
 * renders each toast into a visually hidden region for screen readers.
 */
test('the island hydrates and stays quiet', async ({ page }) => {
  const blocked: string[] = [];
  const crashes: string[] = [];

  page.on('console', (message) => {
    // Scoped to policy violations: a missing optional asset is a different problem,
    // and Clash Display legitimately isn't in the repo.
    if (message.type() === 'error' && /content security policy/i.test(message.text())) {
      blocked.push(message.text());
    }
  });
  page.on('pageerror', (error) => crashes.push(error.message));

  await page.goto('/design-system');
  await hydrated(page);

  await page.getByRole('button', { name: 'Success toast' }).click();
  await expect(page.locator('.toast__title')).toHaveText('Files compressed');

  expect(blocked).toEqual([]);
  expect(crashes).toEqual([]);
});

test('the dropzone takes a file it can read and explains the one it cannot', async ({ page }) => {
  await page.goto('/design-system');
  await hydrated(page);

  const input = page.locator('.dropzone__input');

  await input.setInputFiles({
    name: 'cat.png',
    mimeType: 'image/png',
    buffer: Buffer.from([137, 80, 78, 71]),
  });
  await expect(page.locator('.toast__title')).toHaveText('1 file added');
  await expect(page.getByRole('list', { name: 'Demo queue' })).toContainText('cat.png');

  await input.setInputFiles({
    name: 'holiday-clip.mov',
    mimeType: 'video/quicktime',
    buffer: Buffer.from([0, 0, 0, 1]),
  });
  await expect(page.locator('.toast__title').last()).toHaveText(
    "holiday-clip.mov isn't an image — try another",
  );
});

test('the processing overlay can be cancelled', async ({ page }) => {
  await page.goto('/design-system');
  await hydrated(page);

  const overlay = page.locator('.overlay');

  await page.getByRole('button', { name: 'Show progress' }).click();
  await expect(overlay.getByRole('progressbar')).toBeVisible();

  await overlay.getByRole('button', { name: 'Cancel' }).click();
  await expect(overlay).toHaveCount(0);
});
