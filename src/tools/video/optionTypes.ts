import type { CompressionMode, GifMotion, OutputFormat, QualityTier, ResolutionCap } from './types';

/**
 * The option panel's own form state — separate from `VideoOptions` because the form
 * carries a couple of things the engine never needs to see, like which compression mode
 * is showing, and keeps both `quality` and `targetSizeMb` around even while only one is
 * in effect, so switching modes never loses the other's value. `options.ts` is the only
 * place this becomes the `VideoOptions` the engine takes.
 */
export interface UiOptions {
  readonly format: OutputFormat;
  readonly resolution: ResolutionCap;
  readonly compressionMode: CompressionMode;
  readonly quality: QualityTier;
  readonly targetSizeMb: number;
  readonly gifMotion: GifMotion;
}
