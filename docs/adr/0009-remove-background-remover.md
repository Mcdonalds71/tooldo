# ADR 0009 — Remove the Background Remover

## Status
Accepted. Supersedes ADR 0008.

## Context
Background Remover shipped as tool 3, passed every automated check the suite has —
unit tests, CI's own Playwright smoke test downloading and running the real model,
manual verification in a real browser — and then failed in production for a real
visitor, reproducibly, on two unrelated networks (home wifi and a phone hotspot). That
ruled out anything local to one connection, which ADR 0008 traces in detail: Hugging
Face's CDN caches per edge node, and the identical request to the identical file
returned a clean success from some vantage points and a reproducible failure from
others, at the same moment, regardless of which network the visitor was actually on.

The fix built against that — retrying the model fetch with backoff, and correcting an
error message that had been wrongly blaming the visitor's connection — shipped and
deployed cleanly. It did not resolve the problem. Tested directly against the failure
after that fix was live, the retry still failed identically every time, and the same
visitor's own live retry, on the deployed fix, failed again the same way. The edge
inconsistency ADR 0008 found isn't a short blip a few seconds of backoff can ride out;
it's sitting there for however long Hugging Face's cache stays wrong at that node, which
is outside anything tooldo's code controls.

## Decision
Remove the tool rather than keep investing in a dependency outside tooldo's control.
The one fix left that would actually guarantee an answer — self-hosting the model
weights on Cloudflare R2 so the suite stops depending on Hugging Face's availability at
request time — was scoped in ADR 0008 and never built. Building it now means taking on
real infrastructure (a new Cloudflare resource, integrity and versioning handling for a
42 MiB binary that isn't source) to rescue one tool, in a suite whose entire premise is
ten small, self-contained utilities that work offline after the first load. Every other
tool already keeps that promise natively. Only this one needed a promise it couldn't
keep on its own, and that was true the moment it needed a third-party model host at all
— the CDN inconsistency is just the specific way that showed up.

The suite moves forward with 9 tools. Invoice Generator — already registered as
`planned`, a form-in/PDF-out tool with no external dependency of any kind, the same
shape as PDF Toolbox and Image Converter — takes Background Remover's place in the
nav's three promoted tools.

## Consequences
- The registry, nav, landing grid, sitemap and routes all now list 9 tools.
  `POPULAR_SLUGS` promotes `invoice` instead of `background`.
- Removed entirely: `src/tools/background/`, `src/pages/background.astro`,
  `e2e/background.spec.ts`, the `@huggingface/transformers` dependency and its
  `onnxruntime-web`/`onnxruntime-node` transitive footprint, `scripts/copy-onnx-runtime.mjs`,
  `scripts/stubs/onnxruntime-node`, and the CSP's `huggingface.co`/`*.hf.co` grant —
  `connect-src` is back to `'self'` alone. Every tool in the suite once again makes zero
  outbound network requests, which is the privacy promise stated plainly rather than
  qualified.
- ADR 0008 stays in the repo rather than being deleted. It's the accurate record of a
  real, well-reasoned attempt — the model architecture debugging that found and fixed a
  genuine WASM memory ceiling, the persistent-worker shape, and the CDN investigation
  that correctly diagnosed why the retry mitigation still wasn't enough. A future tool
  that considers depending on a third-party service at runtime should read it first,
  rather than assume an in-app retry is sufficient insurance against infrastructure this
  project doesn't operate.
- `heic-to`, the WASM HEIC decoder Background Remover shared with Image Converter,
  stays — Image Converter is still a live, working reason for it. `wasm-unsafe-eval` in
  the CSP stays for the same reason, unrelated to this removal.
- Nothing about the other nine tools' behavior, architecture, or track record changes.
  The lesson that generalizes: a tool whose correctness depends on a service tooldo
  doesn't operate carries a failure mode pure client-side compute doesn't, and that
  risk is worth weighing before committing to one, not discovering after it's already
  in front of a real visitor.
