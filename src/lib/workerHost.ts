import type { WorkerRequest, WorkerResponse } from './worker';

/**
 * Structurally typed rather than pulling in the WebWorker lib, which would clash with
 * the DOM types the rest of the app compiles against.
 */
interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

export type WorkerTask<TIn, TOut> = (
  input: TIn,
  onProgress: (fraction: number) => void,
) => Promise<TOut> | TOut;

/** The worker half of `runInWorker`. A tool's worker entry is this call and nothing else. */
export function serveWorkerTask<TIn, TOut>(task: WorkerTask<TIn, TOut>): void {
  const scope = globalThis as unknown as WorkerScope;

  scope.addEventListener('message', (event: MessageEvent) => {
    const request = event.data as WorkerRequest<TIn>;
    if (request.type !== 'run') return;

    const report = (fraction: number) => {
      const progress: WorkerResponse<TOut> = { type: 'progress', value: fraction };
      scope.postMessage(progress);
    };

    void (async () => {
      try {
        const output = await task(request.input, report);
        const result: WorkerResponse<TOut> = { type: 'result', output };
        scope.postMessage(result);
      } catch (cause) {
        const error = cause instanceof Error ? cause : new Error(String(cause));
        const failure: WorkerResponse<TOut> = {
          type: 'error',
          name: error.name,
          message: error.message,
        };
        scope.postMessage(failure);
      }
    })();
  });
}
