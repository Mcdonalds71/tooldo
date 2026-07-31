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
