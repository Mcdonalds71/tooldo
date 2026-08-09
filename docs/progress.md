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

**Tool 3 was Background Remover, and it was removed.** It shipped, passed every
automated check the suite has, and then failed in production for a real visitor,
reproducibly, on two unrelated networks — traced to Hugging Face's CDN caching an error
per edge node and serving it regardless of the visitor's own connection, not anything
local. A retry-with-backoff mitigation shipped and deployed cleanly but didn't resolve
it: tested directly against the failure after that fix was live, it still failed
identically. The suite's whole premise is ten — now nine — small, self-contained tools
that work offline after the first load; the one tool that needed a third-party model
host at runtime was the one tool that could fail for a reason nothing in this codebase
controls. Removed rather than escalated into hosting the model file on infrastructure
tooldo would have to operate itself. Full history — the model architecture debugging
that's still a good read for any future tool considering WASM inference, and the CDN
investigation that diagnosed the production failure precisely rather than guessing at
it — in ADR 0008. The removal decision itself is ADR 0009.

**Tool 4, Invoice Generator** (`/invoice`). Fill in business and client details and a
table of line items, watch a real invoice build in the pane beside the form as you
type, download it as a PDF. The suite's first input-in tool — no Dropzone, nothing to
drop — and the first with a live preview that updates on every keystroke rather than a
result revealed after a separate run step. `engine.ts` splits cleanly: `calculateTotals`
is pure and cheap enough to call directly on the main thread for the live preview, and
the exact same function is what the worker-side `pdf-lib` routine (`pdfLayout.ts`) calls
for the real PDF — one source of truth, so the preview and the download can never
disagree about a number. 13 unit tests, 5 Playwright specs including one that types into
a field and asserts the preview updates immediately.

Business details (name, address, contact info, logo) are remembered in `localStorage`
between visits — the suite's first tool to persist anything, deliberately narrow in
scope and not a precedent for the other nine. Client details and line items are never
saved. Full reasoning, including why the state machine and the responsive layout both
depart from the file-tool template on purpose, in ADR 0010.

Two new design-system components came out of the form: `TextField` and `TextAreaField`,
reading a new calm-register `--field-*` token set rather than the existing (unused)
hero-register `--input-*` tokens — the same `brut`/`calm` split `Card` already draws for
dense working UI. The live preview itself is `Card tone="brut"`, on purpose: it's this
tool's delight moment, not part of the dense form around it.

**A currency picker followed almost immediately, and it's why `formatMoney` renders a
code, not a symbol.** `$` and `£` are each shared by several currencies in the twenty-
option list, which makes a bare symbol genuinely ambiguous on an invoice meant for
someone else to read — and separately, a few symbols the list needs (₦, ₹) fall outside
the WinAnsi encoding `pdfLayout.ts`'s Helvetica font supports, so drawing them directly
would have thrown inside the worker. `Intl.NumberFormat` with `currencyDisplay: 'code'`
solves both at once and gets each currency's own decimal convention right for free —
confirmed live: JPY shows no cents, USD shows two, without either being special-cased.
A third new design-system component, `SelectField`, is a native `<select>` in the same
calm register as the text fields — full keyboard and screen-reader behaviour without
hand-building a listbox.

**Two real bugs shipped in the first pass and were caught from real use, not review.**
Line items had no gap between rows (`.line-items` set `gap` on the wrong element — the
outer wrapper, not the `<ul>` the rows actually live in) and the live preview overflowed
a real phone's width. The second one was a textbook flex/grid trap: `1fr` tracks and
flex children don't shrink below their content's natural width unless told to, so a
long address or a fixed-content table pushed the whole card wider than the screen. The
fix is `min-width: 0` on the panes and the row that needed to shrink, `minmax(0, 1fr)`
instead of a bare `1fr` on the desktop grid, and a phone-specific breakpoint (28rem,
narrower than the tool's own edit/preview breakpoint) that stacks the header and backs
off the padding. Confirmed after the fix with real numbers, not just a visual check: a
375px viewport now measures zero horizontal overflow, and consecutive line-item rows
sit exactly one `--space-sm` apart.

**Tool 5, Timezone Finder** (`/timezones`). Add cities, drag one shared time control,
watch every city's clock and day-or-night strip update live at once — the same
delight `luxon` makes cheap enough to do on every keystroke, not once per run. The
suite's first tool with no Worker anywhere in it: every other tool routes real work
off the main thread because the work is heavy, and this tool's only work is date
arithmetic sub-millisecond regardless of how many cities are on screen, so there was
never anything here that needed to leave the main thread. Full reasoning in ADR 0011.

Selected cities live in two places for two different reasons: the URL (shareable — a
comparison sent as a link shows the same cities to whoever opens it, no account, no
sync) and `localStorage` (convenient — a solo return visit picks up where it left
off). The URL wins when both are present. A fresh visit with neither isn't actually
blank: the visitor's own timezone is detected and added as the first row, a real fact
about them rather than a guessed default.

**A real bug surfaced by checking the expected test values before writing them down,
not by the test that would have passed either way.** The first version of the
day-offset calculation (which city reads "Yesterday" versus "Tomorrow") computed how
many hours apart two zones' midnights were and divided by twenty-four — which breaks
exactly for the cities this tool exists to compare: a Tokyo viewer at their own
midnight watches Los Angeles read the previous afternoon, seven hours away in
absolute time but a full calendar day back, and the elapsed-time approach called that
the same day. Comparing the two dates' plain year/month/day instead, with the zone
stripped out entirely, gets it right regardless of how far apart the offsets are. A
test written against the original, wrong assumption would have passed just as
cleanly — it was only caught by verifying the expected numbers independently first.

111 curated cities across every region (`cities.ts`), not the full ~400-zone IANA
list — checked for slug collisions and real zone resolution, not assumed correct. 21
unit tests, 4 Playwright specs including one that presses arrow keys on the shared
time control and asserts every city's clock actually changes.

**Tool 6, QR Code Studio** (`/qr`). Type a link or message and a styled QR code
builds live in the preview as you type or adjust the style panel — colours, dot
shape, corner shape, an optional logo dropped into the centre. Download as PNG or
SVG. The suite's second tool with no Worker, for a different reason than Timezone
Finder's: `qr-code-styling` draws straight into a `<canvas>`/`SVGElement` it creates
itself, which needs `document` — a Worker has no DOM at all, so there's no version of
this that could move off the main thread even if the drawing were expensive, which it
isn't. Full reasoning in ADR 0012.

A logo covers the centre of the code, so adding one raises error correction to the
library's highest level automatically (`engine.ts`) — the standard fix for a partly
obscured code, applied without needing a visitor to know to ask for it. No
persistence: unlike the invoice tool's saved profile or Timezone Finder's shareable
URL, there's no `localStorage` or query param here — a QR code's content is normally
typed fresh each time, not resumed, and ADR 0010 and ADR 0011 both set the bar for
reaching for storage at "this tool has its own reason," which this one didn't clear.

**Tool 7, Screenshot Beautifier** (`/screenshot`). Drop a screenshot and it styles
live as you adjust the panel — a background (five curated presets, solid or
gradient), padding, rounded corners, a drop shadow, an optional browser-frame bar
with its own traffic lights. Download the finished PNG. Back to a proper Worker
after two tools in a row without one: `OffscreenCanvas` has no `document`
dependency, so the actual compositing runs off the main thread the ordinary way,
the same `runInWorker` every file-in tool already uses.

The workbench itself still isn't the standard five-stage machine — `empty` and
`ready` are the only two states, because the live preview *is* the result the whole
time, not a screen a "Convert" button leads to. Every option change re-renders, but
debounced 120ms and cancelled via the same `AbortController` pattern every tool's
cancel button already uses, so a slider mid-drag doesn't spin up a dozen Workers a
second for nine of which the answer's already stale. The very first render, from a
drop or the sample, skips the debounce — nothing to protect against yet. Full
reasoning in ADR 0013, which also covers why `layout.ts`'s canvas math is pure and
tested while the actual paint calls in `engine.ts` aren't and structurally can't be,
the same split the image tool already draws between `imageMath.ts` and its own
`engine.ts`.

The sample is drawn, not shipped — a plain mock dashboard, deliberately unstyled
going in, since demonstrating the styling is the tool's whole job.

**Tool 8, Text Toolbox** (`/text`) — the suite's first `Data & text` tool, and the
first with two real modes under one shared toolbar. Edit: live counts, a set of
cleanup toggles (trim lines, collapse spaces, collapse blank lines, trim the whole
text's edges), a case converter, and a live result field, all recomputed with a
plain `useMemo` on every keystroke. Compare: two text areas and a genuine line-level
diff — added, removed, and unchanged lines, not a same-or-different flag — with a
count of each. No Worker anywhere, confirmed rather than assumed: every operation
here, the diff included at its capped size, is a synchronous string or array op
finishing in a millisecond or two, the same reading ADR 0011 already gives the rest
of the suite, not a new reason.

The diff is a classic LCS backtrack, the standard textbook approach, written out with
explicit `undefined` checks at every index rather than non-null assertions —
`noUncheckedIndexedAccess` means the loop bounds alone don't prove safety to the
compiler, and the checks double as documentation of which side advanced and why. 27
unit tests, including the cases worth getting right on purpose rather than by luck:
identical text, completely different text, an empty side, a pure insertion, a pure
deletion, and interleaved changes — all passed first try, which is the result you
want from writing the tests before trusting the algorithm, not a reason to have
skipped them.

UPPERCASE, lowercase, Title Case, and Sentence case all preserve the original line
breaks, reading the text as prose. camelCase, snake_case, and kebab-case collapse it
to one line, reading the text as a single identifier — that's inherent to what those
conventions mean, not an inconsistency, and the FAQ says so. The word tokenizer also
splits on existing camelCase/snake_case/kebab-case boundaries, so converting *between*
conventions works, not only converting away from plain prose.

**Tool 9, CSV / JSON Viewer** (`/csv`). Drop a CSV or JSON file, read it as a
sortable table, download it back out as either format. `CLAUDE.md` names SheetJS for
this category, and before reaching for it: `npm view xlsx time` shows the npm
registry's last publish was 2022-03-24 — SheetJS kept developing, just moved the
actively maintained build to their own CDN rather than npm. CSV and JSON don't need
SheetJS's real value (XLS/XLSX binary formats), so this tool is a hand-written parser
instead — no new dependency, and every line of it unit-tested rather than partly
trusting a stale third party's internals. Full reasoning in ADR 0014, which also
notes where the line is: a future tool that actually needs to read a `.xlsx` file's
binary structure should reach for SheetJS's current CDN build, not revive the npm one.

The CSV parser is a character-by-character state machine, not a comma split — a
split breaks the moment a quoted field contains the delimiter or a newline, which
real exports do constantly. Duplicate or empty header cells get disambiguated
(`Column 2`, `Name (2)`) before becoming object keys, since a plain `Record` would
otherwise silently drop every column but the last one sharing a name. JSON normalizes
whatever shape it legally is into the same table — an array of objects directly,
a single object as one row, primitives wrapped into a `value` column, and objects
that don't share every key taking the union of all keys seen, leaving gaps blank
rather than rejecting real-world, non-uniform data.

No separate `ready` stage in the workbench, the same reasoning ADR 0013 gave
Screenshot Beautifier — there's no option panel to fill in before parsing starts, so
a drop goes straight to `processing`. Column sorting is a plain client-side re-order
of already-parsed rows (numeric-looking columns sort as numbers, not lexicographically
— "10" doesn't come before "2"), never a reason to touch the Worker a second time.

## Next

The rest of the `planned` roster in `lib/tools.ts`, each through the `new-tool` skill.
The landing page's upload animation comes after the tools, not before — deliberately
reordered from the original plan.

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
  `public/_headers` at all. Every future WASM codec (video's ffmpeg.wasm included)
  already has what it needs; this wasn't a per-tool fix.
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
- **pnpm 11 stopped reading the `"pnpm"` field in `package.json`.** An `overrides` block
  placed there is silently ignored — a warning names the field, but nothing fails loudly.
  Config that used to live in `package.json` now belongs in `pnpm-workspace.yaml`, which
  this repo already had one for; the override joined it there instead of a second file.
- **Background Remover was removed** (ADR 0009, supersedes ADR 0008). A production CDN
  reliability problem outside tooldo's control, not fixable by a retry, on the suite's
  only tool with a runtime dependency on a service it doesn't operate. If `connect-src`
  in `public/_headers` or a Hugging Face reference turns up somewhere, it's a leftover to
  clean up, not something to build around.
- **Not every tool fits the file-in template, and Invoice Generator is where that first
  mattered** (ADR 0010). A form with a live preview needs its own state shape, its own
  empty-state answer, and — deliberately, narrowly — the suite's first `localStorage`
  use. Read it before assuming the next input-in tool should copy the file-tool pattern,
  or that `localStorage` is now fair game elsewhere without the same reasoning.
- **Not every tool needs a Worker, and Timezone Finder is where that first mattered**
  (ADR 0011). The rule is "heavy compute runs in a Worker," not "every tool has one" —
  this tool's only work is sub-millisecond date arithmetic, so there was nothing to move
  off the main thread. Also the second (and independently-argued) use of `localStorage`,
  paired here with a shareable URL that takes precedence over it on load.
- **Comparing elapsed time between two zones' midnights is not the same question as
  comparing their calendar dates**, and conflating the two silently breaks exactly the
  cities furthest apart — the ones a timezone tool exists for. Caught before it became a
  bug baked into a passing test, by checking the expected numbers independently first.
  See ADR 0011 if a future date calculation needs the same "which day is it there"
  answer.
- **Reading `localStorage` inside a `useState` lazy initializer is a real, live
  hydration bug, not a theoretical one — it shipped in the invoice tool and was caught
  only by checking a fresh browser tab against the production build, not by the test
  suite.** The static build's server pass has no `localStorage`; a returning visitor's
  browser does; React silently discards and rebuilds the mismatched tree, which costs
  a frame and logs an error every single visit. Fixed the same way ADR 0011 frames it:
  start from the deterministic empty value on the first render, load the real one in a
  mount effect. Any future `useState(() => readsSomethingBrowserOnly())` is this bug
  until proven otherwise.
- **Not every tool that skips the Worker skips it for the same reason** (ADR 0012).
  QR Code Studio has no Worker either, but not because the work is cheap like Timezone
  Finder's (ADR 0011) — `qr-code-styling` draws into a canvas it creates itself, which
  needs `document`, which a Worker doesn't have. Two tools, same absence, different
  cause; read the actual ADR before assuming which one applies to a third.
- **A file-in tool doesn't automatically mean the five-stage machine** (ADR 0013).
  Screenshot Beautifier drops a file through a real Worker like the image and PDF
  tools, but the standard `processing`/`result` split assumes a one-shot action with
  a finished screen at the end — this tool's preview *is* the result, continuously,
  the same shape problem Invoice Generator's live preview had (ADR 0010) wearing a
  dropzone instead of a form. Three tools now have their own reason to deviate from
  one of the suite's two standard shapes; check which reason actually applies before
  a fourth copies either one by default.
- **Text Toolbox has no Worker for the plain ADR 0011 reason, not a new one.** Worth
  noting precisely because it's the boring case — the third tool now without a
  Worker, and the first one where "the work is too cheap to move" is genuinely all
  there is to say about it, no DOM dependency (ADR 0012) or state-machine wrinkle
  (ADR 0013) layered on top. Not every deviation needs its own ADR; this one just
  needed checking, which is the actual habit worth keeping.
- **`CLAUDE.md`'s stack list named SheetJS; the CSV/JSON tool doesn't use it**
  (ADR 0014). Checking what `pnpm add xlsx` would actually pull in — the npm
  registry's last publish, from 2022 — is what caught this before it shipped, not a
  hunch. A hand-written parser isn't a shortcut here; it's the more disciplined
  choice; read the ADR before assuming the stack list itself is still current for
  every entry in it.

## How we work

One tool per session. The repo is the context — `CLAUDE.md`, this file, and the existing
components carry everything a fresh session needs, and conversation history from a
previous tool does not help the next one.

Opus for work that sets a pattern or needs judgment. Sonnet for work that follows a
pattern that already exists.

Build the whole thing, then review it in one pass. Batched changes, not a round trip per
adjustment.
