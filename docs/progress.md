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

**Tool 2, Image Converter** (`/images`). Drop PNG, JPEG, WebP, AVIF, or HEIC photos —
batch, format, resize, and compress in one flow, then download each on its own or the
whole batch as one zip. `engine.ts` decodes with the browser's own `createImageBitmap`
for everything except HEIC, which nothing decodes natively; `heic-to`'s WASM build
handles that one case. PNG encodes through native canvas (lossless, no quality curve to
reason about); JPEG, WebP and AVIF go through `@jsquash/*`'s WASM encoders instead of
relying on each browser's own — the point of "compress to a target size" is a
predictable quality-to-size curve, and three different native encoders would each give a
different answer for the same input. `imageMath.ts` holds the pure, fully-tested pieces
— resize-to-fit math and the target-size binary search — separately from the
browser-only decode/encode orchestration in `engine.ts`, which only Playwright can
verify (no canvas or WebAssembly in Vitest's Node environment). 107 unit tests, 21
Playwright specs across desktop, mobile and reduced-motion (63 runs).

Three new design-system primitives came out of the option panel: `Slider`, `Segmented`
and `Switch`, all Radix underneath. `Segmented` started on `@radix-ui/react-toggle-group`
and moved to `@radix-ui/react-radio-group` mid-build — the toggle group exposes
`role="radio"` in single-select mode but doesn't select on arrow key, only on Space/Enter
after arrowing there, which native radio groups do automatically. Caught by actually
driving it with a keyboard, not by reading the type signature.

**Not in the Image Converter, deliberately.** PNG compression beyond resizing — a
lossless format doesn't have a quality dial, so "shrink a PNG" honestly means resize or
convert it to something lossy, and the FAQ says so. A resize mode besides "cap the
longest side" — width/height fields would double the option panel for a case bulk
conversion rarely needs.

**Tool 3, Background Remover** (`/background`). Drop a photo, get back a transparent
PNG — an on-device AI model (ormbg, Apache-2.0) finds the subject and cuts around it,
general-purpose rather than portrait-only. This is the first tool with any network
dependency at all: the model (`onnx-community/ormbg-ONNX`, ~40 MB quantized) is a
public, cacheable file fetched once from Hugging Face, never anything of the visitor's.
The photo itself still never leaves the tab. `connect-src` widened to `huggingface.co`
and `*.hf.co` for exactly that fetch — see ADR 0008 and the CSP comment in
`public/_headers`.

**The model that shipped isn't the model that was first chosen, and the reason why is
the most important thing this tool taught.** BiRefNet (MIT, strong quality, general-
purpose) looked right on every axis that typecheck and unit tests can see — correct
license, correct pipeline API, loads fine, starts running. It only failed where none of
that checks: the forward pass itself, `std::bad_alloc` out of onnxruntime-web,
reproduced consistently on real hardware and immune to every configuration knob tried
against it (fp32 instead of fp16, the memory arena on and off). The actual cause is
architectural — BiRefNet's transformer encoder has activation memory that scales with
image resolution in a way WASM's 32-bit contiguous-memory model can't reliably serve,
independently confirmed by another developer's public account of hitting the identical
crash with the identical model. `onnx-community/ormbg-ONNX` is IS-Net — a plain
convolutional architecture with none of that scaling — and the identical test that
reliably crashed BiRefNet completed cleanly against it, repeatedly, verified with a real
downloaded-and-compared output file, not just a state transition in the UI. Full story
in ADR 0008. The lesson stated there plainly: a model needing WASM inference has to be
verified by actually running the forward pass on ordinary hardware before the
integration counts as done — nothing short of that would have caught this one.

Along the way, two smaller real bugs surfaced the same way — by running the tool in a
browser, not by reading the API. WebGPU throws on BiRefNet's shader (17 storage buffers
against a 16 default limit); the pipeline asks for `device: 'wasm'` only, and that
choice carried over to ormbg since WASM was already proven reliable. Separately,
onnxruntime-web fetches its own WASM runtime from jsDelivr's CDN by default — a second
third-party host with nothing to do with the model — so `scripts/copy-onnx-runtime.mjs`
copies the six files it actually needs from the already-resolved dependency into
`public/ort/` at install time instead.

**A second worker shape.** Every other tool's compute is a `runInWorker` call: spin up
a worker, run one task, terminate it. Wrong here — the model is a load worth keeping
resident, not something to repeat per photo in a batch. `worker.ts` is a persistent
worker instead, created once and kept alive for the whole session; `engine.ts`'s loaded
pipeline lives in its module scope across every call. The unrelated stateless half — the
sample image, zipping — still goes through the ordinary ephemeral worker. Full reasoning
in ADR 0008.

Typecheck, lint, all 112 unit tests, and the Playwright specs pass, including the one
that downloads the real model and asserts a real transparent PNG comes back.

**The model download is a hard dependency, and the failure it produces is the one worth
designing for.** Every other tool in the suite makes zero network requests, so this is
the first place a dropped connection can break a run — and it did, repeatedly, while
this tool was being built: `net::ERR_NAME_NOT_RESOLVED` on `huggingface.co`, with Node's
own `dns.resolve4` failing `ESERVFAIL` against the same host minutes apart. That cost
real time to diagnose, mostly because the tool said the wrong thing about it. A model
that won't download now stops the batch immediately and says
"Couldn't download the background remover — check your connection", instead of marching
through the queue marking every photo failed and suggesting a different photo — which
pointed at the one thing that was never the problem. `e2e/background.spec.ts` covers it
by aborting the Hugging Face route, so that path is tested without needing a network at
all: it's the fastest spec in the file precisely because it never leaves the machine.

The related trap, fixed at the same time: the loaded model was memoized as a promise,
so a *rejected* load got cached too and "Try again" would replay the original failure
forever on a connection that had since recovered. A failed load now clears itself.

## Next

Tools 4 to 10, each through the `new-tool` skill. The landing page's upload animation
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
- **WebAssembly needed its own CSP keyword, and nothing before tool 2 had noticed**
  (ADR 0007). `script-src` had neither `'unsafe-eval'` nor `'wasm-unsafe-eval'`, and
  Chrome refuses `WebAssembly.instantiate()` without the latter — invisible until the
  real header was actually enforced in a browser, since `astro preview` never sends
  `public/_headers` at all. Every future WASM codec (video, background removal) already
  has what it needs; this wasn't a per-tool fix.
- **A download that waits on a worker first can silently fail.** Chrome only honours a
  programmatic `<a download>` click while the triggering user gesture is still "fresh" —
  `await` a Worker round trip before calling `download()` and the click can do nothing,
  with no error and no console output. The per-item downloads in both tools call
  `download()` synchronously inside their own click handler and are unaffected; the zip
  button is two clicks for exactly this reason — prepare, then a second, genuinely fresh
  click to save. Confirmed by reproducing the silent failure directly, not inferred from
  a spec.
- **A ZIP's mtime field only encodes 1980–2099.** Setting it to the Unix epoch for
  privacy (stripping the exact conversion time from the download) throws inside `fflate`
  — DOS timestamps predate 1970 having a representation. `1980-01-01` is the earliest
  valid date and keeps the same intent.
- **`workers: 2` in `playwright.config.ts` isn't a full fix for cross-project timing
  flakiness, and dropping to 1 doesn't buy determinism either.** The PDF board's
  mouse-drag test is intermittent specifically on the `mobile` project, specifically when
  all three projects run together — reliable alone, reliable within any one project's
  full run, occasional only under full-suite concurrency. That's Chromium's own input
  classification on a touch-emulated device reacting to system load, not a resource knob
  this repo controls, which is what `retries` on CI exists to absorb.
- **A hard, non-optional dependency isn't the same as a dependency you actually need**
  (ADR 0008). `@huggingface/transformers` declares `onnxruntime-node` — a multi-platform
  native binary bundle for its Node.js code path — as a regular dependency, not an
  optional one, so `pnpm install` tries to fetch it regardless of whether a browser
  bundle will ever import that path. It repeatedly timed out fetching in this
  environment and would have bought nothing even on success.
  `pnpm-workspace.yaml`'s `overrides` redirects it to a local stub
  (`scripts/stubs/onnxruntime-node`) that throws if anything ever actually imports it.
- **pnpm 11 stopped reading the `"pnpm"` field in `package.json`.** An `overrides` block
  placed there is silently ignored — a warning names the field, but nothing fails loudly.
  Config that used to live in `package.json` now belongs in `pnpm-workspace.yaml`, which
  this repo already had one for; the override joined it there instead of a second file.
- **A model's own choice of accelerator can be wrong even when the API accepted it
  without complaint.** BiRefNet's WebGPU path compiles and runs — it just throws
  `Too many storage buffers in shader` on ordinary hardware the moment it executes,
  because the shader needs 17 storage buffers against the platform's default limit of
  16. Nothing about the pipeline API surfaces that until you actually run it. WASM has
  no such ceiling, so that's the only device this pipeline asks for. See ADR 0008.

## How we work

One tool per session. The repo is the context — `CLAUDE.md`, this file, and the existing
components carry everything a fresh session needs, and conversation history from a
previous tool does not help the next one.

Opus for work that sets a pattern or needs judgment. Sonnet for work that follows a
pattern that already exists.

Build the whole thing, then review it in one pass. Batched changes, not a round trip per
adjustment.
