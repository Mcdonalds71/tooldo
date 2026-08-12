import type { UiOptions } from './optionTypes';
import { FPS_BY_GIF_MOTION, type VideoOptions } from './types';

export const DEFAULT_OPTIONS: UiOptions = {
  format: 'mp4',
  resolution: 'original',
  compressionMode: 'quality',
  quality: 'medium',
  targetSizeMb: 16,
  gifMotion: 'balanced',
};

const MB = 1_000_000;

/** Translates the form's state into what the engine actually takes — a GIF drops
 *  compression mode entirely, since a palette-based GIF has no bitrate to target. */
export function toVideoOptions(options: UiOptions): VideoOptions {
  if (options.format === 'gif') {
    return {
      format: 'gif',
      resolution: options.resolution,
      fps: FPS_BY_GIF_MOTION[options.gifMotion],
    };
  }

  return {
    format: 'mp4',
    resolution: options.resolution,
    compression:
      options.compressionMode === 'targetSize'
        ? { kind: 'targetSize', targetBytes: options.targetSizeMb * MB }
        : { kind: 'quality', level: options.quality },
  };
}
