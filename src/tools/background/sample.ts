import type { SampleFile } from './types';

/**
 * The "try a sample" image, drawn rather than shipped — same reasoning as the Image
 * Converter's: a real photo is a licensing decision, a committed binary is one more thing
 * to keep honest in a public repo. Unlike that sample, this one has to actually segment
 * well, so it can't be texture for a compressor to chew on — it draws a single bold,
 * high-contrast sphere on a two-tone studio backdrop, the same shape a product photo
 * would hand a background remover: one unambiguous subject, a grounding shadow, nothing
 * else in the frame competing for "foreground."
 */

const WIDTH = 1200;
const HEIGHT = 900;
const HORIZON = HEIGHT * 0.62;
const BALL_RADIUS = 190;
const BALL_X = WIDTH / 2;
const BALL_Y = HORIZON - BALL_RADIUS * 0.72;

export async function createSample(): Promise<SampleFile> {
  const canvas = new OffscreenCanvas(WIDTH, HEIGHT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  drawBackdrop(ctx);
  drawShadow(ctx);
  drawBall(ctx);

  const blob = await canvas.convertToBlob({ type: 'image/png' });

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    name: 'tooldo-sample.png',
    mimeType: 'image/png',
  };
}

function drawBackdrop(ctx: OffscreenCanvasRenderingContext2D): void {
  const wall = ctx.createLinearGradient(0, 0, 0, HORIZON);
  wall.addColorStop(0, '#e4ddcc');
  wall.addColorStop(1, '#cfc6ae');
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, WIDTH, HORIZON);

  const floor = ctx.createLinearGradient(0, HORIZON, 0, HEIGHT);
  floor.addColorStop(0, '#b7ac8e');
  floor.addColorStop(1, '#96896a');
  ctx.fillStyle = floor;
  ctx.fillRect(0, HORIZON, WIDTH, HEIGHT - HORIZON);
}

function drawShadow(ctx: OffscreenCanvasRenderingContext2D): void {
  ctx.save();
  ctx.translate(BALL_X, HORIZON + 6);
  ctx.scale(1, 0.22);
  const shadow = ctx.createRadialGradient(0, 0, 0, 0, 0, BALL_RADIUS * 1.15);
  shadow.addColorStop(0, 'rgba(22, 19, 13, 0.38)');
  shadow.addColorStop(1, 'rgba(22, 19, 13, 0)');
  ctx.fillStyle = shadow;
  ctx.beginPath();
  ctx.arc(0, 0, BALL_RADIUS * 1.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBall(ctx: OffscreenCanvasRenderingContext2D): void {
  const highlightX = BALL_X - BALL_RADIUS * 0.35;
  const highlightY = BALL_Y - BALL_RADIUS * 0.4;

  const sphere = ctx.createRadialGradient(
    highlightX,
    highlightY,
    BALL_RADIUS * 0.05,
    BALL_X,
    BALL_Y,
    BALL_RADIUS,
  );
  sphere.addColorStop(0, '#ff8f6f');
  sphere.addColorStop(0.45, '#ff3b14');
  sphere.addColorStop(1, '#a02205');

  ctx.fillStyle = sphere;
  ctx.beginPath();
  ctx.arc(BALL_X, BALL_Y, BALL_RADIUS, 0, Math.PI * 2);
  ctx.fill();
}
