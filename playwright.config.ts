import { defineConfig, devices } from '@playwright/test';

// biome-ignore lint/complexity/useLiteralKeys: the dot form fails noPropertyAccessFromIndexSignature.
const isCI = Boolean(process.env['CI']);
const baseURL = 'http://localhost:4321';

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
    command: 'pnpm build && pnpm preview',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
