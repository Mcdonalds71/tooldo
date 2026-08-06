/** What the dropzone takes, and the ceilings a crafted file has to stay under. */
export const IMAGE_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/heic',
  'image/heif',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.avif',
  '.heic',
  '.heif',
] as const;

export const MAX_IMAGE_BYTES = 50_000_000;
/** Past this many files a browser tab starts to struggle, so the tool says so up front. */
export const MAX_FILES = 60;

export type OutputFormat = 'png' | 'jpeg' | 'webp' | 'avif';

export interface ResizeOptions {
  readonly maxWidth: number;
  readonly maxHeight: number;
}

/**
 * `quality` is a direct pick; `targetSize` searches for the highest quality that still
 * fits the budget. Meaningless for PNG, which is lossless — the engine ignores it there
 * rather than erroring on a combination the option panel never offers in the first place.
 */
export type Compression =
  | { readonly kind: 'quality'; readonly quality: number }
  | { readonly kind: 'targetSize'; readonly targetBytes: number };

export interface ConvertOptions {
  readonly format: OutputFormat;
  readonly resize?: ResizeOptions | undefined;
  readonly compression?: Compression | undefined;
}

export interface ConvertedImage {
  readonly name: string;
  readonly mimeType: string;
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly originalBytes: number;
  readonly width: number;
  readonly height: number;
}

/** One outcome per file dropped, in the order they were dropped — so the caller can zip
 *  it back against its own file list by index without a second bucketing pass. */
export type ConvertOutcome =
  | ({ readonly ok: true } & ConvertedImage)
  | { readonly ok: false; readonly name: string };

export interface ConvertResult {
  readonly outcomes: readonly ConvertOutcome[];
}

export interface SampleFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly name: string;
  readonly mimeType: string;
}

export interface ZipEntry {
  readonly name: string;
  readonly bytes: Uint8Array<ArrayBuffer>;
}

export type ImagesTask =
  | { readonly kind: 'convert'; readonly files: readonly File[]; readonly options: ConvertOptions }
  | { readonly kind: 'sample' }
  | { readonly kind: 'zip'; readonly entries: readonly ZipEntry[] };

export type ImagesTaskResult =
  | { readonly kind: 'convert'; readonly result: ConvertResult }
  | { readonly kind: 'sample'; readonly file: SampleFile }
  | { readonly kind: 'zip'; readonly bytes: Uint8Array<ArrayBuffer> };
