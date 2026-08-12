# ADR 0015 — Video Compressor: WebCodecs via Mediabunny, not ffmpeg.wasm

## Status
Accepted.

## Context
Video Compressor was briefed and first built against `@ffmpeg/ffmpeg` — `ffmpeg-core`
compiled to WebAssembly, the same tool every other "compress a video in the browser"
project reaches for. The plan `public/_headers` had been carrying since the WASM CSP fix
(ADR 0007) was to self-host the core files through Vite's own asset pipeline (no CDN,
matching every other tool's "nothing leaves this tab" promise) and scope
`Cross-Origin-Embedder-Policy` to the `/video` route alone, since the multi-threaded core
needs `SharedArrayBuffer`, which needs full cross-origin isolation, which the other eight
tools have no reason to carry.

That version built, typechecked, and passed its unit tests. It failed at the step this
tool was explicitly given its own session to verify: an actual production build, checked
against the real deploy target. `ffmpeg-core.wasm` is 30.7MB single-threaded and 31.2MB
multi-threaded — both over Cloudflare Workers' hard 25MB per-asset limit, confirmed by
reading `MAX_ASSET_SIZE = 25 * 1024 * 1024` directly in the pinned `wrangler` package's
own upload code, the exact path `wrangler.jsonc`'s `assets.directory` deploys through —
not assumed from a changelog or a support thread. `wrangler deploy` would have rejected
the build outright with "Asset too large." Dropping the multi-threaded core doesn't
rescue this: the single-threaded one alone is still over the limit. Nothing about
trimming ffmpeg's own build flags was available without standing up a real
Docker-and-Emscripten compile pipeline this repo doesn't have.

## Decision
Rebuild the engine on [Mediabunny](https://mediabunny.dev) for the MP4 path and
[`gifenc`](https://github.com/mattdesl/gifenc) for the GIF path. Neither needs
WebAssembly:

- **Mediabunny** demuxes, decodes, encodes and muxes entirely through the browser's own
  WebCodecs API — pure TypeScript, zero dependencies, and its own bundle is a few hundred
  kilobytes rather than a ~30MB binary. Its `Conversion` API (`Input` → `Output`, with
  `width`/`height`/`fit` for the resize and a `Quality` for the compression) maps onto
  this tool's options almost exactly as originally designed.
- **`gifenc`** handles GIF encoding specifically, since it's not one of Mediabunny's
  output formats (GIF is a palette format, not a WebCodecs codec). `CanvasSink` gives
  Mediabunny-decoded frames at chosen timestamps; `gifenc`'s `quantize`/`applyPalette`
  turn each into an indexed frame, written straight into a GIF stream. One
  decode-and-quantize loop, not ffmpeg's usual two-pass `palettegen`/`paletteuse` — each
  frame gets its own 256-colour palette, which is simpler and still looks right for a
  clip that changes scene or lighting, which a single global palette wouldn't cover well
  either.

Dropping ffmpeg also removes the reason this tool would have been the one exception to
`runInWorker`: `FFmpeg.load()` spawned its own worker internally, so wrapping it in
`runInWorker` again would have nested workers for nothing. Mediabunny owns no worker of
its own — it runs wherever it's called — so Video Compressor uses the exact same
`client.ts`/`worker.ts`/`workerHost` shape every other file-in tool already does. The
COEP scoping plan, the core/core-mt fallback keyed on `crossOriginIsolated`, and the
`@ffmpeg/ffmpeg` Vite `optimizeDeps` exclusion are all gone from `public/_headers` and
`astro.config.mjs` — none of it is needed when nothing requires cross-origin isolation.

Measured, not estimated: the ffmpeg build's `dist/_astro/` would have shipped two
WASM binaries alone totalling over 60MB. The Mediabunny build's entire `dist/` is 17MB,
nothing in it over 3.4MB (the image codecs' own WASM, unrelated to this tool).

## Consequences
- **A real browser-support tradeoff that didn't exist in the ffmpeg plan.** ffmpeg.wasm
  decodes and encodes identically everywhere WASM runs; WebCodecs' H.264 encoder is a
  real browser capability that not everywhere has yet. `canEncodeVideo('avc')` is checked
  before any work starts, surfacing an honest `UnsupportedBrowserError` ("try a recent
  Chrome, Edge, or Safari") rather than a silent failure partway through — the FAQ says
  so plainly, the same honesty the suite's other scope-limit FAQs already practice.
- **"Cap the longest side" is now plain arithmetic, not a runtime filter expression.**
  The ffmpeg draft's `buildScaleFilter` handed libx264 an `if(gt(iw,ih),...)` expression
  to evaluate per-frame, because the source's dimensions weren't known in JS ahead of
  time. Mediabunny's `track.getDisplayWidth()`/`getDisplayHeight()` are known before
  encoding starts, so `computeScaledDimensions` in `videoMath.ts` is ordinary,
  fully-tested math — no string-built filter to get right, no ffmpeg-specific syntax to
  document.
- **Target-size math carried over unchanged.** `computeTargetVideoBitrateKbps` — solve
  for the bitrate that fills a byte budget over the clip's own duration, floored at a
  sane minimum — is about bits and seconds, not which encoder consumes the number. Only
  where the duration comes from changed (`input.computeDuration()` directly, versus
  ffmpeg's log-parsed `ffprobe` output).
- **The sample video is still drawn, not shipped**, the same principle every other
  tool's sample follows — a bouncing circle on paper-and-ink, encoded by drawing directly
  into Mediabunny's own `CanvasSource`/`Output`, rather than ffmpeg's `lavfi` synthetic
  sources. Same intent, the mechanism the new engine actually has.
- `gifenc` ships no TypeScript types and isn't on DefinitelyTyped — `src/tools/video/
  gifenc.d.ts` declares only the handful of functions this tool actually calls, the same
  "small, honest ambient declaration" shape as any other untyped dependency, rather than
  reaching for `any`.
- The lesson that generalizes past this one tool: a plan that passes typecheck, lint and
  unit tests hasn't been verified against the actual deploy target. This tool was
  deliberately given its own session specifically to check a real production build
  against Cloudflare's real constraints rather than assuming the plan already on file
  still held — and it didn't, which is exactly the outcome that justifies checking.
