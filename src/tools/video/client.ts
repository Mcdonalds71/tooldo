import { runInWorker } from '../../lib/worker';
import type { VideoOptions, VideoOutput, VideoTask, VideoTaskResult } from './types';

/** A fresh worker per call, same as every other tool — Mediabunny opens a new `Input`
 *  each run rather than holding one open across calls, so there's no state worth
 *  keeping a worker alive for between them. */

type Reply<K extends VideoTaskResult['kind']> = Extract<VideoTaskResult, { kind: K }>;
type Progress = (fraction: number) => void;

const createWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function run<K extends VideoTaskResult['kind']>(
  input: VideoTask,
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<Reply<K>> {
  return runInWorker<VideoTask, Reply<K>>(createWorker, {
    input,
    signal,
    ...(onProgress ? { onProgress } : {}),
  });
}

export async function processVideo(
  file: File,
  options: VideoOptions,
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<VideoOutput> {
  const reply = await run<'run'>({ kind: 'run', file, options }, signal, onProgress);

  return reply.output;
}

export async function loadSample(signal: AbortSignal): Promise<File> {
  const reply = await run<'sample'>({ kind: 'sample' }, signal);
  const { bytes, name, mimeType } = reply.file;

  return new File([bytes], name, { type: mimeType });
}
