import type { ResizeOptions } from './types';

const MIN_QUALITY = 1;
const MAX_QUALITY = 100;
/** Binary search over 1–100 needs at most 7 steps; a slower codec still finishes fast. */
const MAX_SEARCH_STEPS = 7;

export interface Dimensions {
  readonly width: number;
  readonly height: number;
}

/** Fit inside the box, aspect ratio kept, never enlarged — a shrink tool that grows a
 *  smaller image would surprise more people than it'd help. */
export function computeResizeDimensions(source: Dimensions, options: ResizeOptions): Dimensions {
  const scale = Math.min(options.maxWidth / source.width, options.maxHeight / source.height, 1);

  return {
    width: Math.max(1, Math.round(source.width * scale)),
    height: Math.max(1, Math.round(source.height * scale)),
  };
}

/**
 * Finds the highest quality (1–100) whose encoded size still fits the budget. Falls back
 * to the smallest size the search actually reached if nothing fits — the image gets as
 * close as the codec allows rather than silently ignoring the budget it can't hit.
 */
export async function compressToTarget<T extends { readonly length: number }>(
  encode: (quality: number) => Promise<T>,
  targetBytes: number,
): Promise<T> {
  let low = MIN_QUALITY;
  let high = MAX_QUALITY;
  let closestUnderTarget: T | undefined;
  let smallestSeen: T | undefined;

  for (let step = 0; step < MAX_SEARCH_STEPS && low <= high; step += 1) {
    const quality = Math.round((low + high) / 2);
    const attempt = await encode(quality);

    if (smallestSeen === undefined || attempt.length < smallestSeen.length) {
      smallestSeen = attempt;
    }

    if (attempt.length <= targetBytes) {
      closestUnderTarget = attempt;
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }

  return closestUnderTarget ?? smallestSeen ?? (await encode(MIN_QUALITY));
}

/** The download gets the new format's extension, whatever the source file wore. */
export function withExtension(name: string, extension: string): string {
  const stem = name.replace(/\.[^./]+$/, '');

  return `${stem}.${extension}`;
}
