import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://tooldo.online',
  // The style guide is for us, not for search results.
  integrations: [react(), sitemap({ filter: (page) => !page.includes('/design-system') })],
  // Styles ship as files rather than inline <style> tags — fewer bytes duplicated
  // across pages, and one less thing for the CSP to account for.
  build: { inlineStylesheets: 'never' },
  vite: {
    plugins: [tailwindcss()],
  },
});
