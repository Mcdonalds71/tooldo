import { runInWorker } from '../../lib/worker';
import type { BeautifyOptions, RenderedImage, ScreenshotTask, ScreenshotTaskResult } from './types';

/** A fresh worker per render, same as every other tool — a live preview is a series of
 *  independent renders, not a document a worker needs to hold state for between them. */

type Reply<K extends ScreenshotTaskResult['kind']> = Extract<ScreenshotTaskResult, { kind: K }>;

const createWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function run<K extends ScreenshotTaskResult['kind']>(
  input: ScreenshotTask,
  signal: AbortSignal,
): Promise<Reply<K>> {
  return runInWorker<ScreenshotTask, Reply<K>>(createWorker, { input, signal });
}

export async function renderScreenshot(
  file: File,
  options: BeautifyOptions,
  signal: AbortSignal,
): Promise<RenderedImage> {
  const reply = await run<'render'>({ kind: 'render', file, options }, signal);

  return reply.image;
}

export async function loadSample(signal: AbortSignal): Promise<File> {
  const reply = await run<'sample'>({ kind: 'sample' }, signal);
  const { bytes, name, mimeType } = reply.file;

  return new File([bytes], name, { type: mimeType });
}
