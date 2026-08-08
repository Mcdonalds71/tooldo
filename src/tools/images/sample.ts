import type { SampleFile } from './types';

/**
 * The "try a sample" image, drawn rather than shipped: sourcing a real photo would be a
 * licensing decision, and a committed binary is one more thing to keep honest in a public
 * repo. Scattered circles give a lossy compressor real detail to work on, rather than a
 * flat swatch that would compress to nothing regardless of quality.
 */

const SAMPLE_WIDTH = 1600;
const SAMPLE_HEIGHT = 1200;
const CIRCLE_COUNT = 400;

export async function createSample(): Promise<SampleFile> {
  const canvas = new OffscreenCanvas(SAMPLE_WIDTH, SAMPLE_HEIGHT);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context unavailable');

  const gradient = ctx.createLinearGradient(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);
  gradient.addColorStop(0, '#f4f0e7');
  gradient.addColorStop(1, '#ff3b14');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, SAMPLE_WIDTH, SAMPLE_HEIGHT);

  const random = mulberry32(20260805);
  for (let circle = 0; circle < CIRCLE_COUNT; circle += 1) {
    ctx.beginPath();
    ctx.fillStyle = `rgba(22, 19, 13, ${(0.05 + random() * 0.2).toFixed(3)})`;
    ctx.arc(random() * SAMPLE_WIDTH, random() * SAMPLE_HEIGHT, 6 + random() * 60, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#16130d';
  ctx.font = 'bold 160px sans-serif';
  ctx.textBaseline = 'middle';
  ctx.fillText('tooldo', 80, SAMPLE_HEIGHT / 2);

  const blob = await canvas.convertToBlob({ type: 'image/png' });

  return {
    bytes: new Uint8Array(await blob.arrayBuffer()),
    name: 'tooldo-sample.png',
    mimeType: 'image/png',
  };
}

/** A tiny deterministic PRNG so the sample looks identical on every load. */
function mulberry32(seed: number): () => number {
  let state = seed;

  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
