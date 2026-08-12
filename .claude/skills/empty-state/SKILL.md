---
name: empty-state
description: How to build interactive, non-boring empty states for tooldo. Use whenever a tool or view has a "nothing here yet" moment — the initial dropzone state, no-results-after-filter, error states, or offline states. Trigger on "empty state", "initial state", "no results", "when there are no files", or building the idle state of any tool.
---

# Skill: empty-state

Empty states are where most tools feel dead — and where ours feel alive. Every "nothing here yet" moment is a **mini-onboarding plus a demo**, never a shrug. Use the shared `<EmptyState>` component so the polish is automatic across all nine tools. Obey `CLAUDE.md`.

## Principles

1. **Invite, don't apologize.** Never "No files yet." Instead: a headline that names the win, one line of what happens, and the action right there.
   - Bad: "No file selected."
   - Good: headline "Drop a photo to remove its background" · sub "It's erased right here in your browser — nothing gets uploaded." · the dropzone itself below.
2. **The dropzone _is_ the empty state.** For file tools the idle state and the drop target are the same element: large, friendly, gently breathing when idle, reacting on drag-over (border pulse, bg tint, icon "opens"). Never a static grey box.
3. **Show, don't tell — the "try a sample".** Every tool offers a one-click **"No file handy? Try a sample →"** that loads a bundled sample and runs the entire flow. This lets any visitor (or recruiter) see the magic instantly. This is a signature moment — include it on every tool.
4. **Animated on-brand illustration.** A small looping/animated duotone illustration themed to the tool (background-remover: subject with checkerboard dissolving in; QR: code assembling). Lightweight (SVG/Lottie). Freeze to a static frame under `prefers-reduced-motion`.
5. **One tasteful beat, not a circus.** A subtle cursor-reactive tilt, a staggered fade-in of hint text, or a rotating tip — pick one per empty state.

## The four empties every tool handles

- **Initial / idle** — the dropzone-as-empty-state above, with sample + illustration.
- **No results** — after a filter/search returns nothing: "Nothing matches 'x'." + a "Clear filters" action. Never a blank pane.
- **Error** — invalid or failed input: "That file isn't a PDF — try another." Say what happened + the next action. No raw exception strings, no first person.
- **Offline** — if a needed resource (model, engine) can't load: explain plainly + a retry. (Most tools work fully offline once cached — reflect that honestly.)

## The `<EmptyState>` component API

A single shared component, typed:
```ts
interface EmptyStateProps {
  illustration: ReactNode        // animated duotone, reduced-motion aware
  headline: string               // names the win, sentence case, verb-first
  subtext: string                // one line, plain, honest
  primaryAction: ReactNode       // usually the dropzone or main CTA
  sampleAction?: { label: string; onTry: () => void }  // "Try a sample"
  variant?: 'initial' | 'no-results' | 'error' | 'offline'
}
```
All copy follows the `ux-copy` skill's voice.

## Checklist

- [ ] Uses the shared `<EmptyState>` — not a bespoke layout.
- [ ] Headline names the win; no "no data"/"empty" phrasing.
- [ ] Dropzone breathes when idle and reacts on drag-over.
- [ ] "Try a sample" present and runs the full flow (initial variant).
- [ ] Animated illustration with a static reduced-motion fallback.
- [ ] no-results, error, and offline variants implemented where applicable.
- [ ] Fully keyboard accessible; visible focus; AA contrast.
- [ ] No hardcoded tokens, no emoji, no placeholder copy.
