import { expect, test } from '@playwright/test';

/**
 * The site's whole claim is that tools run on-device, which is only interesting if the
 * device can still run them with nothing behind it. These tests are what stop that from
 * quietly becoming untrue again: the manifest advertises the site as installable, and a
 * build that ships an install prompt without a working offline path is worse than one
 * that never offered it.
 *
 * `controller` going non-null is the signal to wait on rather than a timeout, and it is
 * a precise one: the worker claims clients from its `activate` handler, and `activate`
 * cannot run until `install` has finished its precache, so a controller means the shell
 * is fully cached and it is safe to pull the plug.
 */
async function waitForWorker(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, null, {
    timeout: 20_000,
  });
}

test('the shell is precached without any tool engines', async ({ page }) => {
  await page.goto('/');
  await waitForWorker(page);

  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    const shell = names.find((name) => name.startsWith('tooldo-shell-'));
    if (!shell) return [];
    const cache = await caches.open(shell);
    return (await cache.keys()).map((request) => new URL(request.url).pathname);
  });

  expect(cached).toContain('/');
  expect(cached).toContain('/pdf/');

  /* The other half of the bargain — engines stay out, so a first visit costs about
     2MB rather than the 17MB the full build weighs. */
  expect(cached.filter((path) => path.endsWith('.wasm'))).toEqual([]);
  expect(cached.filter((path) => /worker/i.test(path))).toEqual([]);
});

test('the home page still loads with the network off', async ({ page, context }) => {
  await page.goto('/');
  await waitForWorker(page);

  await context.setOffline(true);
  await page.reload();

  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'PDF Toolbox', exact: true })).toBeVisible();
});

/** The stronger claim: a page the visitor had never opened before losing the
 *  connection, reached offline and fully interactive rather than merely rendered. */
test('a tool page opens offline even if it was never visited online', async ({ page, context }) => {
  await page.goto('/');
  await waitForWorker(page);

  await context.setOffline(true);
  await page.goto('/qr');

  await expect(page.getByRole('heading', { level: 1 })).toContainText('QR');
  await expect(page.getByRole('textbox').first()).toBeVisible();
});
