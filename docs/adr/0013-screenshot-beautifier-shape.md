# ADR 0013 — Screenshot Beautifier: a file-in tool with no `processing` step

## Status
Accepted.

## Context
Screenshot Beautifier is a file-in tool — a Dropzone, a real file, real bytes going
through a Worker — which puts it in different company from Timezone Finder and QR
Code Studio (both input-in, both covered by their own ADRs for why they have no
Worker at all). This one uses `runInWorker` exactly the way the invariant shape
describes: `OffscreenCanvas` has no `document` dependency the way `qr-code-styling`
does, so the actual compositing — background, shadow, optional browser-frame bar,
rounded-rect clip, the source image — runs off the main thread like any other tool's
heavy work.

What doesn't fit is the rest of the shape: `empty → ready → processing → result →
error`, with a distinct "converting" stage and an explicit action that produces a
finished result screen. This tool's whole point is a live preview that restyles as
you drag a slider or flip a switch — closer to Invoice Generator's live-building
preview (ADR 0010) than to the image converter's batch-and-convert flow, even though
it starts from a dropped file the way the image converter does.

## Decision
**Two states, `empty` and `ready`, not five.** `useScreenshotWorkbench` tracks a
`file: File | null` and nothing else resembling a `Stage` union. `empty` is the
Dropzone; the moment a file lands, the hook fires an immediate render and the
preview *is* the result from then on — there is no separate screen a "Convert"
button leads to, because every option change already produces one.

**Every option change re-renders, but debounced and cancellable.** `runInWorker`
spins up a fresh Worker per call by design (see the client files across every tool),
which is fine for one call per user action but wasteful for a slider mid-drag firing
dozens of times a second. The workbench debounces option-driven re-renders by 120ms
and aborts a still-in-flight render before starting the next one, via the same
`AbortController` pattern every other tool already uses for cancellation — nothing
new invented, just applied to a different trigger. The *first* render, when a file is
dropped or the sample loads, skips the debounce entirely: a visitor who just handed
over a file wants to see something immediately, not wait through a delay that exists
to protect against rapid slider drags they haven't started yet.

**`layout.ts` is pure and tested; the actual drawing in `engine.ts` isn't, and can't
be.** Same split the image tool's `imageMath.ts` versus its own `engine.ts` already
draws: canvas size, window bounds, draw position, and clamped corner radius are
ordinary arithmetic with no `OffscreenCanvas` involved, so they're tested directly.
The paint calls themselves need a real canvas, which Node doesn't have — verified
through the Playwright spec instead, against the actual rendered image (an `<img>`
whose `src` genuinely changes per render, checked directly, not assumed).

## Consequences
- A third tool now has its own reason to skip the standard file-tool machine —
  Invoice Generator (ADR 0010, no dropzone at all), and this one (a dropzone, but a
  live result with no separate processing screen). Reading the actual reason before
  assuming a new file-in tool should copy either shape stays the rule, not the
  exception it might start to look like at three examples.
- Background is five curated presets (`types.ts`), not a free colour picker the way
  QR Code Studio's foreground and background are. That tool needed exact colour
  control for brand matching and scannability; this one is choosing a backdrop, where
  a curated set stays "designed" in a way an open picker doesn't automatically.
- The browser-frame bar and the screenshot share one rounded-rect clip path rather
  than being drawn as two shapes that happen to touch, so corner radius reads as one
  window, not a bar with independently-rounded corners sitting on a separately-rounded
  image.
