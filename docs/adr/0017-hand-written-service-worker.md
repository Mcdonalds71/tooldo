# ADR 0017 — A hand-written service worker, and what it deliberately doesn't cache

## Status
Accepted.

## Context
The site has shipped `<link rel="manifest">` with `"display": "standalone"` since the
manifest endpoint was written, and nothing has ever registered a service worker. That
combination is worse than having neither: Chrome and Edge read the manifest, offer
**Install app**, and a visitor who accepts gets a standalone window that shows nothing at
all the first time they open it without a connection. The install prompt was writing a
cheque the site couldn't cash.

Fixing it was never really a new feature. `docs/build-spec.md` §46 has listed
"Offline-first PWA — visit once, use forever without internet" as a headline capability
since the spec was written, with `@vite-pwa/astro` named in the stack table at §67. It
simply never got built, and the manifest shipped ahead of it.

There is a second reason to care beyond closing that gap. Every tool in the suite is
client-side compute by construction (CLAUDE.md §1), which means the network is only ever
needed to deliver the code — never to do the work. Offline isn't a bolt-on for this
product; it's the most direct available demonstration that the central privacy claim is
structurally true. A tool that keeps working with the network physically off cannot be
uploading anyone's files.

## Decision

### Hand-written, not `@vite-pwa/astro`
The plugin the build spec names **does not support the Astro version this project runs
on**. `@vite-pwa/astro@1.2.0` declares `astro: ^1 || ^2 || ^3 || ^4 || ^5`; this repo is
on Astro 7.1.6 (ADR 0005). Installing it would mean overriding a peer range into build
internals that changed across two majors — a plugin reaching into hooks it was never
tested against, to produce a file we could write directly.

The spec's recommendation was correct when it was written and is simply stale. What it
was buying us — a precache manifest of content-hashed filenames — is about forty lines
of build-time directory walk, so the trade is a known forty lines against an unsupported
dependency wired into the build. `public/sw.js` stays a plain, hand-written file with no
build step between the source and what ships, which is worth something on its own for a
file that can silently break every future deploy.

### The precache is the site; engines load on first use
The build is 17MB, and 9.2MB of that is WebAssembly — the AVIF encoders alone are ~8MB.
Precaching all of it would push 17MB at every first-time visitor on whatever connection
they happen to be on, most of whom are there to do one thing to one file.

So the split is conceptual, not a byte threshold. **The precache is _the site_**: every
page, the fonts, the shared client runtime, ~1.8MB across 84 files. **Left out is _each
tool's engine_** — its Web Worker bundle and the WASM that worker instantiates — which
the runtime cache picks up the first time that tool actually runs.

Two caches follow from that, with deliberately different lifetimes:

- `tooldo-shell-<hash>` — precached at install, versioned by a fingerprint of the file
  list, dropped wholesale when a deploy changes it. The version is derived from the
  filenames rather than a build timestamp because Astro already content-hashes them, so
  a deploy that changes nothing a visitor would download doesn't evict their cache to
  re-fetch a byte-identical site.
- `tooldo-engines` — populated on demand, deliberately **not** versioned. These
  filenames are already content-hashed, so a stale entry is either still correct or
  never requested again, and wiping ~9MB of codecs on every deploy to re-download
  identical bytes would be a poor trade.

### Pages network-first, assets cache-first
A visitor with a connection should always see the current site, so HTML tries the
network first and falls back to cache. Hashed assets are immutable by construction, so a
cache hit is always correct and never needs revalidating.

Two details that are easy to get wrong and were both found by testing rather than
reasoning:

- **Astro's client router fetches pages itself** rather than navigating, so request
  intent is read off the `accept` header as well as `request.mode`, or client-side
  navigations would be treated as asset requests.
- **Trailing slashes have to be reconciled in the worker.** Internal links point at
  `/qr`, the build writes `qr/index.html`, and the redirect that normally reconciles
  them is a server's job — offline there is no server. Without that normalisation every
  internal link falls through to the fallback the moment the connection drops, which is
  exactly what the first run of `e2e/offline.spec.ts` caught.

### `skipWaiting()` on install
A first-time visitor gets offline capability on that visit rather than the next one. The
cost is that an open tab can be claimed by a worker newer than the JS it is running; in
practice the shell is loaded eagerly and engines live in the unversioned cache, so the
window where that matters is narrow. For a site people arrive at to do one task and
leave, working-immediately is the better half of that trade.

## Consequences
- **The install prompt now tells the truth.** This is the actual point; everything else
  is implementation.
- **Offline is enforced, not asserted.** `e2e/offline.spec.ts` covers all three claims —
  the shell is cached, engines are *not* cached, and a never-visited tool page opens with
  the network off. A future change that quietly breaks offline fails CI instead of
  shipping. Waiting on `serviceWorker.controller` rather than a timeout makes this
  precise: the worker claims clients from `activate`, which cannot run until `install`
  finished precaching, so a controller means the shell is fully cached.
- **A tool that has never been run needs a connection the first time.** Its page opens
  offline and is fully interactive, but the engine behind it isn't there yet. This is the
  honest limit of the trade above, and it is the exact situation the existing
  `EmptyState` `offline` variant was built for. Landing-page copy must not overstate
  this — "the tools you've used keep working" is true; "everything works offline
  forever" is not.
- **`/sw.js` and `/sw-manifest.js` must never be served stale**, since they are how every
  other cached thing gets replaced. Both are pinned to `Cache-Control: no-cache` in
  `public/_headers`; an HTTP cache holding an old copy would pin visitors to an old build
  with no way to tell them otherwise.
- **No new runtime dependency, and no new CSP origin.** `worker-src 'self' blob:` already
  covered this, so the policy is unchanged — the offline story cost the site zero
  additional third-party surface, which is the sort of thing this project should keep
  being able to say.
