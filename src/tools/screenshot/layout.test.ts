import { describe, expect, it } from 'vitest';
import { computeLayout } from './layout';

const NO_FRAME = { paddingPercent: 10, cornerRadius: 16, browserFrame: false };

describe('computeLayout', () => {
  it('pads the canvas evenly around the source image with no frame bar', () => {
    const layout = computeLayout(1000, 600, NO_FRAME);

    // Padding is 10% of the shorter side (600) = 60.
    expect(layout.canvasWidth).toBe(1000 + 60 * 2);
    expect(layout.canvasHeight).toBe(600 + 60 * 2);
    expect(layout.frameBarHeight).toBe(0);
    expect(layout.imageY).toBe(layout.windowY);
  });

  it('adds the frame bar height on top of the window without resizing the image', () => {
    const layout = computeLayout(1000, 600, { ...NO_FRAME, browserFrame: true });

    expect(layout.windowWidth).toBe(1000);
    expect(layout.windowHeight).toBe(600 + layout.frameBarHeight);
    expect(layout.imageY).toBe(layout.windowY + layout.frameBarHeight);
    expect(layout.frameBarHeight).toBeGreaterThan(0);
  });

  it('scales the frame bar with image width, within its floor and ceiling', () => {
    const tiny = computeLayout(200, 200, { ...NO_FRAME, browserFrame: true });
    const huge = computeLayout(8000, 4000, { ...NO_FRAME, browserFrame: true });

    expect(tiny.frameBarHeight).toBeGreaterThanOrEqual(28);
    expect(huge.frameBarHeight).toBeLessThanOrEqual(48);
  });

  it('clamps corner radius to half the shorter side', () => {
    const layout = computeLayout(100, 60, { ...NO_FRAME, cornerRadius: 100 });

    expect(layout.radius).toBe(30);
  });

  it('clamps corner radius to the configured ceiling even for a large image', () => {
    const layout = computeLayout(4000, 4000, { ...NO_FRAME, cornerRadius: 999 });

    expect(layout.radius).toBe(40);
  });

  it('clamps out-of-range padding percentages instead of trusting the input', () => {
    const negative = computeLayout(1000, 1000, { ...NO_FRAME, paddingPercent: -5 });
    const excessive = computeLayout(1000, 1000, { ...NO_FRAME, paddingPercent: 500 });

    expect(negative.canvasWidth).toBe(1000);
    expect(excessive.canvasWidth).toBe(1000 + (20 / 100) * 1000 * 2);
  });

  it('produces a canvas identical to the source at zero padding and no frame', () => {
    const layout = computeLayout(800, 500, {
      paddingPercent: 0,
      cornerRadius: 0,
      browserFrame: false,
    });

    expect(layout).toMatchObject({
      canvasWidth: 800,
      canvasHeight: 500,
      padding: 0,
      windowX: 0,
      windowY: 0,
      windowWidth: 800,
      windowHeight: 500,
      imageX: 0,
      imageY: 0,
      radius: 0,
    });
  });
});
