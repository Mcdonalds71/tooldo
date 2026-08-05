# ADR 0006 — Page previews render on the main thread

## Status
Accepted.

## Context
The PDF Toolbox is a board of page thumbnails: you can't reorder pages you can't see, so the previews are part of the tool working, not decoration. They come from `pdfjs-dist`, which is the only library that renders a PDF page.

ADR 0003 says heavy work goes through `runInWorker`. pdf.js doesn't fit that shape. It ships its own worker and owns the parse itself, and the paint has to land on a canvas — which means either an `OffscreenCanvas` inside our worker with pdf.js's worker nested inside that, or the ordinary arrangement.

## Decision
Document surgery — merging, reordering, rotating, saving — stays in `engine.ts` behind `runInWorker`, as every tool's compute does.

Page previews are the exception: `src/tools/pdf/thumbnails.ts` runs pdf.js on the main thread, where pdf.js starts its own worker for the parsing and only the canvas paint stays here. The module is behind a dynamic `import()`, so nothing about pdf.js reaches a visitor who never opens a PDF.

## Consequences
- The expensive half — parsing and rasterising — is still off the main thread, which is what the rule protects.
- The board works without previews. Cards fall back to numbered placeholders and every control still does its job, so a failed chunk download costs a picture, not the tool.
- pdf.js is configured with `disableFontFace: true`: it installs fonts as `data:` URLs otherwise, and the CSP's `font-src 'self'` would block them.
- Trade-off: two paths to reason about instead of one. Contained to a single file, and the rule that matters — the engine is pure and runs in a worker — is untouched.
