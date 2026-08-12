import { applyPalette, GIFEncoder, quantize } from 'gifenc';
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  CanvasSink,
  CanvasSource,
  Conversion,
  canEncodeVideo,
  Input,
  type InputVideoTrack,
  Mp4OutputFormat,
  Output,
  Quality,
  UnsupportedInputFormatError,
} from 'mediabunny';
import { VideoError } from './errors';
import type {
  CompressOptions,
  GifOptions,
  RequestedCompression,
  SampleFile,
  VideoOutput,
  VideoTask,
  VideoTaskResult,
} from './types';
import {
  clampProgress,
  computeScaledDimensions,
  computeTargetVideoBitrateKbps,
  gifFrameTimestamps,
  outputFilename,
} from './videoMath';

/**
 * No ffmpeg, no WASM: Mediabunny demuxes and decodes through the browser's own
 * WebCodecs implementation, and encodes MP4 the same way — so the entire engine is a
 * few hundred kilobytes of pure JavaScript rather than a ~30MB compiled binary. That's
 * not a style preference; the binary genuinely can't ship. Cloudflare Workers caps a
 * single deployed asset at 25MB, ffmpeg-core.wasm is over 30MB single-threaded and
 * over 31MB multi-threaded, and the self-hosted ffmpeg.wasm build this tool shipped
 * first failed `wrangler deploy` outright — confirmed by actually running the build and
 * reading wrangler's own upload code, not assumed from a changelog.
 *
 * A real consequence of dropping ffmpeg: encoding needs a codec the visitor's own
 * browser supports, checked with `canEncodeVideo` before doing any work, rather than a
 * WASM binary that decodes and encodes the same way everywhere.
 */

const VIDEO_CODEC = 'avc';
const SAMPLE_WIDTH = 960;
const SAMPLE_HEIGHT = 540;
const SAMPLE_FPS = 30;
const SAMPLE_SECONDS = 4;

export async function runVideoTask(
  task: VideoTask,
  onProgress: (fraction: number) => void,
): Promise<VideoTaskResult> {
  if (task.kind === 'sample') {
    return { kind: 'sample', file: await createSample() };
  }

  const output =
    task.options.format === 'gif'
      ? await convertToGif(task.file, task.options, onProgress)
      : await compress(task.file, task.options, onProgress);

  return { kind: 'run', output };
}

async function openInput(file: File): Promise<Input> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS });

  if (!(await input.canRead())) {
    throw new VideoError('InvalidVideoError', "That file isn't a video this tool reads");
  }

  return input;
}

async function requirePrimaryVideoTrack(input: Input): Promise<InputVideoTrack> {
  const track = await input.getPrimaryVideoTrack();
  if (!track) throw new VideoError('InvalidVideoError', "That file isn't a video this tool reads");

  return track;
}

async function requireEncodable(): Promise<void> {
  if (await canEncodeVideo(VIDEO_CODEC)) return;

  throw new VideoError(
    'UnsupportedBrowserError',
    "This browser can't encode video — try a recent Chrome, Edge, or Safari",
  );
}

function toVideoError(cause: unknown): VideoError {
  if (cause instanceof VideoError) return cause;
  if (cause instanceof UnsupportedInputFormatError) {
    return new VideoError('InvalidVideoError', "That file isn't a video this tool reads", {
      cause,
    });
  }

  return new VideoError('EncodeFailedError', "That video couldn't be processed", { cause });
}

async function resolveQuality(input: Input, requested: RequestedCompression): Promise<Quality> {
  if (requested.kind === 'quality') return new Quality(requested.level);

  const duration = await input.computeDuration();
  const videoBitrateKbps = computeTargetVideoBitrateKbps(requested.targetBytes, duration);

  return new Quality({ bitrate: videoBitrateKbps * 1000 });
}

async function compress(
  file: File,
  options: CompressOptions,
  onProgress: (fraction: number) => void,
): Promise<VideoOutput> {
  await requireEncodable();
  const input = await openInput(file);
  const track = await requirePrimaryVideoTrack(input);

  const dimensions = computeScaledDimensions(
    { width: await track.getDisplayWidth(), height: await track.getDisplayHeight() },
    options.resolution,
  );
  const quality = await resolveQuality(input, options.compression);

  const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });

  const conversion = await Conversion.init({
    input,
    output,
    video: { codec: VIDEO_CODEC, quality, fit: 'contain', ...dimensions },
  });

  if (!conversion.isValid) {
    throw new VideoError('EncodeFailedError', "That video couldn't be compressed");
  }

  conversion.onProgress = (fraction) => onProgress(clampProgress(fraction));

  try {
    await conversion.execute();
  } catch (cause) {
    throw toVideoError(cause);
  }

  const buffer = output.target.buffer;
  if (!buffer) throw new VideoError('EncodeFailedError', "That video couldn't be compressed");

  return {
    bytes: new Uint8Array(buffer),
    mimeType: 'video/mp4',
    name: outputFilename(file.name, 'mp4'),
    originalBytes: file.size,
  };
}

/**
 * Each frame gets its own 256-colour palette rather than one palette shared across the
 * whole clip — simpler than ffmpeg's usual two-pass `palettegen`/`paletteuse`, one
 * decode-and-quantize loop instead of two, and it still looks right for a clip that
 * changes scene or lighting, which a single global palette wouldn't cover well anyway.
 */
async function convertToGif(
  file: File,
  options: GifOptions,
  onProgress: (fraction: number) => void,
): Promise<VideoOutput> {
  const input = await openInput(file);
  const track = await requirePrimaryVideoTrack(input);

  const sourceWidth = await track.getDisplayWidth();
  const sourceHeight = await track.getDisplayHeight();
  const { width, height } = computeScaledDimensions(
    { width: sourceWidth, height: sourceHeight },
    options.resolution,
  ) ?? { width: sourceWidth, height: sourceHeight };

  const duration = await input.computeDuration();
  const timestamps = gifFrameTimestamps(duration, options.fps);
  const delay = Math.round(1000 / options.fps);

  const sink = new CanvasSink(track, { width, height, fit: 'contain' });
  const gif = GIFEncoder();
  let processed = 0;

  try {
    for await (const wrapped of sink.canvasesAtTimestamps(timestamps)) {
      if (!wrapped) continue;

      // Inside a worker, `CanvasSink` always yields an `OffscreenCanvas` — there is no
      // `document` here to produce an `HTMLCanvasElement` from, which is the only other
      // type the union admits.
      const ctx = (wrapped.canvas as OffscreenCanvas).getContext('2d');
      if (!ctx) throw new VideoError('EncodeFailedError', "That video couldn't be converted");

      const { data } = ctx.getImageData(0, 0, width, height);
      const palette = quantize(data, 256);
      gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay });

      processed += 1;
      onProgress(clampProgress(processed / timestamps.length));
    }
  } catch (cause) {
    throw toVideoError(cause);
  }

  gif.finish();

  return {
    bytes: gif.bytes(),
    mimeType: 'image/gif',
    name: outputFilename(file.name, 'gif'),
    originalBytes: file.size,
  };
}

/**
 * Drawn, not shipped — the same reasoning every other tool's sample follows (the PDF
 * board's own pages, Screenshot Beautifier's mock dashboard). A bouncing circle rather
 * than a static frame gives the encoder and the GIF quantizer real per-frame motion to
 * work with, the same reasoning the Image Converter's own sample gives a lossy codec
 * real detail instead of a flat swatch.
 */
async function createSample(): Promise<SampleFile> {
  await requireEncodable();

  const canvas = new OffscreenCanvas(SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new VideoError('EncodeFailedError', "Couldn't build the sample video");

  const output = new Output({ format: new Mp4OutputFormat(), target: new BufferTarget() });
  const videoSource = new CanvasSource(canvas, {
    codec: VIDEO_CODEC,
    quality: new Quality('medium'),
  });
  output.addVideoTrack(videoSource);

  await output.start();

  const frameCount = SAMPLE_FPS * SAMPLE_SECONDS;
  const frameDuration = 1 / SAMPLE_FPS;

  for (let frame = 0; frame < frameCount; frame += 1) {
    paintSampleFrame(ctx, frame / frameCount);
    await videoSource.add(frame * frameDuration, frameDuration);
  }

  await output.finalize();

  const buffer = output.target.buffer;
  if (!buffer) throw new VideoError('EncodeFailedError', "Couldn't build the sample video");

  return { bytes: new Uint8Array(buffer), name: 'tooldo-sample.mp4', mimeType: 'video/mp4' };
}

function paintSampleFrame(ctx: OffscreenCanvasRenderingContext2D, t: number): void {
  ctx.fillStyle = '#f4f0e7';
  ctx.fillRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

  ctx.fillStyle = '#16130d';
  ctx.fillRect(0, SAMPLE_HEIGHT - 6, SAMPLE_WIDTH, 6);

  const radius = Math.min(SAMPLE_WIDTH, SAMPLE_HEIGHT) * 0.12;
  const x = radius + t * (SAMPLE_WIDTH - radius * 2);
  const y = SAMPLE_HEIGHT / 2 + Math.sin(t * Math.PI * 4) * SAMPLE_HEIGHT * 0.22;

  ctx.fillStyle = '#ff3b14';
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}
