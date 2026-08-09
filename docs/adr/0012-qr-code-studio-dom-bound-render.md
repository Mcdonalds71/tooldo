# ADR 0012 — QR Code Studio: rendering that can't move off the main thread

## Status
Accepted.

## Context
Every file-in tool routes its heavy work through `runInWorker`, and ADR 0011 already
established that not every tool needs one — Timezone Finder's only work is date
arithmetic cheap enough that moving it anywhere would be pure overhead. QR Code
Studio raises the same question, "does this need a Worker," but answers it for a
different reason than ADR 0011 did.

`qr-code-styling`, the library behind the live preview, doesn't compute an answer and
hand back data the way `pdf-lib` or `luxon` do. It draws: it creates a `<canvas>` or
`SVGElement` itself and paints into it directly. That drawing needs `document`. A
dedicated Web Worker has no DOM at all — no `document`, no way to create a canvas
element — and this library isn't written against `OffscreenCanvas`, which is the one
canvas API that does exist inside a Worker. There is no version of "run this in a
Worker" available here without forking the library or wrapping it in a compatibility
shim neither of which is proportionate to what this tool needs.

## Decision
**The render step runs on the main thread, same as any `<canvas>`-drawing UI would.**
`useQrPreview` owns a single `QRCodeStyling` instance and calls its `.append()` once
and `.update()` on every content or style change, exactly the way a chart library or a
canvas-based game runs — because that's what this is, structurally, not a file-
processing pipeline wearing the same shape as one. The largest QR code this tool can
produce (capped at `MAX_CONTENT_LENGTH`, engine.ts) still draws in a handful of
milliseconds; there is no frame worth protecting here even before the DOM constraint
makes the question moot.

**The library is still dynamically imported, never at module scope.** `useQrPreview`'s
effect calls `await import('qr-code-styling')` the first time there's real content to
render. A visitor who lands on the page and never types anything never pays for it —
the same bundle discipline every other tool's Worker gets, applied at the point that's
actually available here.

**Every touch of `QRCodeStyling` happens inside `useEffect`, never during the render
body.** This island is `client:load`, so its initial render is also what the static
build's server pass produces — and that pass has no `document` either. Calling
`new QRCodeStyling(...)` or `.append()` synchronously during render would either throw
during `astro build` or, if guarded, produce a hydration mismatch the moment it didn't
(the same class of bug ADR 0011 and the invoice tool's saved-profile fix both hit:
browser-only work has to happen after hydration is already reconciled, not during the
render that hydration compares against). The container `<div>` renders empty in both
environments; the code that fills it in only ever runs client-side.

## Consequences
- The suite now has three tools with no Worker, for three different reasons: Timezone
  Finder (ADR 0011, compute too cheap to bother moving), and QR Code Studio (this ADR,
  compute that structurally can't move — it needs a DOM Worker doesn't have). A future
  tool weighing this should ask which one actually applies rather than pattern-matching
  on "no Worker" as a single precedent.
- `buildQrConfig` (engine.ts) stays a pure, fully-tested function regardless — it
  returns a plain config object, and nothing about the DOM constraint above touches
  it. The line that can't be pure is `.append()`/`.update()` itself, isolated to
  `useQrPreview`, not the engine.
- A logo raises error correction to `H` automatically (`buildQrConfig`) rather than
  being a setting a visitor has to know to change — the standard compensation for a
  logo covering the code's centre, applied without asking.
- No persistence: unlike the invoice tool's saved business profile or Timezone
  Finder's shareable city list, there's no URL param or `localStorage` here. A QR
  code's content is typically copy-pasted fresh each time rather than resumed, and
  ADR 0010 and ADR 0011 both set the same bar for reaching for storage — a specific
  reason, not a default. This tool didn't have one.
