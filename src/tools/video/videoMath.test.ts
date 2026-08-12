import { describe, expect, it } from 'vitest';
import {
  clampProgress,
  computeScaledDimensions,
  computeTargetVideoBitrateKbps,
  gifFrameTimestamps,
  outputFilename,
} from './videoMath';

describe('computeScaledDimensions', () => {
  it('caps the longest side, keeping the aspect ratio', () => {
    expect(computeScaledDimensions({ width: 3840, height: 2160 }, '1080')).toEqual({
      width: 1920,
      height: 1080,
    });
  });

  it('caps the longest side for a portrait source too', () => {
    expect(computeScaledDimensions({ width: 1080, height: 1920 }, '720')).toEqual({
      width: 720,
      height: 1280,
    });
  });

  it('leaves the original resolution alone', () => {
    expect(computeScaledDimensions({ width: 3840, height: 2160 }, 'original')).toBeUndefined();
  });

  it('never upscales a source already under the cap', () => {
    expect(computeScaledDimensions({ width: 640, height: 360 }, '1080')).toBeUndefined();
  });

  it('rounds to an even number in both dimensions', () => {
    expect(computeScaledDimensions({ width: 1919, height: 1079 }, '720')).toEqual({
      width: 1280,
      height: 720,
    });
  });
});

describe('computeTargetVideoBitrateKbps', () => {
  it('solves for the bitrate that fills the target size over the duration', () => {
    // 10 MB over 60s = ~1333 kbps total, minus the 128 kbps audio track.
    expect(computeTargetVideoBitrateKbps(10_000_000, 60)).toBe(1205);
  });

  it('floors at a minimum rather than going to zero or negative', () => {
    expect(computeTargetVideoBitrateKbps(1_000, 60)).toBe(150);
  });

  it('floors when duration is unknown or non-positive rather than dividing by zero', () => {
    expect(computeTargetVideoBitrateKbps(10_000_000, 0)).toBe(150);
    expect(computeTargetVideoBitrateKbps(10_000_000, -5)).toBe(150);
  });
});

describe('gifFrameTimestamps', () => {
  it('spaces timestamps evenly at the chosen frame rate', () => {
    expect(gifFrameTimestamps(2, 10)).toEqual([
      0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8,
      1.9,
    ]);
  });

  it('always yields at least one frame', () => {
    expect(gifFrameTimestamps(0.01, 10)).toEqual([0]);
  });
});

describe('outputFilename', () => {
  it('suffixes a compressed mp4', () => {
    expect(outputFilename('holiday.mov', 'mp4')).toBe('holiday-compressed.mp4');
  });

  it('swaps the extension for a gif', () => {
    expect(outputFilename('holiday.mov', 'gif')).toBe('holiday.gif');
  });

  it('falls back to a name when the original has none', () => {
    expect(outputFilename('', 'gif')).toBe('video.gif');
  });
});

describe('clampProgress', () => {
  it('clamps to the 0–1 range', () => {
    expect(clampProgress(-0.2)).toBe(0);
    expect(clampProgress(1.4)).toBe(1);
    expect(clampProgress(0.5)).toBe(0.5);
  });

  it('treats a non-finite value as no progress', () => {
    expect(clampProgress(Number.NaN)).toBe(0);
  });
});
