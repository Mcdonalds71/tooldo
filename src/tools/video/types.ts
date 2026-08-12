/** What the dropzone takes, and the ceiling a crafted file has to stay under. A video
 *  this large is already past what a browser tab can comfortably hold in memory while
 *  it's decoded frame by frame. */
export const VIDEO_ACCEPT = [
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'video/x-msvideo',
  '.mp4',
  '.mov',
  '.webm',
  '.mkv',
  '.avi',
] as const;

export const MAX_VIDEO_BYTES = 500_000_000;

export type OutputFormat = 'mp4' | 'gif';

/** Caps the longest side, same convention the Image Converter already uses — labelled
 *  by the resolution people actually search for rather than "cap the longest side". */
export type ResolutionCap = 'original' | '1080' | '720' | '480';

export const RESOLUTION_CAP_PX: Record<Exclude<ResolutionCap, 'original'>, number> = {
  '1080': 1920,
  '720': 1280,
  '480': 854,
};

export type CompressionMode = 'quality' | 'targetSize';

/** Mediabunny's own named quality levels — used directly rather than mapped through a
 *  CRF number, since qualitative encoding is the library's own recommended, portable
 *  path (it falls back between bitrate- and quantizer-driven encoding on its own,
 *  whichever the browser's encoder actually supports). */
export type QualityTier = 'low' | 'medium' | 'high';

export type GifMotion = 'smooth' | 'balanced' | 'small';

export const FPS_BY_GIF_MOTION: Record<GifMotion, number> = {
  smooth: 15,
  balanced: 10,
  small: 8,
};

/** A direct quality pick, or a byte budget that can't become a bitrate until the
 *  source's duration is known — `engine.ts` resolves that once it has opened the file. */
export type RequestedCompression =
  | { readonly kind: 'quality'; readonly level: QualityTier }
  | { readonly kind: 'targetSize'; readonly targetBytes: number };

export interface CompressOptions {
  readonly format: 'mp4';
  readonly resolution: ResolutionCap;
  readonly compression: RequestedCompression;
}

export interface GifOptions {
  readonly format: 'gif';
  readonly resolution: ResolutionCap;
  readonly fps: number;
}

export type VideoOptions = CompressOptions | GifOptions;

export interface VideoOutput {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly mimeType: string;
  readonly name: string;
  readonly originalBytes: number;
}

export interface SampleFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly name: string;
  readonly mimeType: string;
}

export type VideoTask =
  | { readonly kind: 'run'; readonly file: File; readonly options: VideoOptions }
  | { readonly kind: 'sample' };

export type VideoTaskResult =
  | { readonly kind: 'run'; readonly output: VideoOutput }
  | { readonly kind: 'sample'; readonly file: SampleFile };
