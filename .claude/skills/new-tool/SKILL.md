---
name: new-tool
description: The end-to-end recipe for adding a tool to tooldo. Use whenever creating a new tool in the suite (PDF, image, video, data, generator, etc.) so every tool ships to the same senior bar — pure tested engine, thin island from the design system, SEO'd page, registry entry, interactive empty state, a11y, and tests. Trigger on "add a tool", "new tool", "build the <name> tool", or scaffolding any /<slug> utility.
---

# Skill: new-tool

Adds one tool to the suite. Follow every step in order. The point is that all nine tools are **structurally identical** — same shape, same quality — so the suite reads as one designed system. Obey `CLAUDE.md` throughout.

## Before you start

Confirm these inputs (ask if missing):
- **Slug** (route): `/<slug>` — kebab-case, matches the registry.
- **Name** + **one-line description** (verb-first, sentence case).
- **Category** for the nav: Documents · Images & photo · Media & utilities · Data & text · Generators.
- **Phosphor icon** name + a brand tint.
- **Compute library** (e.g. `pdf-lib`, `@jsquash/*`, `ffmpeg.wasm`, `SheetJS`).
- **The core operations** the tool performs.
- Whether it's **file-in** (needs Dropzone + queue) or **input-in** (form/text).

## The invariant shape

Every tool is: **Dropzone/Input → Options → Run in a Worker (with progress) → Result (preview + download / download-all-zip).** Never deviate from this flow; it's what makes the second tool feel like the tenth.

## Steps

### 1. Engine first — pure, typed, tested (`src/tools/<slug>/engine.ts`)
- Pure functions only. **No React, no DOM, no globals.** Inputs and outputs fully typed in `types.ts`.
- All heavy work is here so it can run in a Worker and be unit-tested.
- Handle malformed/edge inputs explicitly; throw typed errors, never generic strings.
- Example surface:
  ```ts
  export interface RunInput { files: File[]; options: <ToolOptions> }
  export interface RunResult { outputs: OutputFile[]; stats: RunStats }
  export async function run(input: RunInput, onProgress?: (p: number) => void): Promise<RunResult>
  ```

### 2. Unit tests (`src/tools/<slug>/engine.test.ts`)
- Vitest. Cover the happy path, boundaries (empty, huge, wrong type), and at least one malformed-input case.
- Tests must pass before moving on.

### 3. Worker wiring
- Run the engine through the shared `runInWorker<TIn, TOut>()` helper (`src/lib/worker.ts`). Do not spawn ad-hoc workers.
- Lazy-load heavy WASM (ffmpeg, models, codecs) with dynamic `import()` **inside** the worker, only when `run` is first called — never at module top level.
- Surface progress to the UI via the `onProgress` callback.

### 4. The island (`src/tools/<slug>/<Name>Tool.tsx`)
- A **thin shell** — orchestrates state and calls the engine via the worker. No business logic here.
- Compose entirely from design-system components: `Dropzone`, `FileQueue`, `OptionPanel`, `ProcessingOverlay`, `ResultPanel`, `EmptyState`, `Button`, etc. Never hand-roll one that already exists.
- State machine: `empty → ready → processing → result → error`. Each state renders the matching shared component.
- Micro-interactions per the `animation` skill; all gated by `useReducedMotion()`.
- No hardcoded tokens — colours/space/radius/motion all from tokens.

### 5. Interactive empty state (use the `empty-state` skill)
- The Dropzone **is** the empty state: idle-breathe, drag-over reaction, headline that names the win, one line of context, action inline.
- Include a one-click **"Try a sample"** that loads a bundled sample file and runs the full flow.
- Add an animated on-brand duotone illustration (reduced-motion → static frame).
- Also implement the error empty ("That file isn't a <type> — try another") and, where relevant, no-results/offline empties.

### 6. The page (`src/pages/<slug>.astro`)
- Wrap in `<ToolLayout>`; mount the island with `client:visible`.
- SEO metadata: unique `<title>`, meta description, OpenGraph tags, and JSON-LD `SoftwareApplication` structured data.
- Add a short, genuinely useful "How it works" / FAQ block below the tool (this is the search traffic).
- Include the privacy badge — a Phosphor `Lock` icon plus "Runs in your browser · nothing uploaded", never an emoji — and the "back to all tools" link (both come from `ToolLayout`).

### 7. Register the tool (`src/lib/tools.ts`)
- Add one entry: `{ slug, name, description, category, icon, brandTint }`.
- This automatically wires it into the nav dropdown, landing grid, and sitemap. **Do not** add it to any other list manually.

### 8. Smoke test (`e2e/<slug>.spec.ts`)
- Playwright: load `/<slug>`, click "Try a sample", assert a downloadable result appears.

### 9. Verify against the Definition of Done
Before you call it finished, confirm all of:
- [ ] `engine.ts` is pure and fully typed; `engine.test.ts` passes.
- [ ] Heavy deps are lazy-loaded in a Worker; UI never blocks.
- [ ] Island uses only design-system components; no hardcoded tokens.
- [ ] Interactive empty state + "try a sample" + error empty implemented.
- [ ] `.astro` page has title/meta/OG/JSON-LD + FAQ block.
- [ ] Registry entry added; nav/grid/sitemap pick it up automatically.
- [ ] Full keyboard support, visible focus, `prefers-reduced-motion` respected, AA contrast.
- [ ] Playwright smoke test passes.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` clean.
- [ ] No `console.log`, dead code, unused imports, narrating comments, `any`, or emoji.
- [ ] Copy follows the `ux-copy` voice.

### 10. Commit
- Conventional Commits, scoped: `feat(<slug>): add <name> tool`. Keep it atomic (engine+tests can be a separate commit from UI if cleaner).
- Run the `pre-commit` skill first.

## Anti-patterns (reject these)
- Logic living in the component instead of the engine.
- A bespoke dropzone/button/empty-state when a shared one exists.
- Hardcoded hex/px/duration values.
- Heavy library imported at module top level (kills the bundle).
- Emoji or Lucide icons in the UI.
- Placeholder/lorem copy, narrating comments, leftover `console.log`.
- A tool list hardcoded anywhere other than `lib/tools.ts`.
