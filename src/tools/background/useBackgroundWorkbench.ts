import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { outputName } from './imageUtils';
import { removeBackground } from './segmenterClient';
import type { RemoveOutcome, RemovePhase } from './types';
import { loadSample } from './utilityClient';

export interface QueuedFile {
  readonly id: string;
  readonly file: File;
}

export type Stage =
  | { readonly name: 'empty' }
  | { readonly name: 'ready' }
  | {
      readonly name: 'processing';
      readonly phase: RemovePhase;
      readonly progress: number;
      readonly current: number;
      readonly total: number;
    }
  | { readonly name: 'result'; readonly outcomes: readonly RemoveOutcome[] }
  | { readonly name: 'error'; readonly message: string };

const GENERIC_FAILURE = 'Nothing came through — try again, or a different photo';

export function useBackgroundWorkbench() {
  const { notify } = useToast();
  const [queue, setQueue] = useState<readonly QueuedFile[]>([]);
  const [stage, setStage] = useState<Stage>({ name: 'empty' });
  const cancelled = useRef(false);

  const addFiles = useCallback((incoming: readonly File[]) => {
    if (incoming.length === 0) return;

    setQueue((current) => [
      ...current,
      ...incoming.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
    setStage((current) => (current.name === 'empty' ? { name: 'ready' } : current));
  }, []);

  const trySample = useCallback(async () => {
    try {
      addFiles([await loadSample(new AbortController().signal)]);
    } catch {
      notify({ title: "Couldn't load the sample — try again", tone: 'error' });
    }
  }, [addFiles, notify]);

  const removeFile = useCallback((id: string) => {
    setQueue((current) => {
      const next = current.filter((entry) => entry.id !== id);
      if (next.length === 0) setStage({ name: 'empty' });
      return next;
    });
  }, []);

  const run = useCallback(async () => {
    cancelled.current = false;
    const total = queue.length;
    const outcomes: RemoveOutcome[] = [];

    setStage({ name: 'processing', phase: 'loading-model', progress: 0, current: 1, total });

    for (const [index, entry] of queue.entries()) {
      if (cancelled.current) break;

      try {
        const result = await removeBackground(entry.file, (progress) => {
          setStage({
            name: 'processing',
            phase: progress.phase,
            progress: progress.fraction,
            current: index + 1,
            total,
          });
        });

        outcomes.push({
          ok: true,
          name: outputName(entry.file.name),
          mimeType: 'image/png',
          bytes: result.bytes,
          originalBytes: entry.file.size,
          width: result.width,
          height: result.height,
        });
      } catch {
        outcomes.push({ ok: false, name: entry.file.name });
      }
    }

    if (cancelled.current) {
      setStage({ name: 'ready' });
      return;
    }

    if (outcomes.every((outcome) => !outcome.ok)) {
      setStage({ name: 'error', message: GENERIC_FAILURE });
      return;
    }

    setStage({ name: 'result', outcomes });
  }, [queue]);

  const actions = useMemo(
    () => ({
      addFiles,
      trySample,
      removeFile,
      run,
      keepEditing: () => setStage({ name: 'ready' }),
      // Inference can't be interrupted mid-image — this stops the queue from starting
      // the next one rather than cutting the current one off part way through.
      cancel: () => {
        cancelled.current = true;
      },
      reset: () => {
        cancelled.current = true;
        setQueue([]);
        setStage({ name: 'empty' });
      },
      reject: (messages: readonly string[]) => {
        for (const message of messages) notify({ title: message, tone: 'error' });
      },
    }),
    [addFiles, notify, removeFile, run, trySample],
  );

  return { stage, queue, actions };
}
