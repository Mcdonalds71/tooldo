# CLAUDE.md — tooldo

The rulebook for this repo. Read it before every task and follow it in every file you write.
This is a **public, open-source** project and a portfolio piece. The code must read as if a small, disciplined senior team wrote it — no AI tells, no scaffolding cruft, no dead code.

If a request conflicts with these rules, stop and flag it rather than breaking the rule silently.

---

## 1. What this is

A suite of nine free, everyday utility tools (PDF, image, video, data, generators) under one brand and one design system. Everything runs **client-side in the browser** — no backend, no database, no accounts, no file uploads. Privacy is the product: *"Your files never leave your device."* That's also why every tool in the suite is pure client-side compute: a tool that depends on a third-party service at runtime is a tool that can fail for reasons this project can't fix — see [ADR 0009](docs/adr/0009-remove-background-remover.md).

## 2. Stack (do not swap without an ADR)

- **Astro 7** with **React 19 islands** — static HTML everywhere; hydrate only the interactive tool.
- **TypeScript**, `strict` mode.
- **Tailwind CSS v4** + CSS-variable design tokens.
- **Radix UI** primitives (styled with our tokens) for menus, dialogs, sliders, tabs, tooltips.
- **Motion** (`motion/react`) for UI micro-interactions; **GSAP** (+ScrollTrigger) for landing-page showpieces only.
- **Phosphor Icons** (`@phosphor-icons/react`), duotone for large/expressive, regular for inline. **Never Lucide. Never emoji in shipped UI.**
- **Zustand** only when a tool truly needs cross-component state; otherwise `useState`/`useReducer`.
- Compute libs per tool: `pdf-lib`/`pdfjs-dist`, `@jsquash/*`+`libheif`, `mediabunny`+`gifenc` ([ADR 0015](docs/adr/0015-video-compressor-webcodecs-not-ffmpeg.md) — `@ffmpeg/ffmpeg`'s core WASM binary is over 30MB, past Cloudflare Workers' 25MB per-asset limit; reach for it only if a future deploy target can actually host a file that size), a hand-written parser for CSV/JSON ([ADR 0014](docs/adr/0014-csv-json-viewer-hand-written-parser.md) — SheetJS's npm distribution is stale; reach for it only if a tool needs real spreadsheet binary formats, pulled from SheetJS's own CDN), `qr-code-styling`, `luxon`.
- Tooling: **pnpm**, **Biome** (lint+format), **Vitest** (unit), **Playwright** (smoke).
- Palette: **"paper, ink & signal"** — cream paper base (`--color-paper #f4f0e7`), near-black ink text (`--color-ink #16130d`), one hot vermilion accent (`--color-signal #ff3b14`) used sparingly (primary CTA, focus, key emphasis only). Warm lines, light-first. Full tokens in `docs/build-spec.md` §4.1.
- Fonts: self-hosted, `Clash Display` (headers, Fontshare — max weight 700) + `Inter` (UI/body) + `JetBrains Mono` (code/data). Free/OFL/Fontshare licences only.

## 3. Architecture — the rules that matter most

- **Logic ≠ UI. Always.** Every tool's real work lives in `src/tools/<tool>/engine.ts` as **pure, typed, framework-free functions**. The React island (`<Tool>.tsx`) is a thin shell that calls the engine. No file parsing, no compression, no business logic inside components.
- **Dependency direction points inward:** `tools/*` and `components/*` may import from `design-system/*` and `lib/*`, never the reverse. No circular imports.
- **One canonical way to do each thing:** one `Dropzone`, one `download()` helper, one `runInWorker()` wrapper, one toast API, one `EmptyState`. Never a second variant — reuse or extend the existing one.
- **Tool registry is the single source of truth:** `src/lib/tools.ts` defines every tool (slug, name, icon, description, category). Nav, landing grid, sitemap, and routes all derive from it. Adding a tool edits this file — never hardcode a tool list anywhere else.
- **Heavy compute runs in Web Workers** via the generic typed `runInWorker<TIn, TOut>()`. The main thread stays free for 60fps motion. Lazy-load heavy WASM (ffmpeg, models) with dynamic `import()` only when the user acts.

## 4. Design system contract

- **Design language: NEO-BRUTALISM on the warm palette.** Chunky ink borders (2.5px), hard offset shadows (zero blur, e.g. `4px 4px 0 ink`), pill shapes, bold Clash Display labels, one hot vermilion accent. High-contrast and accessible by design. This is *the* look for buttons, dropzones, tool cards, and empty states. No neumorphism, no soft blurry shadows on hero surfaces.
- **Signature interaction:** the hard shadow lifts on hover and snaps down on press (element translates onto its own shadow). Bake into the base Button/interactive components.
- **Restraint rule:** full neo-brut on hero surfaces (buttons, dropzones, cards, empty states, landing); keep dense working UI (option panels, tables, long forms) calmer — lighter borders, no hard shadows — so real work stays comfortable. Loud where it delights, quiet where it works.
- **Never hardcode a design value.** Colours, spacing, radii, font sizes, shadows, durations, easings all come from tokens (`src/design-system/tokens.css`). No `#hex`, no `16px`, no `0.25s` literals in components. If a token is missing, add it to the token file, don't inline it.
- **Light-first.** The warm paper palette is light-first; dark mode is optional/secondary for v1 (warm charcoal if added, not cool black) — don't block on it.
- **Icons:** Phosphor only, one family, tree-shaken per-icon imports. Duotone with a warm secondary tint (paper-dim / soft-ink), signal reserved for accents. No emoji, no mixed sets.
- **Buttons** read from `--btn-*` tokens (radius `999px`, height, hard shadow, hover/press translate). Variants: primary (vermilion, one per view), secondary, ink, ghost, destructive, badge, icon. Every variant defines all states: default, hover (lift), active (snap down), focus-visible (shadow flips vermilion), disabled, loading. Reference: `docs/inspiration/button-and-upload-style.html`.
- **Empty states are never empty-empty.** Use the shared `<EmptyState>` — headline that names the win, one line of context, the action inline, an animated on-brand duotone illustration, and a one-click "try a sample" where it makes sense. Also handle no-results, error, and offline empties.

## 5. Motion

- Use the motion tokens (`--ease-*`, `--dur-*`, spring presets). One easing + duration family everywhere.
- Three tiers: micro-interactions (subtle, everywhere), transitions (`AnimatePresence`, `layoutId`, Astro View Transitions), landing showpieces (GSAP, one or two big beats — restraint wins).
- Animate **only** `transform` and `opacity`.
- **Every** non-essential animation is gated by `useReducedMotion()` with an instant/opacity-only fallback. This is not optional.

## 6. Accessibility (part of "done", not a follow-up)

- Semantic HTML first. Real `<button>`/`<a>`/`<label>`, correct roles.
- Full keyboard paths; visible focus; manage focus in dialogs/drawers.
- Icon-only controls need `aria-label`; decorative icons are `aria-hidden`.
- Colour contrast meets WCAG AA. Touch targets ≥ 44px.
- Respect `prefers-reduced-motion`.

## 7. Code quality — and avoiding "AI wrote this" tells

- TS `strict` + `noUncheckedIndexedAccess`. **Zero `any`** — use `unknown` + narrowing. No `@ts-ignore` without a one-line reason.
- Small files, single responsibility. A component over ~150 lines is a smell — split it.
- Named exports; consistent import order (Biome enforces).
- **Comments explain _why_, never _what_.** Delete narrating comments, `console.log`s, `TODO`s, and unused imports/vars before committing. These are the top AI tells.
- Meaningful names — no `data2`, `tmp`, `handleClick2`, `Component1`.
- Real, specific copy everywhere — no "Lorem ipsum", no "Here is the …". Follow the `ux-copy` skill's voice: sentence case, verb-first, warm, no filler ("simply", "seamless", "unlock", "leverage").
- Real error handling: typed error states surfaced through the toast/empty system. Never a swallowed `catch {}`.
- No premature abstraction and no copy-paste duplication — extract on the third use, not the first.

## 8. Security (client-side app — still matters)

- Never `dangerouslySetInnerHTML` with user content. Let React escape. If rich content is unavoidable, sanitise with DOMPurify.
- Treat all file contents and text input as untrusted: validate type/size before processing, cap sizes, guard malformed files (zip bombs, bad PDFs), wrap parsing in try/catch so a crafted file can't hang the tab.
- Sanitise anything that becomes a download filename or URL param.
- No secrets in the repo (there are none by design). Don't add analytics/telemetry that collects file data or PII.
- Ship the security headers + tight CSP from the build spec (§15). Run the `security-check` skill before deploy.

## 9. Testing

- Every `engine.ts` has Vitest unit tests (pure functions — test them thoroughly, including edge/malformed inputs).
- Flagship tools get a Playwright smoke test: load → drop the sample file → assert an output.
- Don't mark work done with failing or skipped tests.

## 10. Git & process

- **Conventional Commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `perf:`, `a11y:`. Imperative, lower-case, scoped where useful (`feat(pdf): …`).
- Small, atomic commits and PRs. The git history is part of the portfolio — keep it clean and legible.
- CI (typecheck + lint + unit tests + build) must pass before merge. Never push directly to `main`.
- Run the `pre-commit` skill before every commit.

## 11. Definition of done for a tool

A tool is done only when it has: a pure tested `engine.ts`; a thin island built from design-system components; an `.astro` page with SEO metadata (title/meta/OG/JSON-LD); a registry entry in `lib/tools.ts`; an interactive empty state with a sample file; full keyboard + reduced-motion support; passing unit + smoke tests; and no lint errors, dead code, or hardcoded tokens. **Use the `new-tool` skill for every tool so the bar is identical across all nine.**

## 12. Commands

```
pnpm dev            # local dev
pnpm build          # production build
pnpm preview        # preview the build
pnpm test           # vitest unit tests
pnpm test:e2e       # playwright smoke tests
pnpm lint           # biome check
pnpm typecheck      # tsc --noEmit
```

## 13. Available project skills (`.claude/skills/`)

Invoke the matching skill for the job instead of improvising:
`new-tool` · `design-system` · `empty-state` · `animation` · `ux-copy` · `pre-commit` · `security-check`.

## 14. Where the project is

Read [`docs/progress.md`](docs/progress.md) first in a new session. It carries what is
built, what is next, and the decisions that aren't obvious from the code.

- **Repo:** https://github.com/Mcdonalds71/tooldo (public, MIT)
- **Live:** https://tooldo.emmanuelonugwu-c.workers.dev — Cloudflare Workers, builds from
  `main` on push. `tooldo.online` is not connected yet.
- **Deploy setup:** [`docs/deploy.md`](docs/deploy.md). Nothing needs configuring per
  environment; the build is self-contained.

### Glass, and where it is allowed

The nav capsule is frosted glass, and the tokens for it already exist
(`--glass-tint`, `--glass-blur`, `--glass-saturate`, `--glass-gradient`,
`--glass-sheen`). Glass is also the intended look for **illustrations** — the folder in
a dropzone, the artwork in an empty state.

The line is chrome versus artwork. Anything the user operates — button, dropzone,
card, panel — stays neo-brutalist: ink border, hard zero-blur shadow. Anything that is
purely drawn can be soft, blurred and glassy, because it isn't a control and never
needs a hit target or a focus ring. Glass artwork inside a neo-brut frame is the
combination; a glass button is not.

Warm it to the palette. Reference shots for this look are cool violet and grey; ours
mixes from `--color-paper`, `--color-card` and `--color-signal`. Cool glass on warm
paper reads as a component borrowed from another product.

An element with `backdrop-filter` becomes its own backdrop root, so nested glass cannot
blur the page behind it. Keep glass layers as siblings.
