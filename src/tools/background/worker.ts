import { removeBackground } from './engine';
import type { RemoveProgress, RemoveResult, SegmenterRequest, SegmenterResponse } from './types';

/**
 * Deliberately not `serveWorkerTask` — that helper, and the `runInWorker` client it
 * pairs with, terminate the worker after every single call. That's right for a
 * stateless conversion but wrong here: the whole point of a dedicated worker is to load
 * the model once and keep it resident for every image in the session rather than reload
 * it per file. This worker stays alive for as long as the tab does —
 * `engine.ts` owns the actual model caching, this just relays messages to it.
 *
 * Structurally typed rather than pulling in the WebWorker lib, same reasoning as
 * `workerHost.ts`: it would clash with the DOM types the rest of the app compiles
 * against.
 */
interface WorkerScope {
  postMessage(message: unknown): void;
  addEventListener(type: 'message', listener: (event: MessageEvent) => void): void;
}

const scope = globalThis as unknown as WorkerScope;

scope.addEventListener('message', (event: MessageEvent) => {
  const request = event.data as SegmenterRequest;
  if (request.type !== 'remove') return;

  const report = (progress: RemoveProgress) => {
    const message: SegmenterResponse = { type: 'progress', progress };
    scope.postMessage(message);
  };

  void (async () => {
    try {
      const output: RemoveResult = await removeBackground(request.file, report);
      const message: SegmenterResponse = { type: 'result', output };
      scope.postMessage(message);
    } catch (cause) {
      const error = cause instanceof Error ? cause : new Error(String(cause));
      const message: SegmenterResponse = {
        type: 'error',
        name: error.name,
        message: error.message,
      };
      scope.postMessage(message);
    }
  })();
});
