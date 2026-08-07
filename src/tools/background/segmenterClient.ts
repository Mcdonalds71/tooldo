import { WorkerTaskError } from '../../lib/worker';
import type { RemoveProgress, RemoveResult, SegmenterRequest, SegmenterResponse } from './types';

/**
 * The main-thread half of the persistent worker: one `Worker` for the tool's whole
 * session, created lazily on first use and never terminated by this client — see
 * `worker.ts` for why. The segmentation pipeline only processes one image at a time
 * regardless, so a single pending-listener pair is all this ever needs; there's no
 * second call in flight to route a reply to.
 */
let worker: Worker | undefined;

function getWorker(): Worker {
  worker ??= new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
  return worker;
}

export function removeBackground(
  file: File,
  onProgress: (progress: RemoveProgress) => void,
): Promise<RemoveResult> {
  const scope = getWorker();

  return new Promise((resolve, reject) => {
    const handleMessage = (event: MessageEvent<SegmenterResponse>) => {
      const message = event.data;

      if (message.type === 'progress') {
        onProgress(message.progress);
        return;
      }

      scope.removeEventListener('message', handleMessage);
      scope.removeEventListener('error', handleFailure);

      if (message.type === 'result') {
        resolve(message.output);
      } else {
        reject(new WorkerTaskError(message.name, message.message));
      }
    };

    const handleFailure = (event: ErrorEvent) => {
      scope.removeEventListener('message', handleMessage);
      scope.removeEventListener('error', handleFailure);

      // Unlike a `{ type: 'error' }` message — which `worker.ts` sends from inside its
      // own try/catch, worker very much still alive — this event means the worker
      // thread itself broke (an OOM, a WASM trap). It won't answer another message, so
      // the next call needs a fresh one rather than posting into the void forever.
      scope.terminate();
      worker = undefined;

      reject(new WorkerTaskError('WorkerError', event.message));
    };

    scope.addEventListener('message', handleMessage);
    scope.addEventListener('error', handleFailure);

    const request: SegmenterRequest = { type: 'remove', file };
    scope.postMessage(request);
  });
}
