import { expect, type Page } from '@playwright/test';

/**
 * Astro drops the `ssr` attribute once an island has hydrated. Waiting on that beats
 * waiting on a timeout: a click that lands before React attaches its handlers does
 * nothing at all, which is what made these tests flaky under parallel load.
 */
export async function hydrated(page: Page): Promise<void> {
  await expect(page.locator('astro-island[ssr]')).toHaveCount(0);
}
