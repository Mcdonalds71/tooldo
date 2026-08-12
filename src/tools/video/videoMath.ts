import { RESOLUTION_CAP_PX, type ResolutionCap } from './types';

const AUDIO_BITRATE_KBPS = 128;
const MIN_VIDEO_BITRATE_KBPS = 150;
const EVEN = 2;

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/** Fit the longest side inside the cap, aspect ratio kept, never enlarged — the same
 *  promise the Image Converter's own resize makes. `undefined` means "leave it alone",
 *  covering both the original-resolution choice and a source already under the cap, so
 *  a caller never has to tell those two cases apart. Rounded to an even number in both
 *  dimensions, which H.264 requires. */
export function computeScaledDimensions(
  source: Dimensions,
  resolution: ResolutionCap,
): Dimensions | undefined {
  if (resolution === 'original') return undefined;

  const cap = RESOLUTION_CAP_PX[resolution];
  const longestSide = Math.max(source.width, source.height);
  if (longestSide <= cap) return undefined;

  const scale = cap / longestSide;

  return {
    width: toEven(source.width * scale),
    height: toEven(source.height * scale),
  };
}

function toEven(value: number): number {
  return Math.max(EVEN, Math.round(value / EVEN) * EVEN);
}

/** Solves for the video bitrate that fills the target size over the clip's own length,
 *  after leaving room for the audio track. Floored rather than left to go to zero or
 *  negative for a short clip with a tight budget — a very low bitrate is an honest
 *  answer, an invalid one crashes the encoder. */
export function computeTargetVideoBitrateKbps(
  targetBytes: number,
  durationSeconds: number,
): number {
  if (durationSeconds <= 0) return MIN_VIDEO_BITRATE_KBPS;

  const totalKbps = (targetBytes * 8) / 1000 / durationSeconds;

  return Math.max(MIN_VIDEO_BITRATE_KBPS, Math.round(totalKbps - AUDIO_BITRATE_KBPS));
}

/** The GIF sampling grid: one timestamp per output frame, evenly spaced at the chosen
 *  frame rate rather than the source's own (often higher, often variable) one — fewer,
 *  regularly-spaced frames is what keeps a GIF's file size sane. At least one frame,
 *  even for a source shorter than a single tick at this rate. */
export function gifFrameTimestamps(durationSeconds: number, fps: number): number[] {
  const frameCount = Math.max(1, Math.round(durationSeconds * fps));

  return Array.from({ length: frameCount }, (_, index) => index / fps);
}

export function outputFilename(originalName: string, format: 'mp4' | 'gif'): string {
  const stem = originalName.replace(/\.[^./]+$/, '') || 'video';

  return format === 'gif' ? `${stem}.gif` : `${stem}-compressed.mp4`;
}

/** Progress figures from a codec or an encoding loop can drift past 1 or land just
 *  under 0 — clamped before either ever reaches a `<progress>` element. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;

  return Math.min(1, Math.max(0, value));
}
