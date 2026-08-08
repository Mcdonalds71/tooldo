import { describe, expect, it, vi } from 'vitest';
import { compressToTarget, computeResizeDimensions, withExtension } from './imageMath';

describe('computeResizeDimensions', () => {
  it('scales down to fit inside the box, keeping the aspect ratio', () => {
    expect(
      computeResizeDimensions({ width: 4000, height: 2000 }, { maxWidth: 1000, maxHeight: 1000 }),
    ).toEqual({
      width: 1000,
      height: 500,
    });
  });

  it('is bound by whichever side is the tighter fit', () => {
    expect(
      computeResizeDimensions({ width: 2000, height: 500 }, { maxWidth: 1000, maxHeight: 1000 }),
    ).toEqual({
      width: 1000,
      height: 250,
    });
  });

  it('never enlarges an image already inside the box', () => {
    expect(
      computeResizeDimensions({ width: 400, height: 300 }, { maxWidth: 1000, maxHeight: 1000 }),
    ).toEqual({
      width: 400,
      height: 300,
    });
  });

  it('rounds to a whole pixel and never down to zero', () => {
    expect(
      computeResizeDimensions({ width: 4000, height: 1 }, { maxWidth: 100, maxHeight: 100 }),
    ).toEqual({
      width: 100,
      height: 1,
    });
  });
});

describe('compressToTarget', () => {
  /** Higher quality makes a bigger file, same as a real codec — enough to exercise the
   *  search honestly without needing one. */
  const encode = async (quality: number) => ({ length: quality, quality });

  it('finds the highest quality that still fits the budget', async () => {
    const result = await compressToTarget(encode, 30);

    expect(result.length).toBeLessThanOrEqual(30);
    expect(await encode(result.quality + 1).then((r) => r.length)).toBeGreaterThan(30);
  });

  it('falls back to the smallest size reached when nothing fits', async () => {
    const result = await compressToTarget(encode, 0);

    expect(result.quality).toBe(1);
  });

  it('returns the full-quality result when the budget is generous', async () => {
    const result = await compressToTarget(encode, 1000);

    expect(result.quality).toBe(100);
  });

  it('calls the encoder at most a handful of times', async () => {
    const spy = vi.fn(encode);

    await compressToTarget(spy, 50);

    expect(spy.mock.calls.length).toBeLessThanOrEqual(7);
  });
});

describe('withExtension', () => {
  it('swaps a known extension for the new one', () => {
    expect(withExtension('holiday.HEIC', 'jpg')).toBe('holiday.jpg');
  });

  it('adds an extension to a name that has none', () => {
    expect(withExtension('holiday', 'webp')).toBe('holiday.webp');
  });

  it('only touches the last extension on a dotted name', () => {
    expect(withExtension('archive.tar.gz', 'png')).toBe('archive.tar.png');
  });
});
