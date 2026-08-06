import { compressToTarget, computeResizeDimensions, withExtension } from './imageMath';
import { createSample } from './sample';
import type {
  Compression,
  ConvertedImage,
  ConvertOptions,
  ConvertOutcome,
  ConvertResult,
  ImagesTask,
  ImagesTaskResult,
  OutputFormat,
  ResizeOptions,
  ZipEntry,
} from './types';

type LossyFormat = Exclude<OutputFormat, 'png'>;

const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  avif: 'image/avif',
};

const EXTENSION_BY_FORMAT: Record<OutputFormat, string> = {
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
};

/** Each codec's own tuned default — reused rather than inventing a uniform number that
 *  wouldn't reflect any of their actual quality curves. */
const DEFAULT_QUALITY: Record<LossyFormat, number> = { jpeg: 75, webp: 75, avif: 50 };

export async function runImagesTask(
  task: ImagesTask,
  onProgress: (fraction: number) => void,
): Promise<ImagesTaskResult> {
  if (task.kind === 'sample') {
    return { kind: 'sample', file: await createSample() };
  }

  if (task.kind === 'zip') {
    return { kind: 'zip', bytes: await zipEntries(task.entries) };
  }

  return { kind: 'convert', result: await convertImages(task.files, task.options, onProgress) };
}

async function zipEntries(entries: readonly ZipEntry[]): Promise<Uint8Array<ArrayBuffer>> {
  const { zip } = await import('fflate');
  const files = Object.fromEntries(entries.map((entry) => [entry.name, entry.bytes]));

  return new Promise((resolve, reject) => {
    // A fixed mtime keeps the zip from silently carrying the exact moment you ran the
    // tool — nothing about a download should say more than the files in it already do.
    // The ZIP format's DOS date field only encodes 1980–2099, so this is the earliest
    // valid date rather than the epoch.
    zip(files, { mtime: new Date('1980-01-01T00:00:00Z') }, (error, bytes) => {
      if (error) reject(error);
      else resolve(bytes as Uint8Array<ArrayBuffer>);
    });
  });
}

/**
 * Every file converts independently, so one bad file costs a queue entry, not the batch —
 * unlike the PDF board, there's no shared document for a failure to take down with it.
 * A caught failure collapses to a name; `errors.ts` turns that into the one sentence the
 * whole batch needs.
 */
export async function convertImages(
  files: readonly File[],
  options: ConvertOptions,
  onProgress?: (fraction: number) => void,
): Promise<ConvertResult> {
  const outcomes: ConvertOutcome[] = [];

  for (const [index, file] of files.entries()) {
    try {
      outcomes.push({ ok: true, ...(await convertOne(file, options)) });
    } catch {
      outcomes.push({ ok: false, name: file.name });
    }

    onProgress?.((index + 1) / files.length);
  }

  return { outcomes };
}

async function convertOne(file: File, options: ConvertOptions): Promise<ConvertedImage> {
  const decoded = await decode(file);
  const image = options.resize ? await resizeImage(decoded, options.resize) : decoded;
  const bytes = await encodeImage(image, options.format, options.compression);

  return {
    name: withExtension(file.name, EXTENSION_BY_FORMAT[options.format]),
    mimeType: MIME_BY_FORMAT[options.format],
    bytes,
    originalBytes: file.size,
    width: image.width,
    height: image.height,
  };
}

/** HEIC has no native decoder anywhere; everything else already does, so only HEIC pays
 *  for a WASM codec on the way in. */
async function decode(file: File): Promise<ImageData> {
  const { heicTo, isHeic } = await import('heic-to/csp');

  const bitmap = (await isHeic(file))
    ? await heicTo({ blob: file, type: 'bitmap' })
    : await createImageBitmap(file);

  const { width, height } = bitmap;
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  ctx.drawImage(bitmap, 0, 0);
  bitmap.close();

  return ctx.getImageData(0, 0, width, height);
}

async function resizeImage(image: ImageData, options: ResizeOptions): Promise<ImageData> {
  const target = computeResizeDimensions(image, options);
  if (target.width === image.width && target.height === image.height) return image;

  const { default: resize } = await import('@jsquash/resize');

  return resize(image, { width: target.width, height: target.height });
}

async function encodeImage(
  image: ImageData,
  format: OutputFormat,
  compression: Compression | undefined,
): Promise<Uint8Array<ArrayBuffer>> {
  if (format === 'png') return encodePng(image);

  const encodeAt = (quality: number) => encodeLossy(image, format, quality);

  if (compression?.kind === 'targetSize') {
    return compressToTarget(
      async (quality) => new Uint8Array(await encodeAt(quality)),
      compression.targetBytes,
    );
  }

  const quality =
    compression?.kind === 'quality'
      ? Math.round(compression.quality * 100)
      : DEFAULT_QUALITY[format];

  return new Uint8Array(await encodeAt(quality));
}

async function encodePng(image: ImageData): Promise<Uint8Array<ArrayBuffer>> {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  ctx.putImageData(image, 0, 0);
  const blob = await canvas.convertToBlob({ type: 'image/png' });

  return new Uint8Array(await blob.arrayBuffer());
}

async function encodeLossy(
  image: ImageData,
  format: LossyFormat,
  quality: number,
): Promise<ArrayBuffer> {
  if (format === 'jpeg') {
    const { encode } = await import('@jsquash/jpeg');
    return encode(image, { quality });
  }

  if (format === 'webp') {
    const { encode } = await import('@jsquash/webp');
    return encode(image, { quality });
  }

  const { encode } = await import('@jsquash/avif');
  return encode(image, { quality });
}
