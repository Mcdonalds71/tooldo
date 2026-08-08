import { runInWorker } from '../../lib/worker';
import type { BackgroundUtilityResult, BackgroundUtilityTask, ZipEntry } from './types';

/** Every call spins up its own worker — sample generation and zipping are stateless, so
 *  there's nothing worth keeping alive between them, unlike the segmenter. */

type Reply<K extends BackgroundUtilityResult['kind']> = Extract<
  BackgroundUtilityResult,
  { kind: K }
>;

const createWorker = () =>
  new Worker(new URL('./utilityWorker.ts', import.meta.url), { type: 'module' });

function run<K extends BackgroundUtilityResult['kind']>(
  input: BackgroundUtilityTask,
  signal: AbortSignal,
): Promise<Reply<K>> {
  return runInWorker<BackgroundUtilityTask, Reply<K>>(createWorker, { input, signal });
}

export async function loadSample(signal: AbortSignal): Promise<File> {
  const reply = await run<'sample'>({ kind: 'sample' }, signal);
  const { bytes, name, mimeType } = reply.file;

  return new File([bytes], name, { type: mimeType });
}

export async function zipRemoved(
  entries: readonly ZipEntry[],
  signal: AbortSignal,
): Promise<Uint8Array<ArrayBuffer>> {
  const reply = await run<'zip'>({ kind: 'zip', entries }, signal);

  return reply.bytes;
}
