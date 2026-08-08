# ADR 0010 — Invoice Generator: a second tool shape

## Status
Accepted.

## Context
Every tool so far is file-in: drop something, run an operation, get a result. Invoice
Generator is the suite's first input-in tool — there's nothing to drop, only a form —
and the brief asked for something file-in tools don't need at all: a live preview of
the actual document building in real time as you type, not a result revealed after a
separate run step.

## Decision
**No Dropzone, no `empty` gate.** The form and the live preview are both on screen from
the first render. "Try a sample" fills the form with realistic data instead of loading a
sample file — the same show-don't-tell principle the other tools' sample buttons follow,
adapted to a shape with nothing to load.

**The live preview is not a live PDF.** `InvoicePreview.tsx` is a plain React component
that renders styled HTML from the current form state — a cheap DOM update on every
keystroke, not a `pdf-lib` re-run. The actual PDF (`pdfLayout.ts`, drawn with `pdf-lib`)
is only ever built once, when Download is pressed, inside the worker. Both the preview
and the PDF call the exact same `calculateTotals` — one pure function, called from two
places — which is what guarantees they can never disagree about a total.

**State is simpler than the file-tool machine.** `empty → ready → processing → result →
error` doesn't fit a tool with nothing to be empty of and no separate result to reveal —
the visitor has been looking at the finished-looking invoice the whole time. The hook
tracks only whether a download is in flight; the Download button itself carries the
loading state (`Button`'s own `loading` prop) rather than a `ProcessingOverlay` taking
over a screen that has nothing new to show.

**Business details persist in `localStorage` — deliberately, and deliberately narrow.**
Name, address, contact info, and logo are the one thing worth remembering across
visits, because unlike a photo or a PDF, the same business sends more than one invoice.
Client details and line items are never saved — they're different every time by
definition. A visible "Clear saved details" control is the undo. This is the suite's
first tool to remember anything between visits; it does not set a precedent for the
other nine, which stay exactly as stateless as they are today. A future tool reaching
for the same pattern needs its own version of this paragraph's reasoning, not a copy of
this one.

**Desktop splits the view; mobile can't, so it doesn't pretend to.** Wide enough, form
and preview sit side by side, live, permanently — the point of the feature. Below that,
a `Segmented` toggle switches between them; both panes stay mounted the whole time and
CSS alone decides which one shows, so neither loses state or hydration switching back
and forth.

**Two new calm-register field components.** `tokens.css` already had `--input-*` tokens
for a pill-shaped, hard-shadow hero treatment, but a form with a dozen fields is exactly
the "dense working UI" the restraint rule asks to keep quiet — the same reasoning
`Card`'s `brut`/`calm` split already documents. `TextField` and `TextAreaField` read a
new `--field-*` set instead: a thin line, a vermilion border on focus, no offset shadow.
The live preview itself is the opposite case — `Card tone="brut"` — because it's the
delight moment of this tool the same way a dropzone is for the others, not part of the
dense working UI around it.

## Consequences
- The suite now has two proven tool shapes, file-in and input-in, not one generalized
  template stretched to cover both. A future input-in tool (a form-driven generator,
  say) has this ADR to follow instead of re-deriving the same decisions.
- `localStorage` exists in the codebase for the first time. It is scoped to one key,
  one tool, and one already-argued reason — not a general capability to reach for.
- The repeatable-row line-item editor and the optional logo upload (a single file input
  inside an otherwise file-free tool) are new patterns; nothing before this tool needed
  either.
- `TextField`/`TextAreaField` and the `--field-*` tokens are now the suite's answer for
  any future form-heavy tool, the same way `Slider`/`Segmented`/`Switch` already are for
  option panels.
