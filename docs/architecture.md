# Architecture

How tooldo is built, and why. This document is the reasoning behind the code — read it alongside `CLAUDE.md` (the rules) and `docs/build-spec.md` (the full spec).

## What it is, in one line

A suite of ten free utility tools that run entirely in the browser — no backend, no database, no accounts, no uploads. Privacy is the product: *your files never leave your device.*

## The one decision everything follows from

**All computation happens client-side.** Compression, PDF manipulation, background removal, video transcoding — every operation runs in the visitor's browser via WebAssembly and Web APIs. Nothing is sent to a server.

This single choice cascades into the rest of the architecture:

- **No backend to build, secure, or scale.** The "server" only ships static files.
- **Privacy is structural, not promised.** There is literally no server that could receive a file.
- **Scale is free.** The users' own devices do the work; a CDN serves static assets. Thousands or millions of daily users cost the same: a static-hosting bill of roughly zero.
- **The attack surface nearly vanishes.** No database, no auth, no API, no stored user data means almost nothing to breach (see Security below).

## Rendering model — Astro islands

The site is **static-first with interactive islands**.

- Every route is pre-rendered to static HTML at build time — instant paint, perfect SEO, zero JavaScript on content pages.
- Each tool's interactive UI is a **React island** hydrated only where and when needed (`client:visible`). Opening `/pdf` never loads `/video`'s code.
- Marketing pages (landing, about, privacy, per-tool FAQ) ship as near-zero-JS HTML.

**Why Astro over Next.js:** this product is SEO-driven tool traffic plus a landing page that must feel featherlight, with interactivity confined to isolated spots. Astro ships dramatically less JavaScript for that shape and keeps content pages at Lighthouse 100. Next.js would hydrate a heavier client tree for pages that don't need it. (See `docs/adr/0001-astro-over-nextjs.md`.)

## Layering and dependency direction

```
pages (.astro)         →  routes, SEO metadata, mount islands
  └─ tools/<tool>/
       ├─ <Tool>.tsx   →  thin island: state + orchestration only
       └─ engine.ts    →  pure, typed, framework-free computation
design-system/         →  tokens + components (Button, Dropzone, EmptyState…)
lib/                   →  shared utils (worker runner, download, tool registry)
```

Dependencies point **inward**: `pages` and `tools` depend on `design-system` and `lib`; those never depend back out. No circular imports.

### The core rule: logic ≠ UI

Every tool splits cleanly in two:

- **`engine.ts`** — pure functions that take typed input and return typed output. No React, no DOM, no globals. This is where all the real work lives, which makes it unit-testable in isolation and portable.
- **`<Tool>.tsx`** — a thin React shell that manages the `empty → ready → processing → result → error` states and calls the engine (through a Web Worker). It contains no business logic.

This separation is the backbone of the codebase. It's what makes the tools testable, consistent, and easy to reason about.

## The tool as a unit

Adding a tool is a fixed recipe (see the `new-tool` skill), and every tool has the same anatomy:

1. `engine.ts` + `engine.test.ts` — pure logic, thoroughly tested.
2. `<Tool>.tsx` — the island, composed only from design-system components.
3. `<slug>.astro` — the page, with SEO metadata and a how-it-works/FAQ block.
4. A single entry in `lib/tools.ts` — the **tool registry**.

The registry is the **single source of truth**. Nav, the landing grid, the sitemap, and routing all derive from it. Adding a tool touches one data file, not five components — which is exactly why the suite scales to a tenth tool as cheaply as the second.

## Concurrency — Web Workers

Heavy compute (ffmpeg.wasm, image codecs, the background-removal model) runs inside **Web Workers** via a generic typed `runInWorker<TIn, TOut>()` helper. The main thread stays free, so the UI holds 60fps and animations never jank while a file processes. Large WASM payloads are lazy-loaded with dynamic `import()` inside the worker, only when the user acts — never in the initial bundle.

## Design system

One shared system (`design-system/`) gives ten tools a single visual language.

- **Design tokens** as CSS variables (colour, spacing, radius, type, shadow, motion) drive everything; components never hardcode values. Dark mode swaps token values, not component code.
- **Radix UI** provides accessible primitives (menus, dialogs, sliders, tabs); we style them with tokens rather than re-solving accessibility.
- **One component per concept** — a single `Button`, `Dropzone`, `EmptyState`, extended by props, never forked.
- **Motion** handles UI micro-interactions and transitions; **GSAP** is reserved for landing-page showpieces. All non-essential motion is gated by `prefers-reduced-motion`.

## Performance

- Static HTML + CDN edge delivery; content pages ship ~0 KB JS.
- Per-tool code splitting; heavy WASM lazy-loaded on demand.
- A performance budget is enforced (landing < ~100 KB JS, fast LCP) via Lighthouse CI.
- Animations touch only `transform`/`opacity`; compute is offloaded to workers.

## Security posture

The no-backend design removes most of the usual risk — there's no server, database, or credential store to breach. What remains is front-end and supply-chain hygiene:

- A strict **Content-Security-Policy** and the full set of security headers.
- All user input and file content treated as untrusted; output escaped (no `dangerouslySetInnerHTML`; DOMPurify where rich content is unavoidable); malformed files guarded.
- Automated **Dependabot**, **`pnpm audit`**, **secret scanning**, and **CodeQL** on the public repo.

Full checklist in the `security-check` skill.

## Hosting & deployment

- **Cloudflare Pages** — static hosting on a global edge with unlimited free bandwidth, git-push deploys, and per-branch previews. Security headers and cross-origin-isolation (for ffmpeg threads) are configured via `_headers`.
- **CI gate:** typecheck, lint, unit tests, and build must pass on every PR before merge.

## Testing strategy

- **Unit (Vitest):** every `engine.ts` — pure functions make for high-value, easy tests, including malformed-input cases.
- **Smoke (Playwright):** flagship tools get an end-to-end check (load → try sample → assert output).

## Tech stack summary

| Concern | Choice |
|---|---|
| Meta-framework | Astro 5 (static + React islands) |
| UI | React 19 (islands only), TypeScript strict |
| Styling | Tailwind CSS v4 + CSS-variable tokens |
| Primitives | Radix UI |
| Motion | Motion (UI) · GSAP (landing) |
| Icons | Phosphor (duotone) |
| Fonts | Clash Display · Inter · JetBrains Mono (self-hosted) |
| Compute | pdf-lib, @jsquash, transformers.js, ffmpeg.wasm, SheetJS, qr-code-styling, luxon |
| Tooling | pnpm, Biome, Vitest, Playwright |
| Hosting | Cloudflare Pages |

## Decision records

Longer-form rationale for individual choices lives in `docs/adr/`:

- `0001-astro-over-nextjs.md`
- `0002-client-side-only.md`
- `0003-logic-ui-separation.md`

Add an ADR whenever a decision is load-bearing and someone might later ask "why did they do it this way?"
