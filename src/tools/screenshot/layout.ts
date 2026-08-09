import {
  type BeautifyOptions,
  MAX_CORNER_RADIUS,
  MAX_PADDING_PERCENT,
  MIN_CORNER_RADIUS,
  MIN_PADDING_PERCENT,
} from './types';

const MIN_FRAME_BAR_HEIGHT = 28;
const MAX_FRAME_BAR_HEIGHT = 48;
const FRAME_BAR_WIDTH_RATIO = 0.05;

export interface Layout {
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly padding: number;
  readonly windowX: number;
  readonly windowY: number;
  readonly windowWidth: number;
  readonly windowHeight: number;
  readonly imageX: number;
  readonly imageY: number;
  readonly frameBarHeight: number;
  readonly radius: number;
}

/**
 * Everything a render needs to know about *where* things go, with no canvas involved —
 * genuinely pure, so it's tested here rather than only ever exercised through a real
 * `OffscreenCanvas` draw (see `engine.ts` for why that half can't be, the same split
 * `imageMath.ts` draws for the image tool).
 */
export function computeLayout(
  sourceWidth: number,
  sourceHeight: number,
  options: Pick<BeautifyOptions, 'paddingPercent' | 'cornerRadius' | 'browserFrame'>,
): Layout {
  const shorterSide = Math.min(sourceWidth, sourceHeight);
  const padding = Math.round(shorterSide * (clampPaddingPercent(options.paddingPercent) / 100));
  const frameBarHeight = options.browserFrame ? frameBarHeightFor(sourceWidth) : 0;
  const radius = clampCornerRadius(options.cornerRadius, shorterSide);

  const windowWidth = sourceWidth;
  const windowHeight = sourceHeight + frameBarHeight;

  return {
    canvasWidth: sourceWidth + padding * 2,
    canvasHeight: windowHeight + padding * 2,
    padding,
    windowX: padding,
    windowY: padding,
    windowWidth,
    windowHeight,
    imageX: padding,
    imageY: padding + frameBarHeight,
    frameBarHeight,
    radius,
  };
}

function clampPaddingPercent(value: number): number {
  return Math.min(MAX_PADDING_PERCENT, Math.max(MIN_PADDING_PERCENT, value));
}

/** Can't exceed half the shorter side — past that a "corner radius" isn't describing a
 *  rounded rectangle anymore, it's describing a shape that doesn't exist. */
function clampCornerRadius(value: number, shorterSide: number): number {
  const ceiling = Math.min(MAX_CORNER_RADIUS, shorterSide / 2);
  return Math.min(ceiling, Math.max(MIN_CORNER_RADIUS, value));
}

/** Scales with the screenshot rather than a fixed pixel count, so a 4K capture doesn't
 *  get a bar that reads as a hairline and a small crop doesn't get one that dwarfs it. */
function frameBarHeightFor(sourceWidth: number): number {
  return Math.min(
    MAX_FRAME_BAR_HEIGHT,
    Math.max(MIN_FRAME_BAR_HEIGHT, Math.round(sourceWidth * FRAME_BAR_WIDTH_RATIO)),
  );
}
