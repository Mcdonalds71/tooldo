import { runInWorker } from '../../lib/worker';
import type { GenerateInvoiceResult, InvoiceData } from './types';

/**
 * The main thread's half of the tool. Named apart from `engine.ts`'s
 * `generateInvoicePdf` because both are in scope together in the workbench hook —
 * this one crosses into a Worker, the engine's own export runs `calculateTotals`
 * directly on the main thread for the live preview.
 */
const createWorker = () => new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });

export async function requestInvoicePdf(
  data: InvoiceData,
  signal: AbortSignal,
  onProgress?: (fraction: number) => void,
): Promise<GenerateInvoiceResult> {
  return runInWorker<InvoiceData, GenerateInvoiceResult>(createWorker, {
    input: data,
    signal,
    ...(onProgress ? { onProgress } : {}),
  });
}
