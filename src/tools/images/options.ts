import type { UiOptions } from './optionTypes';
import type { ConvertOptions } from './types';

/** Each codec's own tuned default — picked up whenever the format changes, so a switch
 *  starts from a sensible number for that codec rather than whatever the last one left. */
export const DEFAULT_QUALITY_BY_FORMAT: Record<UiOptions['format'], number> = {
  png: 100,
  jpeg: 75,
  webp: 75,
  avif: 50,
};

export const DEFAULT_OPTIONS: UiOptions = {
  format: 'jpeg',
  resize: false,
  maxDimension: 1920,
  compressionMode: 'quality',
  quality: DEFAULT_QUALITY_BY_FORMAT.jpeg,
  targetSizeKb: 200,
};

/** Translates the form's state into what the engine actually takes — PNG drops
 *  compression entirely, since a lossless format has no quality knob to turn. */
export function toConvertOptions(options: UiOptions): ConvertOptions {
  const resize = options.resize
    ? { maxWidth: options.maxDimension, maxHeight: options.maxDimension }
    : undefined;

  if (options.format === 'png') {
    return { format: 'png', ...(resize ? { resize } : {}) };
  }

  const compression: ConvertOptions['compression'] =
    options.compressionMode === 'targetSize'
      ? { kind: 'targetSize', targetBytes: options.targetSizeKb * 1000 }
      : { kind: 'quality', quality: options.quality / 100 };

  return { format: options.format, compression, ...(resize ? { resize } : {}) };
}
