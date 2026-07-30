export type WorkerRequest<TIn> = {
  readonly type: 'run';
  readonly input: TIn;
};

export type WorkerResponse<TOut> =
  | { readonly type: 'progress'; readonly value: number }
  | { readonly type: 'result'; readonly output: TOut }
  | { readonly type: 'error'; readonly name: string; readonly message: string };

/** Carries the engine's error name across the worker boundary, which structured clone drops. */
export class WorkerTaskError extends Error {
  constructor(name: string, message: string) {
    super(message);
    this.name = name;
  }
}

export interface RunInWorkerOptions<TIn> {
  readonly input: TIn;
  readonly transfer?: readonly Transferable[];
  readonly signal?: AbortSignal;
  readonly onProgress?: (fraction: number) => void;
}

/**
 * The one way a tool runs heavy work. Every engine goes through here so the main
 * thread stays free for 60fps motion, and so cancellation and progress behave the
 * same in all ten tools.
 */
export function runInWorker<TIn, TOut>(
  createWorker: () => Worker,
  options: RunInWorkerOptions<TIn>,
): Promise<TOut> {
  const { input, transfer, signal, onProgress } = options;

  return new Promise<TOut>((resolve, reject) => {
    if (signal?.aborted) {
      reject(new WorkerTaskError('AbortError', 'Cancelled'));
      return;
    }

    const worker = createWorker();

    function stop() {
      worker.removeEventListener('message', handleMessage);
      worker.removeEventListener('error', handleFailure);
      signal?.removeEventListener('abort', handleAbort);
      worker.terminate();
    }

    const handleMessage = (event: MessageEvent<WorkerResponse<TOut>>) => {
      const message = event.data;

      if (message.type === 'progress') {
        onProgress?.(message.value);
        return;
      }

      stop();

      if (message.type === 'result') {
        resolve(message.output);
      } else {
        reject(new WorkerTaskError(message.name, message.message));
      }
    };

    const handleFailure = (event: ErrorEvent) => {
      stop();
      reject(new WorkerTaskError('WorkerError', event.message));
    };

    const handleAbort = () => {
      stop();
      reject(new WorkerTaskError('AbortError', 'Cancelled'));
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleFailure);
    signal?.addEventListener('abort', handleAbort, { once: true });

    const request: WorkerRequest<TIn> = { type: 'run', input };
    worker.postMessage(request, transfer ? [...transfer] : []);
  });
}
