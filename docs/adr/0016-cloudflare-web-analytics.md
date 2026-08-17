# ADR 0016 — Cloudflare Web Analytics, the one third-party request the site now makes

## Status
Accepted.

## Context
`/privacy` has said, since before this ADR existed, exactly what would happen if this
site ever added analytics: "no accounts, no cookies, no analytics, and no error
tracking... if that ever changes, it will be a cookieless counter that records page
views and never touches a file, and this page will say so before it ships." That
sentence was written as a real constraint, not a hedge — the question this ADR answers
is which tool satisfies it, not whether to add one at all, which was decided before this
tool existed.

The suite otherwise makes zero outbound requests. Every tool is client-side compute with
no server to report to (CLAUDE.md §1), and `src/headers.test.ts` has enforced
`connect-src 'self'` alone since the CSP was first written, specifically so a future
third-party host couldn't slip in unnoticed. Adding analytics means deliberately
widening that guard, not working around it.

## Decision
[Cloudflare Web Analytics](https://www.cloudflare.com/web-analytics/): a `<script>`
beacon that counts a page view and reports aggregate visits, top pages, referrers,
countries, and device types. It sets no cookies, does no fingerprinting, and cannot
follow a visitor to another site — which is what "cookieless counter" in the existing
promise actually requires, and what rules out Google Analytics or anything cookie- or
fingerprint-based, both of which would need a consent banner none of this site's other
pages carry.

**The beacon is opt-in per build, via `CF_ANALYTICS_TOKEN`** (`src/layouts/
BaseLayout.astro`), not hardcoded. The token isn't sensitive — it ships inside a public
script tag every visitor's browser already downloads — but it's still account-specific,
so it follows the same reasoning `CLASH_DISPLAY_URL` already established in `docs/
deploy.md`: an env var, not a repo value, so a fork or a local preview build carries no
beacon rather than someone else's token or a placeholder that silently does nothing.

**CSP widens by exactly two origins, both Cloudflare's own beacon infrastructure:**
`script-src` gains `https://static.cloudflareinsights.com` (the beacon script itself),
`connect-src` gains `https://cloudflareinsights.com` (where it reports a page view).
`src/headers.test.ts`'s connect-src guard is updated to assert precisely these two
values, not loosened to allow anything — a second third-party host showing up later
still fails that test.

**`/privacy`'s "What we collect" section is rewritten, not just amended** — the old
copy's whole point was describing what doesn't happen yet, and once it does, restating
the same paragraph with an analytics tool bolted on would read as breaking the promise
rather than keeping it. The new copy names what's collected (a page view), what still
isn't (an account, error tracking, anything about a file), and names the tool by name
rather than describing it vaguely — a visitor checking this page's claim against actual
network traffic (which `/privacy` already invites, in "Checking for yourself") should
see exactly what the page says they'd see.

## Consequences
- `connect-src` is no longer literally `'self'` alone, the first time any tool's
  reasoning ("nothing about a visitor or their files ever leaves the tab") has needed a
  named exception rather than staying true without qualification. The distinction that
  keeps it true in spirit: a page view isn't a visitor's file or a tool's output, and
  the promise was always about those specifically.
- A build with `CF_ANALYTICS_TOKEN` unset — every fork, every local `pnpm dev`/`pnpm
  preview`, any PR preview that doesn't set the variable — ships with no beacon at all,
  not a broken or misattributed one. Nothing needs mocking or stubbing in tests because
  of this: the conditional is a plain falsy check, exercised by every existing test run
  that already has the variable unset.
- Cloudflare Web Analytics reports aggregate visits, not individual visitors — there's
  no per-person history to query, because cookieless means there's no way to recognise
  the same browser twice. "Daily/weekly/monthly users" in the dashboard means visits in
  that window, the same meaning every privacy-respecting analytics tool gives that
  phrase, not a persistent user count. If that distinction ever stops being good enough,
  that's a new decision, not an extension of this one.
- No env var is required for the site to build or deploy correctly either way —
  `docs/deploy.md`'s "nothing needs configuring per environment" claim holds with one
  named, documented exception now instead of zero.
