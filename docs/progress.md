# Progress

The running state of the build. Read this first in a new session, then `CLAUDE.md` for
the rules. Update it at the end of a work session, not during.

## Built

**Foundation.** Astro 7 + React 19 islands, TypeScript strict, Tailwind v4, Biome,
Vitest, Playwright. CI runs typecheck, lint, unit tests, build, smoke tests and a
dependency audit on every pull request.

**Design system.** `src/design-system/tokens.css` is the spine: palette, type, spacing,
radii, shadows, motion, and per-component tokens. Components read tokens and never hold
a literal. Built so far: Button (every variant and state), Card, ToolCard, Badge, Tag,
Progress, Spinner, Dropzone, FileQueue, EmptyState, Toast, ProcessingOverlay,
ResultPanel. A style guide page renders them all at `/design-system`.

**Brand.** Logo set, favicons, manifest, OG card. Clash Display, Inter and JetBrains
Mono, self-hosted.

**Landing.** Floating glass nav capsule, editorial hero bento (headline, showcase card,
rotating stamp, promise card), footer. The showcase card reserves a stage for a tool
animation that isn't built yet.

**Deployed.** Cloudflare Workers, static assets, no Worker script in front of them.

**Tool 1, PDF Toolbox** (`/pdf`). Drop one PDF or several and every page opens as a card
on one board: drag to reorder, turn, remove, then save a new document. Merging is what
happens when you drop a second file, and trimming is what happens when you take pages
off before saving — one flow covers all four verbs. `engine.ts` is pdf-lib behind
`runInWorker`; `board.ts` holds the arrangement as plain functions; page previews come
from pdf.js on the main thread (ADR 0006). "Try a sample" draws its own six-page PDF
rather than shipping a binary. 95 unit tests, 15 Playwright specs across desktop,
mobile and reduced-motion (45 runs).

The pages land in a frosted tray with a warm glow behind it, because glass over flat
paper is just a tinted box. The dropzone's folder works the same way: ruled sheets, and
a smoked pane in front whose `backdrop-filter` blurs the half of them it covers. Both
are siblings, never nested — that is the only arrangement where the blur has anything to
work on. The counter reads pages drawn, not a percentage.

`Dropzone` grew a `size` prop for this: the compact zone under a full board is how you
merge a second file in, and it drops to a secondary action so the view keeps one
vermilion.

**The island is `client:load`, not `client:visible`.** On a route that exists only to
run this tool there is nothing to defer for, and waiting on an intersection bought a
window where the dropzone was painted but dead. Playwright is capped at two workers for
the same reason the tool is worth having: it does real work, and four browsers running a
PDF engine, pdf.js and a canvas at once take the renderer past its memory ceiling.

**The board drags by touch, not just mouse.** Native HTML5 drag-and-drop never fires
from a touch, so the board uses Motion's `useDragControls` instead, armed manually per
card rather than through Motion's own listener: a mouse press starts dragging the moment
it moves, a touch or pen press has to hold still for 180ms first (see the constants at
the top of `PageCard.tsx`), so a swipe to scroll the page never gets mistaken for the
start of a reorder. Reordering itself reads `elementFromPoint` under the pointer rather
than native `dragenter`, which touch never fires either. The arrow buttons on every card
are the same move from the keyboard, and stand in for drag anywhere it isn't available.

## Next

Tools 2 to 10, each through the `new-tool` skill. The landing page's upload animation
comes after the tools, not before — deliberately reordered from the original plan.

**Not in the PDF tool, deliberately.** Compression, because pdf-lib copies page streams
untouched and anything honest would mean re-encoding images and losing quality — the FAQ
says so plainly rather than shipping a button that saves two percent. Splitting into many
files in one pass, because that needs a zip dependency; today you save twice.

The upload animation reference is a Dribbble shot by Artem Kucherov. What we take from
it: one footprint holding both idle and working states so nothing jumps when work
starts, a container that physically receives the file, and a live counter that makes
progress feel specific to your file rather than generic. Rendered in warm glass, not the
reference's cool violet. For a PDF tool the counter reads pages, not records.

## Decisions worth knowing

Recorded properly in `docs/adr/`. The ones that catch people out:

- **Clash Display is fetched at build time, not committed.** The Fontshare licence
  forbids redistributing the files and a public repo counts. The URL lives in
  `scripts/fetch-fonts.mjs`, so nothing needs configuring anywhere. A URL is not the
  file. See `public/fonts/README.md`.
- **`'unsafe-inline'` is allowed for scripts and styles** (ADR 0004). Astro's CSP hashing
  silently kills every Radix and Motion inline style, and there is no backend to protect.
- **Astro was upgraded across two majors before tool 1** (ADR 0005). Four pages is the
  cheapest that migration will ever be.
- **`pnpm-workspace.yaml` gates install scripts.** Only listed packages may run them.
  A new dependency that wants one is a supply-chain decision, so it gets added
  deliberately.
- **Page previews are the one thing outside `runInWorker`** (ADR 0006). pdf.js ships its
  own worker and the paint needs a canvas, so the parse is still off the main thread and
  the board degrades to numbered placeholders if the chunk never lands.
- **The glass was never actually glass, sitewide, until tool 1's second pass.** Every
  frosted pane — the nav capsule, the nav flyout, both new to tool 1 — hand-wrote
  `-webkit-backdrop-filter` beside the standard `backdrop-filter` property. Lightning CSS
  collapses that pair down to the prefixed one alone on build, which Blink doesn't
  implement, so computed `backdrop-filter` was `none` everywhere and every pane was a
  flat tint you could see straight through. Fix: don't hand-write the prefix — the
  bundler adds whatever prefixes the build targets need on its own. If a future glass
  surface looks flat instead of blurred, check for a hand-written `-webkit-` prefix
  first.
- **Signal picked up a second surface step, `--color-signal-fill` / `--color-on-signal`.**
  White text on the hot `--color-signal` is 3.6:1, under the 4.5:1 small text needs, so a
  filled button can never carry a white label at the hot value. `--color-signal-fill`
  (`#de2e00`) is deep enough for white at 4.7:1. The hot step still owns what it was
  always right for — focus rings, borders, progress, the drag-over flood — anywhere
  content sits ON a signal fill, reach for the fill token and `--color-on-signal`, not
  `--color-signal` with `--color-ink`.
- **An `<img>` is natively draggable whether or not anything asks for it.** Any card or
  tile built with a custom pointer-based drag (the page board's touch reordering is the
  first case) needs `draggable={false}` on every image inside the draggable region — the
  browser's own drag-out-to-save gesture wins the pointer before app code ever sees it
  otherwise, silently breaking the drag on both mouse and touch.

## How we work

One tool per session. The repo is the context — `CLAUDE.md`, this file, and the existing
components carry everything a fresh session needs, and conversation history from a
previous tool does not help the next one.

Opus for work that sets a pattern or needs judgment. Sonnet for work that follows a
pattern that already exists.

Build the whole thing, then review it in one pass. Batched changes, not a round trip per
adjustment.
