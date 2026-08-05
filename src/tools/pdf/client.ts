import { runInWorker } from '../../lib/worker';
import type { BuildResult, InspectResult, PagePlan, PdfTask, PdfTaskResult } from './types';

/**
 * The main thread's half of the tool. Every call spins up a worker, so nothing here
 * holds a parsed document between runs — saving re-reads the files, which costs a
 * moment and keeps the engine a pure function of what was dropped.
 */

type Reply<K extends PdfTaskResult['kind']> = Extract<PdfTaskResult, { kind: K }>;
type Progress = (fraction: number) => void;

const createWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function run<K extends PdfTaskResult['kind']>(
  input: PdfTask,
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<Reply<K>> {
  return runInWorker<PdfTask, Reply<K>>(createWorker, {
    input,
    signal,
    ...(onProgress ? { onProgress } : {}),
  });
}

export async function inspectFiles(
  files: readonly File[],
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<InspectResult> {
  const reply = await run<'inspect'>({ kind: 'inspect', files }, signal, onProgress);

  return reply.result;
}

export async function buildPdf(
  files: readonly File[],
  plan: readonly PagePlan[],
  signal: AbortSignal,
  onProgress?: Progress,
): Promise<BuildResult> {
  const reply = await run<'build'>({ kind: 'build', files, plan }, signal, onProgress);

  return reply.result;
}

export async function loadSample(signal: AbortSignal): Promise<File> {
  const reply = await run<'sample'>({ kind: 'sample' }, signal);

  return new File([reply.bytes], 'tooldo-sample.pdf', { type: 'application/pdf' });
}
