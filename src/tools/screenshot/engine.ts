import { ScreenshotError } from './errors';
import { computeLayout, type Layout } from './layout';
import {
  BACKGROUND_PRESETS,
  type BeautifyOptions,
  type RenderedImage,
  type SampleFile,
  type ScreenshotTask,
  type ScreenshotTaskResult,
} from './types';

const TRAFFIC_LIGHT_COLORS = ['#ff5f57', '#febc2e', '#28c840'] as const;

/**
 * The half of this tool that genuinely can't be a pure function: it draws. Unlike
 * `layout.ts`, there's no meaningful way to unit test pixels without a real canvas —
 * Node has none, and adding one just to satisfy Vitest would be a heavier dependency
 * than the drawing itself. Verified through the Playwright spec instead, the same
 * split `imageMath.ts` (tested) draws against `engine.ts`'s image decode/encode
 * (not tested) for the image converter.
 */
export async function runScreenshotTask(task: ScreenshotTask): Promise<ScreenshotTaskResult> {
  if (task.kind === 'sample') {
    return { kind: 'sample', file: await createSample() };
  }

  return { kind: 'render', image: await renderScreenshot(task.file, task.options) };
}

async function renderScreenshot(file: File, options: BeautifyOptions): Promise<RenderedImage> {
  const bitmap = await decodeImage(file);

  try {
    return await compose(bitmap, options);
  } finally {
    bitmap.close();
  }
}

async function decodeImage(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file);
  } catch (cause) {
    throw new ScreenshotError('InvalidImageError', "Couldn't decode the image", { cause });
  }
}

async function compose(bitmap: ImageBitmap, options: BeautifyOptions): Promise<RenderedImage> {
  const layout = computeLayout(bitmap.width, bitmap.height, options);
  const canvas = new OffscreenCanvas(layout.canvasWidth, layout.canvasHeight);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ScreenshotError('RenderFailedError', '2D canvas context unavailable');

  paintBackground(ctx, layout, options.background);
  paintWindow(ctx, layout, bitmap, options);

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const bytes = new Uint8Array(await blob.arrayBuffer());

  return { bytes, width: layout.canvasWidth, height: layout.canvasHeight };
}

function paintBackground(
  ctx: OffscreenCanvasRenderingContext2D,
  layout: Layout,
  presetId: BeautifyOptions['background'],
): void {
  const { colors } = BACKGROUND_PRESETS[presetId];

  if (colors.length === 1) {
    ctx.fillStyle = colors[0];
  } else {
    const gradient = ctx.createLinearGradient(0, 0, layout.canvasWidth, layout.canvasHeight);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    ctx.fillStyle = gradient;
  }

  ctx.fillRect(0, 0, layout.canvasWidth, layout.canvasHeight);
}

/** One rounded-rect clip covers the frame bar and the screenshot together, so the pair
 *  reads as a single window rather than two shapes that happen to touch. The shadow is
 *  cast by a separate fill in the same path, drawn and reset before anything visible
 *  goes down — applying a canvas shadow to `drawImage` itself would shadow every
 *  translucent pixel in the screenshot, not the window's silhouette. */
function paintWindow(
  ctx: OffscreenCanvasRenderingContext2D,
  layout: Layout,
  bitmap: ImageBitmap,
  options: BeautifyOptions,
): void {
  const { windowX, windowY, windowWidth, windowHeight, radius, frameBarHeight, imageX, imageY } =
    layout;

  if (options.shadow) {
    ctx.save();
    ctx.shadowColor = 'rgba(22, 19, 13, 0.35)';
    ctx.shadowBlur = Math.max(12, layout.padding * 0.6);
    ctx.shadowOffsetY = Math.max(4, layout.padding * 0.25);
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.roundRect(windowX, windowY, windowWidth, windowHeight, radius);
    ctx.fill();
    ctx.restore();
  }

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(windowX, windowY, windowWidth, windowHeight, radius);
  ctx.clip();

  if (options.browserFrame) {
    ctx.fillStyle = '#e5e1d8';
    ctx.fillRect(windowX, windowY, windowWidth, frameBarHeight);
    paintTrafficLights(ctx, windowX, windowY, frameBarHeight);
  }

  ctx.drawImage(bitmap, imageX, imageY, bitmap.width, bitmap.height);
  ctx.restore();
}

function paintTrafficLights(
  ctx: OffscreenCanvasRenderingContext2D,
  barX: number,
  barY: number,
  barHeight: number,
): void {
  const dotRadius = barHeight * 0.16;
  const gap = dotRadius * 2.6;
  const startX = barX + barHeight * 0.65;
  const centerY = barY + barHeight / 2;

  for (const [index, color] of TRAFFIC_LIGHT_COLORS.entries()) {
    ctx.beginPath();
    ctx.arc(startX + gap * index, centerY, dotRadius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

const SAMPLE_WIDTH = 960;
const SAMPLE_HEIGHT = 600;
const SAMPLE_SIDEBAR_WIDTH = 220;

/** A drawn mockup rather than a shipped bitmap — same reasoning as the PDF tool's own
 *  sample, which draws its six pages rather than carrying a binary in the repo. Plain
 *  on purpose: it shouldn't look pre-styled, since demonstrating the styling is this
 *  tool's whole job. */
async function createSample(): Promise<SampleFile> {
  const canvas = new OffscreenCanvas(SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new ScreenshotError('RenderFailedError', '2D canvas context unavailable');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

  ctx.fillStyle = '#f4f0e7';
  ctx.fillRect(0, 0, SAMPLE_SIDEBAR_WIDTH, SAMPLE_HEIGHT);

  ctx.fillStyle = '#c4bcaa';
  for (let row = 0; row < 5; row += 1) {
    ctx.fillRect(24, 32 + row * 44, SAMPLE_SIDEBAR_WIDTH - 48, 12);
  }

  ctx.fillStyle = '#16130d';
  ctx.fillRect(SAMPLE_SIDEBAR_WIDTH, 0, SAMPLE_WIDTH - SAMPLE_SIDEBAR_WIDTH, 4);

  ctx.fillStyle = '#e5e1d8';
  ctx.fillRect(SAMPLE_SIDEBAR_WIDTH + 32, 32, 220, 20);

  const cardWidth = (SAMPLE_WIDTH - SAMPLE_SIDEBAR_WIDTH - 32 * 3) / 2;
  const cardTops = [88, 88 + 200 + 24];

  for (const top of cardTops) {
    ctx.fillStyle = '#fbf9f3';
    ctx.beginPath();
    ctx.roundRect(SAMPLE_SIDEBAR_WIDTH + 32, top, cardWidth * 2 + 32, 200, 12);
    ctx.fill();

    ctx.fillStyle = '#e5e1d8';
    ctx.fillRect(SAMPLE_SIDEBAR_WIDTH + 56, top + 24, 160, 16);
    ctx.fillRect(SAMPLE_SIDEBAR_WIDTH + 56, top + 56, cardWidth * 2 - 32, 10);
    ctx.fillRect(SAMPLE_SIDEBAR_WIDTH + 56, top + 76, cardWidth * 2 - 80, 10);
  }

  const blob = await canvas.convertToBlob({ type: 'image/png' });
  const bytes = new Uint8Array(await blob.arrayBuffer());

  return { bytes, name: 'sample-dashboard.png', mimeType: 'image/png' };
}
