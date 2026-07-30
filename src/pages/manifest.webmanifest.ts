import type { APIRoute } from 'astro';
import { SITE } from '../lib/site';

/** An endpoint rather than a static file so the name and description have one source. */
export const GET: APIRoute = () =>
  new Response(
    JSON.stringify({
      name: `${SITE.name} — ${SITE.tagline}`,
      short_name: SITE.name,
      description: SITE.description,
      start_url: '/',
      display: 'standalone',
      background_color: '#f4f0e7',
      theme_color: '#f4f0e7',
      icons: [
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
    }),
    { headers: { 'content-type': 'application/manifest+json' } },
  );
