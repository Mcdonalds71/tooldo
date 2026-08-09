import { runInWorker } from '../../lib/worker';
import type { DataTask, DataTaskResult, ParsedTable, SourceFormat } from './types';

type Reply<K extends DataTaskResult['kind']> = Extract<DataTaskResult, { kind: K }>;

const createWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

function run<K extends DataTaskResult['kind']>(
  input: DataTask,
  signal: AbortSignal,
): Promise<Reply<K>> {
  return runInWorker<DataTask, Reply<K>>(createWorker, { input, signal });
}

export async function parseFile(
  file: File,
  signal: AbortSignal,
): Promise<{ readonly format: SourceFormat; readonly table: ParsedTable }> {
  const reply = await run<'parse'>({ kind: 'parse', file }, signal);

  return { format: reply.format, table: reply.table };
}

export async function loadSample(signal: AbortSignal): Promise<File> {
  const reply = await run<'sample'>({ kind: 'sample' }, signal);
  const { bytes, name, mimeType } = reply.file;

  return new File([bytes], name, { type: mimeType });
}
