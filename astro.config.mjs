import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tooldo.online',
  // The style guide is for us, not for search results.
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/design-system') })],
  // Keeping styles in files rather than inline <style> tags is what lets the CSP in
  // public/_headers run without 'unsafe-inline'.
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
  },
});
