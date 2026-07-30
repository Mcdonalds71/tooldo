---
name: security-check
description: The security hardening checklist for tooldo — run before deploying and when reviewing anything security-relevant. Covers CSP and security headers, XSS and untrusted-file handling, and supply-chain hygiene for a client-side, no-backend, open-source app. Trigger on "security", "harden", "before deploy", "CSP", "is this safe", or reviewing headers, file parsing, or dependencies.
---

# Skill: security-check

Our no-backend architecture removes most of the usual attack surface — no server, database, accounts, or stored user data means nothing to breach and no credentials to leak. What remains is front-end and supply-chain hygiene. Run this before each deploy. Obey `CLAUDE.md`.

## 1. Headers & CSP (Cloudflare Pages `_headers` or wrangler)

- [ ] **Content-Security-Policy** — the big one. Lock `script-src`, `style-src`, `connect-src`, `img-src`, `font-src`, `worker-src` to `'self'` + only the exact CDNs/model hosts used. Tight CSP neutralises most XSS.
- [ ] **`unsafe-inline` is a known, documented exception here, not a free pass.** Radix and Motion write inline style attributes, and Astro emits an inline bootstrap on every island page; hashing the scripts forces hashes onto `style-src`, which makes browsers ignore `'unsafe-inline'` and kills those animations. The reasoning lives in `public/_headers` — revisit it whenever Astro's CSP support gains per-directive control, and never widen the policy further without the same kind of note.
- [ ] **Strict-Transport-Security** — long `max-age`, `includeSubDomains`, `preload`. Force HTTPS.
- [ ] **X-Content-Type-Options: nosniff**.
- [ ] **X-Frame-Options: DENY** (or CSP `frame-ancestors 'none'`) — anti-clickjacking.
- [ ] **Referrer-Policy: strict-origin-when-cross-origin**.
- [ ] **Permissions-Policy** — disable unused APIs (camera, microphone, geolocation, USB…).
- [ ] **COOP/COEP** cross-origin-isolation headers where ffmpeg.wasm/threads need them — scoped so they don't break other tools.
- [ ] Verify at securityheaders.com and Mozilla Observatory — aim for **A+** (screenshot it for the case study).

## 2. XSS & untrusted input (the main real risk here)

Tools render user-supplied data (filenames, CSV cells, text, invoice fields), so:
- [ ] **Never** `dangerouslySetInnerHTML` with user content. Let React escape by default.
- [ ] If rich/HTML output is unavoidable, sanitise with **DOMPurify** first.
- [ ] Treat all file contents as untrusted: validate type + size before processing, cap sizes, guard malformed inputs (bad PDFs, corrupt images, zip bombs), wrap parsing in try/catch so a crafted file can't hang or crash the tab.
- [ ] Sanitise anything that becomes a **download filename** or a **URL/query param** (timezone share links, etc.).
- [ ] No `eval`, no `new Function`, no dynamic script injection.

## 3. Supply chain (most likely way an OSS project actually gets hurt)

- [ ] **Dependabot** or Renovate enabled for automated update PRs.
- [ ] **`pnpm audit`** runs in CI; no high/critical advisories at deploy.
- [ ] **GitHub secret scanning + push protection** on.
- [ ] **CodeQL** code scanning enabled (free for public repos).
- [ ] Dependencies pinned via lockfile; new deps reviewed before adding; prefer well-maintained libraries.
- [ ] No secrets in the repo (there should be none by design — scanning confirms it).

## 4. Repo & privacy hygiene

- [ ] 2FA on GitHub; `main` protected (require PR + passing CI).
- [ ] `SECURITY.md` present with how to report issues.
- [ ] Any analytics is cookieless and collects **no file data or PII** — and matches what the privacy page claims. The privacy promise must stay literally true.
- [ ] Third-party resources (fonts, models) are self-hosted or from a pinned, trusted origin allowed by the CSP.

## Done when

All headers present and verified A/A+, output escaping + file validation confirmed, supply-chain scanning green, and the privacy promise still literally accurate. A static client-side app hardened this way is about as hard to breach as web products get — there's no server to break into.
