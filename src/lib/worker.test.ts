import { describe, expect, it, vi } from 'vitest';
import { runInWorker, type WorkerResponse, WorkerTaskError } from './worker';

type Listener = (event: unknown) => void;

/** Stands in for a real Worker so the protocol can be tested without a browser. */
class FakeWorker {
  terminated = false;
  readonly sent: unknown[] = [];
  private readonly listeners = new Map<string, Set<Listener>>();

  addEventListener(type: string, listener: Listener) {
    const existing = this.listeners.get(type) ?? new Set<Listener>();
    existing.add(listener);
    this.listeners.set(type, existing);
  }

  removeEventListener(type: string, listener: Listener) {
    this.listeners.get(type)?.delete(listener);
  }

  postMessage(message: unknown) {
    this.sent.push(message);
  }

  terminate() {
    this.terminated = true;
  }

  reply(response: WorkerResponse<unknown>) {
    for (const listener of this.listeners.get('message') ?? []) listener({ data: response });
  }

  fail(message: string) {
    for (const listener of this.listeners.get('error') ?? []) listener({ message });
  }

  get listenerCount() {
    return [...this.listeners.values()].reduce((total, set) => total + set.size, 0);
  }
}

const start = <TOut>(worker: FakeWorker, options: Parameters<typeof runInWorker>[1]) =>
  runInWorker<unknown, TOut>(() => worker as unknown as Worker, options);

describe('runInWorker', () => {
  it('sends the input and resolves with the output', async () => {
    const worker = new FakeWorker();
    const result = start<number>(worker, { input: { files: 2 } });

    expect(worker.sent).toEqual([{ type: 'run', input: { files: 2 } }]);

    worker.reply({ type: 'result', output: 42 });

    await expect(result).resolves.toBe(42);
    expect(worker.terminated).toBe(true);
    expect(worker.listenerCount).toBe(0);
  });

  it('reports progress without settling', async () => {
    const worker = new FakeWorker();
    const onProgress = vi.fn();
    const result = start<string>(worker, { input: null, onProgress });

    worker.reply({ type: 'progress', value: 0.25 });
    worker.reply({ type: 'progress', value: 0.75 });

    expect(onProgress.mock.calls).toEqual([[0.25], [0.75]]);
    expect(worker.terminated).toBe(false);

    worker.reply({ type: 'result', output: 'done' });
    await expect(result).resolves.toBe('done');
  });

  it("keeps the engine's error name across the worker boundary", async () => {
    const worker = new FakeWorker();
    const result = start(worker, { input: null });

    worker.reply({ type: 'error', name: 'UnsupportedFileError', message: "That file isn't a PDF" });

    await expect(result).rejects.toThrow(WorkerTaskError);
    await expect(result).rejects.toMatchObject({
      name: 'UnsupportedFileError',
      message: "That file isn't a PDF",
    });
    expect(worker.terminated).toBe(true);
  });

  it('surfaces a worker that crashes outright', async () => {
    const worker = new FakeWorker();
    const result = start(worker, { input: null });

    worker.fail('out of memory');

    await expect(result).rejects.toMatchObject({ name: 'WorkerError', message: 'out of memory' });
    expect(worker.terminated).toBe(true);
  });

  it('cancels through an abort signal and tears the worker down', async () => {
    const worker = new FakeWorker();
    const controller = new AbortController();
    const result = start(worker, { input: null, signal: controller.signal });

    controller.abort();

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.terminated).toBe(true);
    expect(worker.listenerCount).toBe(0);
  });

  it('never starts work for an already-aborted signal', async () => {
    const worker = new FakeWorker();
    const result = start(worker, { input: null, signal: AbortSignal.abort() });

    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(worker.sent).toEqual([]);
  });
});
