import type { OutputFormat } from './types';

export type CompressionMode = 'quality' | 'targetSize';

/**
 * The option panel's own form state — separate from `ConvertOptions` because the form
 * carries a couple of things the engine never needs to see, like which compression mode
 * is showing. `toConvertOptions` in `options.ts` is the only place the two meet.
 */
export interface UiOptions {
  readonly format: OutputFormat;
  readonly resize: boolean;
  readonly maxDimension: number;
  readonly compressionMode: CompressionMode;
  /** 0–100, shown as a percentage. */
  readonly quality: number;
  readonly targetSizeKb: number;
}
