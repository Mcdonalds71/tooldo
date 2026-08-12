import { expect, type Page, test } from '@playwright/test';
import { tools } from '../src/lib/tools';

test('the story sections are all present and in order', async ({ page }) => {
  await page.goto('/');

  const sections = ['#tools', '#different', '.proof', '.install', '#price', '#trust', '.closing'];
  const tops = await Promise.all(
    sections.map(async (selector) => {
      const box = await page.locator(selector).first().boundingBox();
      return box ? box.y : Number.NaN;
    }),
  );

  expect(tops.every((top) => Number.isFinite(top))).toBe(true);
  expect([...tops].sort((a, b) => a - b)).toEqual(tops);
});

test('the offline section does not overpromise', async ({ page }) => {
  await page.goto('/');
  const install = page.locator('.install');

  /* ADR 0017: a tool that has never been opened still needs a connection the first
     time, so the honest claim is scoped to the tools you have used. This assertion
     exists to fail if that ever gets "improved" into a flat everything-works-offline. */
  await expect(install).toContainText("the tools you've opened keep working");
});

test('the closing call sends you back to the suite', async ({ page }) => {
  await page.goto('/');

  const cta = page.locator('.closing__cta');
  await expect(cta).toHaveText(/Open the tools/);
  await cta.click();

  await expect(page.locator('#tools')).toBeInViewport();
});

/** Scrubbed motion is driven by rAF, so a frame has to actually be painted between
 *  the scroll and the sample or every read comes back on the start value. */
async function scrollAndSettle(page: Page, y: number) {
  await page.evaluate((top) => window.scrollTo(0, top), y);
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.waitForTimeout(700);
}

function scaleX(transform: string): number {
  const match = transform.match(/matrix\(([^,]+)/);
  return match?.[1] ? Number.parseFloat(match[1]) : Number.NaN;
}

test('the proof plays its beats as you scroll through it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === 'reduced-motion', 'motion is off there by design');
  test.skip(testInfo.project.name === 'mobile', 'the cord is not on screen below 56rem');

  await page.goto('/');
  const anchor = await page.locator('.proof').first().boundingBox();
  const top = anchor ? anchor.y : 0;

  await scrollAndSettle(page, top);
  const wireAtStart = await page
    .locator('.proof__wire')
    .evaluate((el) => getComputedStyle(el).transform);
  const stampAtStart = await page
    .locator('.proof__stamp')
    .evaluate((el) => getComputedStyle(el).opacity);

  const viewport = page.viewportSize();
  await scrollAndSettle(page, top + (viewport ? viewport.height : 800) * 1.7);
  const wireAtEnd = await page
    .locator('.proof__wire')
    .evaluate((el) => getComputedStyle(el).transform);
  const stampAtEnd = await page
    .locator('.proof__stamp')
    .evaluate((el) => getComputedStyle(el).opacity);

  // The cord retracts toward the device and the stamp lands.
  expect(scaleX(wireAtEnd)).toBeLessThan(scaleX(wireAtStart));
  expect(Number(stampAtEnd)).toBeGreaterThan(Number(stampAtStart));
});

test('the proof rests on its finished frame without motion', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'reduced-motion', 'this is the reduced-motion contract');

  await page.goto('/');
  await page.locator('.proof').scrollIntoViewIfNeeded();

  /* Nothing is pinned and nothing tweens, so the argument has to already be made in
     the resting CSS — the stamp visible and the run complete, not a half-told story. */
  await expect(page.locator('.proof__stamp')).toBeVisible();
  await expect(page.locator('.proof__done')).toBeVisible();
  expect(await page.locator('.pin-spacer').count()).toBe(0);
});

test('the trust grid names every promise once', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.reason')).toHaveCount(6);
  await expect(page.locator('.term')).toHaveCount(3);
  await expect(page.locator('.row')).toHaveCount(3);

  // The suite count in the copy is derived, so it cannot drift from the registry.
  await expect(page.locator('#different')).toContainText(`One look across all ${tools.length}`);
});
