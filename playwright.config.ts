import { defineConfig, devices } from '@playwright/test';

// biome-ignore lint/complexity/useLiteralKeys: the dot form fails noPropertyAccessFromIndexSignature.
const isCI = Boolean(process.env['CI']);

/**
 * A port of its own, away from `pnpm dev` on 4321. These tests check the built output,
 * and reusing whatever happens to be serving that port means a stale dev server can
 * fail the suite for reasons that have nothing to do with the code.
 */
const baseURL = 'http://localhost:4322';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  /**
   * Two, not one per core. A tool page runs a PDF engine in one worker, pdf.js in
   * another and a canvas rasteriser on top — Image Converter adds jSquash's codecs and
   * heic-to on top of that — and more than a couple of browsers doing that at once put
   * the renderer over its memory ceiling and the tab dies mid-assertion.
   *
   * Dropping this to one didn't make the suite fully deterministic either: the mouse
   * drag test on the touch-emulated `mobile` project (`pdf.spec.ts`) still fails there
   * occasionally, and only there — reliable alone, reliable on every other project,
   * intermittent on that one combination even fully serialized. That points to
   * Chromium's own input classification on a touch+mouse hybrid device, not resource
   * contention, so it isn't a knob this file can turn. `retries` on CI exists for
   * exactly this shape of flake.
   */
  workers: 2,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  reporter: isCI ? 'github' : 'list',
  use: { baseURL, trace: 'on-first-retry' },
  projects: [
    { name: 'desktop', use: devices['Desktop Chrome'] },
    { name: 'mobile', use: devices['Pixel 7'] },
    // Proves the reduced-motion fallbacks actually render, rather than assuming they do.
    {
      name: 'reduced-motion',
      use: { ...devices['Desktop Chrome'], contextOptions: { reducedMotion: 'reduce' } },
    },
  ],
  webServer: {
    command: 'pnpm build && pnpm exec astro preview --port 4322',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 180_000,
  },
});
