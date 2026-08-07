# ADR 0008 — Background Remover: model, device, and a second worker shape

## Status
Accepted.

## Context
The Background Remover needed a segmentation model, a way to run it in the browser, and
a worker architecture — and the model choice turned out to have a wrong answer that
looked right on paper and passed typecheck, lint and every unit test, and still failed
the one check that mattered: actually running it. Continuing the project's pattern of
"verify against the real thing, not the assumption" (ADR 0007, the CSP-and-glass bugs in
tool 1), the real failure only showed up by running the tool live in a browser and
reading the actual exception, twice.

**First model attempt: BiRefNet.** `transformers.js` ships a dedicated
`'background-removal'` pipeline whose default model is `Xenova/modnet` —
portrait-only, wrong for a general "erase any background" tool. RMBG-1.4/2.0 (the other
common choice) is Creative Commons non-commercial, which a public MIT-licensed repo
can't use. BiRefNet is MIT, trained for general salient-object segmentation, and
`onnx-community/BiRefNet_lite-ONNX` is its smallest web-oriented conversion — read from
the model repo's own file listing, not assumed. It looked like the right call.

Two problems surfaced only by running it. First, its WebGPU shader needs 17 storage
buffers per stage against the default WebGPU device limit of 16 on ordinary hardware —
`Too many storage buffers in shader`, thrown by onnxruntime-web before it ever produces
a mask. Switching to `device: 'wasm'` sidestepped that. But WASM inference then failed
too, consistently, with:

```
Error: failed to call OrtRun().
ERROR_CODE: 6, ERROR_MESSAGE: std::bad_alloc
```

This was reproduced on real hardware — not a resource-starved CI box — across repeated
runs, and it survived every configuration change tried against it: `dtype: 'fp32'`
instead of `'fp16'` (ruling out CPU-side fp16 upcast overhead), and
`session_options: { enableCpuMemArena: false }` in both directions (ruling out the
memory arena's pooling behavior). Same crash every time, always inside
`encoder_forward`.

**Root cause.** ONNX Runtime Web runs inside WebAssembly's 32-bit linear memory model —
one contiguous `ArrayBuffer` with a practical ceiling well under what the host machine
actually has free, because big tensors need *contiguous* memory and large incremental
`memory.grow()` calls can fail to find it even when total free RAM is generous. BiRefNet's
transformer encoder is the specific problem: attention's activation memory grows fast
with the number of image patches, and at the resolution this model works at, the
intermediate tensors are large enough to hit that ceiling reliably. This is architectural,
not a tuning problem — confirmed independently by another developer's public account of
hitting the identical `std::bad_alloc` in `encoder_forward` with the identical model,
trying the identical fallback ladder (WebGPU → WASM fp16 → WASM fp32), and concluding the
same thing: CNN-style segmentation models don't have this failure mode, transformer-heavy
ones do, and neither dtype nor file size predicts which side of that line a model falls
on. (["Four Models to Remove One Background: A Browser-ML War Story"](https://leecy.me/four-models-to-remove-one-background-a-browser-ml-war-story/).)

**Worker shape.** Independent of the model problem: every other tool's compute goes
through `runInWorker` — spin up a worker, run one task, terminate it
(`src/lib/worker.ts`). That's wrong here for a different reason than ADR 0006's: the
model is a weight file plus a compiled inference session, not something to reload for
every photo in a batch.

## Decision
**Model:** `onnx-community/ormbg-ONNX` (Open Remove Background Model), Apache-2.0,
IS-Net — a fully convolutional segmentation architecture, not a transformer. That's the
load-bearing property: no attention, no activation memory that scales the way BiRefNet's
did, and no `std::bad_alloc` in the same testing that reliably reproduced it against
BiRefNet. It's also a smaller download at the dtype this pipeline actually requests —
the model repo's own quantized (`q8`) file is well under half of BiRefNet_lite's fp16
weights, named explicitly in the pipeline call rather than left to resolve by default,
the same lesson BiRefNet_lite's missing-quantized-file 404 already taught.

**Device:** `'wasm'` only. WASM was already proven reliable for segmentation inference in
this suite's own testing; there was no reason to re-risk a WebGPU attempt against a new
model when the working, verified configuration was sitting right there. Revisiting
WebGPU for speed is a fine future experiment, not a blocker for shipping.

**Worker:** `src/tools/background/worker.ts` is a *persistent* worker — created once,
lazily, and never terminated by the client (`segmenterClient.ts`) after a call the way
`runInWorker` always does. The loaded pipeline lives in `engine.ts`'s module scope for
the worker's whole lifetime and is reused across every photo. If the worker thread itself
dies (an `ErrorEvent`, not a caught-and-reported failure), the client discards it and
lets the next call spin up a fresh one rather than posting into a dead worker forever.

The unrelated stateless half of the tool — generating the sample image, zipping results
— still goes through the ordinary ephemeral `runInWorker` / `serveWorkerTask` path
(`utilityWorker.ts`), because it has nothing to do with the model and gains nothing from
staying resident.

**Runtime, not just model.** onnxruntime-web fetches its own WASM binaries from
jsDelivr's CDN by default — a second third-party host beyond huggingface.co, and one
that has nothing to do with the model itself. `scripts/copy-onnx-runtime.mjs` copies the
six `ort-wasm-simd-threaded*` files it actually needs (plain and asyncify for the WASM
path, jsep for a possible future WebGPU path) from the already-resolved
`onnxruntime-web` dependency into `public/ort/` at install time, and
`env.backends.onnx.wasm.wasmPaths` points there. `connect-src` only has to trust
`huggingface.co` and `*.hf.co` — the model weights, the one thing that can't be
self-hosted without committing a binary to a public repo.

## Consequences
- The suite's privacy promise ("your files never leave your device") still holds
  exactly: the photo never leaves the browser tab. What's new is that this tool, alone
  among the ten, makes an outbound request at all — for a public model file with
  nothing of the visitor's in it, fetched once and cached by the browser afterward. The
  FAQ says this plainly rather than letting "runs in your browser" imply "no network
  ever."
- **The failure mode this ADR exists to document: a model can pass every other check —
  correct license, correct pipeline API, correct output shape, loads fine, starts
  running — and still be the wrong choice, for a reason invisible until the forward
  pass actually runs on real hardware.** Neither `pnpm typecheck` nor a unit test would
  ever have caught this; only running the tool caught it. Any future tool that loads a
  transformer-family model for in-browser WASM inference should budget time to verify
  the forward pass completes on ordinary hardware before treating the integration as
  done, not just verify that the pipeline constructs successfully.
- `onnxruntime-node` — a hard (non-optional) dependency of `@huggingface/transformers`
  for its Node.js code path, never exercised by a browser-only build — is redirected to
  a local stub via `pnpm-workspace.yaml`'s `overrides` (`scripts/stubs/onnxruntime-node`)
  rather than fetched. The real package is a multi-platform native binary bundle that
  timed out repeatedly in CI-adjacent environments and buys nothing even when it
  succeeds.
- A future tool that also needs a resident, expensive-to-load resource (a different
  model, a large parsed document held across operations) has a second pattern to reach
  for now, not just `runInWorker` — but it's still the exception. Reach for the ordinary
  ephemeral worker first; this shape earns its complexity only when reloading per call
  is the actually-measured problem.
