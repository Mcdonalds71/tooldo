import { runInWorker } from '../../lib/worker';
import type {
  ConvertOptions,
  ConvertResult,
  ImagesTask,
  ImagesTaskResult,
  ZipEntry,
} from './types';

/** Every call spins up its own worker — a batch is independent files, not a document
 *  built up across calls, so there's no state worth keeping alive between them. */

type Reply<K extends ImagesTaskResult['kind']> = Extract<ImagesTaskResult, { kind: K }>;
type Progress = (fraction: number) => void;

const createWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function run<K extends ImagesTaskResult['kind']>(
  input: ImagesTask,
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<Reply<K>> {
  return runInWorker<ImagesTask, Reply<K>>(createWorker, {
    input,
    signal,
    ...(onProgress ? { onProgress } : {}),
  });
}

export async function convertImages(
  files: readonly File[],
  options: ConvertOptions,
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<ConvertResult> {
  const reply = await run<'convert'>({ kind: 'convert', files, options }, signal, onProgress);

  return reply.result;
}

export async function loadSample(signal: AbortSignal): Promise<File> {
  const reply = await run<'sample'>({ kind: 'sample' }, signal);
  const { bytes, name, mimeType } = reply.file;

  return new File([bytes], name, { type: mimeType });
}

export async function zipImages(
  entries: readonly ZipEntry[],
  signal: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  const reply = await run<'zip'>({ kind: 'zip', entries }, signal);

  return reply.bytes;
}
