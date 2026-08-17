/**
 * tooldo's service worker.
 *
 * The point of it is the product's own claim: every tool runs on-device, so once the
 * code is on the device there is nothing left for a network to be needed for. This
 * makes that literally true instead of merely architecturally true.
 *
 * Two caches, because the two halves have different lifetimes:
 *
 *   shell    Every page, the fonts, the shared client runtime. Precached on install
 *            from the generated manifest, and versioned — a new deploy builds the new
 *            shell and drops the old one wholesale.
 *   engines  Each tool's worker bundle and WASM, cached the first time that tool is
 *            actually used. Deliberately *not* versioned: these filenames are already
 *            content-hashed by the build, so an old entry is either still correct or
 *            never requested again, and wiping ~9MB of codecs on every deploy to
 *            re-download the identical bytes would be a poor trade.
 */

importScripts('/sw-manifest.js');

const SHELL = `tooldo-shell-${self.__PRECACHE_VERSION__}`;
const ENGINES = 'tooldo-engines';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(self.__PRECACHE__))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('tooldo-shell-') && key !== SHELL)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

/** Astro's client router fetches pages itself rather than navigating, so intent has
 *  to be read off the request instead of assuming `mode: 'navigate'`. */
function wantsHtml(request) {
  return (
    request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')
  );
}

function isCacheable(response) {
  return response && response.ok && response.type === 'basic';
}

/**
 * Links across the site point at `/qr`, the build writes `qr/index.html`, and the
 * redirect that normally reconciles those two is a server's job — which offline there
 * is no server to do. So a miss is retried against the other spelling before it counts
 * as a miss, or every internal link would fall through to the 404 the moment the
 * connection dropped.
 */
async function matchPage(request) {
  const direct = await caches.match(request);
  if (direct) return direct;

  const { pathname } = new URL(request.url);
  const alternate = pathname.endsWith('/') ? pathname.slice(0, -1) : `${pathname}/`;
  return alternate ? caches.match(alternate) : undefined;
}

/** Pages go to the network first so a visitor with a connection always sees the
 *  current site, and fall back to the cached copy only when that fails. */
async function pageOrCached(request) {
  try {
    const response = await fetch(request);
    if (isCacheable(response)) {
      const cache = await caches.open(SHELL);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await matchPage(request);
    if (cached) return cached;

    /* An address that genuinely isn't in the cache. The 404 page is precached and
       carries the nav, so it is a way onward rather than the browser's dinosaur —
       and it tells the truth about this URL, which serving the home page would not. */
    const missing = await caches.match('/404.html');
    if (missing) return missing;
    throw error;
  }
}

/** Assets are content-hashed, so a hit is always correct and never needs revalidating. */
async function cachedOrFetched(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(ENGINES);
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  /* Anything cross-origin is left entirely alone — in practice that is the analytics
     beacon, which should reach the network or fail on its own terms, never be served
     something stale out of a cache it knows nothing about. */
  if (new URL(request.url).origin !== self.location.origin) return;

  event.respondWith(wantsHtml(request) ? pageOrCached(request) : cachedOrFetched(request));
});
