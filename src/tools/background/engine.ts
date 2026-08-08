import type { pipeline as PipelineFn } from '@huggingface/transformers';
import { MODEL_UNAVAILABLE, type RemoveProgress, type RemoveResult } from './types';

const MODEL_ID = 'onnx-community/ormbg-ONNX';

type Segmenter = Awaited<ReturnType<typeof PipelineFn<'background-removal'>>>;

let segmenterPromise: Promise<Segmenter> | undefined;

/**
 * The model loads once per worker lifetime and is reused for every image after — a
 * download and a compiled inference session are not something to pay for twice in one
 * sitting. `worker.ts` keeps this same worker alive across calls for exactly that
 * reason, unlike every other tool's one-shot `runInWorker`; see its own comment for the
 * rest of that story.
 */
function getSegmenter(onProgress: (progress: RemoveProgress) => void): Promise<Segmenter> {
  segmenterPromise ??= loadSegmenter(onProgress).catch((cause: unknown) => {
    // A *rejected* promise must not be the thing we cache. Memoizing the failure would
    // outlive whatever caused it — a dropped connection is temporary, but the cached
    // rejection is not, and "Try again" would replay the original error forever on a
    // network that has long since come back.
    segmenterPromise = undefined;

    const failure = new Error('The background remover could not be downloaded', { cause });
    failure.name = MODEL_UNAVAILABLE;
    throw failure;
  });

  return segmenterPromise;
}

async function loadSegmenter(onProgress: (progress: RemoveProgress) => void): Promise<Segmenter> {
  const { pipeline, env } = await import('@huggingface/transformers');

  // onnxruntime-web fetches its own WASM binaries from jsDelivr's CDN by default. Self-
  // hosted copies live at /ort/ instead (scripts/copy-onnx-runtime.mjs, run at install
  // time), so the CSP only has to trust huggingface.co for the model weights, not a
  // second third-party host for the engine that runs them.
  if (env.backends.onnx.wasm) {
    env.backends.onnx.wasm.wasmPaths = '/ort/';
  }

  const segmenter = await pipeline('background-removal', MODEL_ID, {
    // ormbg is IS-Net — a fully convolutional segmentation architecture, not a
    // transformer. That choice is load-bearing, not incidental: an earlier attempt at
    // this tool used BiRefNet (also MIT/Apache, also strong quality on paper), and its
    // transformer encoder's activation memory grows fast enough with image size that
    // WASM's 32-bit linear memory couldn't reliably serve a large-enough contiguous
    // allocation for the forward pass — `std::bad_alloc` out of onnxruntime-web,
    // reproduced on real hardware, not just a constrained CI box. Neither dropping to
    // fp32 nor disabling the memory arena fixed it, because the ceiling is architectural
    // (see ADR 0008). A CNN's activation footprint doesn't scale the same way, which is
    // exactly why this model doesn't hit it.
    device: 'wasm',
    // The quantized file is what this repo actually publishes for the wasm path — named
    // explicitly rather than left to resolve by default, the same lesson BiRefNet_lite
    // taught: a repo without the dtype a device defaults to means a 404, not a fallback.
    dtype: 'q8',
    progress_callback: (info: { readonly status: string; readonly progress?: number }) => {
      if (info.status === 'progress_total' && typeof info.progress === 'number') {
        onProgress({ phase: 'loading-model', fraction: info.progress / 100 });
      }
    },
  });

  onProgress({ phase: 'loading-model', fraction: 1 });

  return segmenter;
}

export async function removeBackground(
  file: File,
  onProgress: (progress: RemoveProgress) => void,
): Promise<RemoveResult> {
  const segmenter = await getSegmenter(onProgress);
  const input = await toSegmenterInput(file);

  onProgress({ phase: 'removing', fraction: 0 });
  const output = await segmenter(input);
  onProgress({ phase: 'removing', fraction: 1 });

  const blob = await output.toBlob('image/png');

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    width: output.width,
    height: output.height,
  };
}

/** HEIC has no native decoder anywhere, so it's the one format that needs a pass through
 *  its own WASM codec before the segmenter ever sees it — the same one the Image
 *  Converter already uses. Everything else `RawImage.read` decodes on its own. */
async function toSegmenterInput(file: File): Promise<Blob | OffscreenCanvas> {
  const { heicTo, isHeic } = await import('heic-to/csp');

  if (!(await isHeic(file))) return file;

  const bitmap = await heicTo({ blob: file, type: 'bitmap' });
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return canvas;
}
