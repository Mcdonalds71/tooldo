/** What the dropzone takes, and the ceiling a crafted file has to stay under. */
export const BACKGROUND_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/heic',
  'image/heif',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.heic',
  '.heif',
] as const;

export const MAX_IMAGE_BYTES = 50_000_000;
/**
 * Well under the Image Converter's 60: that tool re-encodes, this one runs a neural net
 * forward pass per photo, seconds even on WebGPU and much longer on the WASM fallback. A
 * batch of 60 here would mean minutes of processing before the first result shows.
 */
export const MAX_FILES = 20;

export interface RemovedImage {
  readonly name: string;
  readonly mimeType: 'image/png';
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly originalBytes: number;
  readonly width: number;
  readonly height: number;
}

/** One outcome per file dropped, in the order they were dropped — so the caller can zip
 *  it back against its own file list by index without a second bucketing pass. */
export type RemoveOutcome =
  | ({ readonly ok: true } & RemovedImage)
  | { readonly ok: false; readonly name: string };

export interface SampleFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly name: string;
  readonly mimeType: string;
}

export interface ZipEntry {
  readonly name: string;
  readonly bytes: Uint8Array<ArrayBuffer>;
}

/**
 * The model-loading worker's own protocol, not the shared ephemeral `runInWorker` one:
 * that helper terminates its worker after every call, which is right for a stateless
 * conversion but wrong here — the model is a one-time load, and the whole point of a
 * dedicated worker is to keep it resident across every image in a session rather than
 * reloading it per file. See `worker.ts` and `segmenterClient.ts`.
 */
/**
 * Marks the model itself failing to load, as opposed to a photo failing to process.
 * The two need different words: the model is the one part of this tool that needs the
 * network, so its failure is almost always a connection problem, and telling someone to
 * "try a different photo" when their wifi dropped sends them chasing the wrong thing.
 *
 * Carried as an error *name* because that, and the message, is all `WorkerTaskError`
 * preserves across the worker boundary — structured clone drops everything else.
 */
export const MODEL_UNAVAILABLE = 'ModelUnavailableError';

export type RemovePhase = 'loading-model' | 'removing';

export interface RemoveProgress {
  readonly phase: RemovePhase;
  /** 0 to 1. Model loading can't always report a figure early on, so this may sit at 0
   *  briefly before the download itself starts producing numbers. */
  readonly fraction: number;
}

export interface RemoveResult {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly width: number;
  readonly height: number;
}

export type SegmenterRequest = { readonly type: 'remove'; readonly file: File };

export type SegmenterResponse =
  | { readonly type: 'progress'; readonly progress: RemoveProgress }
  | { readonly type: 'result'; readonly output: RemoveResult }
  | { readonly type: 'error'; readonly name: string; readonly message: string };

/** The unrelated, stateless half of the tool — sample generation and zipping — travels
 *  through the shared ephemeral worker instead, same as every other tool. */
export type BackgroundUtilityTask =
  | { readonly kind: 'sample' }
  | { readonly kind: 'zip'; readonly entries: readonly ZipEntry[] };

export type BackgroundUtilityResult =
  | { readonly kind: 'sample'; readonly file: SampleFile }
  | { readonly kind: 'zip'; readonly bytes: Uint8Array<ArrayBuffer> };
