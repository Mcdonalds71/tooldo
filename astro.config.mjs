import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import { precache } from './src/integrations/precache';

export default defineConfig({
  site: 'https://tooldo.online',
  // The style guide is for us, not for search results.
  integrations: [
    react(),
    sitemap({ filter: (page) => !page.includes('/design-system') }),
    precache(),
  ],
  // Styles ship as files rather than inline <style> tags — fewer bytes duplicated
  // across pages, and one less thing for the CSP to account for.
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
    // jSquash's own glue code resolves each codec's .wasm file relative to itself at
    // request time; Vite's dependency pre-bundler rewrites that path before the codec
    // ever runs, which is what jSquash's own README calls out as the fix.
    optimizeDeps: {
      exclude: ['@jsquash/avif', '@jsquash/jpeg', '@jsquash/webp', '@jsquash/resize'],
    },
  },
});
