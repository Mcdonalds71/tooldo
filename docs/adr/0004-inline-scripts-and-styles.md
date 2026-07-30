# ADR 0004 — `unsafe-inline` for scripts and styles

## Status
Accepted.

## Context
Radix positions its overlays and Motion animates by writing inline `style` attributes,
and Astro emits a small inline bootstrap script on every page that hydrates an island.
All three are load-bearing stack choices.

Astro's experimental CSP support can hash the inline scripts, and it works — islands
hydrate under a hash-based `script-src`. But it also emits hashes for `style-src`, and
per the CSP spec a browser ignores `'unsafe-inline'` whenever a hash is present in the
same source list. The result is a policy that silently blocks every Radix and Motion
inline style: animations die in production with no build-time signal. Hash-strict
scripts and working islands are not both available today.

The alternative was dropping Motion and Radix for CSS-only animation, which trades a
locked stack choice and the product's whole "feels premium" thesis for a hardening step
whose value here is limited: there is no backend, no database, no accounts, and no
stored user data, so there is no server-side target and nothing to exfiltrate.

## Decision
Allow `'unsafe-inline'` on `script-src` and `style-src`. Keep every other directive
tight, including `default-src 'self'`, `object-src 'none'`, `frame-ancestors 'none'`
and `connect-src 'self'`, and never allow `unsafe-eval`.

## Consequences
- Radix and Motion work as designed; islands hydrate.
- The real XSS defence is the layer that was always doing the work: React escapes by
  default, nothing uses `dangerouslySetInnerHTML`, and file contents are validated
  before they are parsed.
- `connect-src 'self'` still means a successful injection has nowhere to send a file to,
  which is the property the privacy promise actually rests on.
- `src/headers.test.ts` fails if any directive beyond those two gains `'unsafe-inline'`,
  so this stays a deliberate exception rather than a precedent.
- Revisit when Astro's CSP support allows per-directive control, or if the site ever
  gains a Pages Function that can issue a per-response nonce.
