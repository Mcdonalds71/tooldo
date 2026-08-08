import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { convertImages, loadSample } from './client';
import { DEFAULT_OPTIONS, toConvertOptions } from './options';
import type { UiOptions } from './optionTypes';
import type { ConvertOutcome } from './types';

export interface QueuedFile {
  readonly id: string;
  readonly file: File;
}

export type Stage =
  | { readonly name: 'empty' }
  | { readonly name: 'ready' }
  | { readonly name: 'converting'; readonly progress: number; readonly total: number }
  | { readonly name: 'result'; readonly outcomes: readonly ConvertOutcome[] }
  | { readonly name: 'error'; readonly message: string };

const GENERIC_FAILURE = 'Conversion stopped part way through — try again';

export function useImagesWorkbench() {
  const { notify } = useToast();
  const [queue, setQueue] = useState<readonly QueuedFile[]>([]);
  const [options, setOptions] = useState<UiOptions>(DEFAULT_OPTIONS);
  const [stage, setStage] = useState<Stage>({ name: 'empty' });
  const running = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    const controller = new AbortController();
    running.current = controller;

    return controller.signal;
  }, []);

  const addFiles = useCallback((incoming: readonly File[]) => {
    if (incoming.length === 0) return;

    setQueue((current) => [
      ...current,
      ...incoming.map((file) => ({ id: crypto.randomUUID(), file })),
    ]);
    setStage((current) => (current.name === 'empty' ? { name: 'ready' } : current));
  }, []);

  const trySample = useCallback(async () => {
    const signal = start();

    try {
      addFiles([await loadSample(signal)]);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      notify({ title: "Couldn't load the sample — try again", tone: 'error' });
    }
  }, [addFiles, notify, start]);

  const removeFile = useCallback((id: string) => {
    setQueue((current) => {
      const next = current.filter((entry) => entry.id !== id);
      if (next.length === 0) setStage({ name: 'empty' });
      return next;
    });
  }, []);

  const convert = useCallback(async () => {
    const signal = start();
    const total = queue.length;
    setStage({ name: 'converting', progress: 0, total });

    try {
      const result = await convertImages(
        queue.map((entry) => entry.file),
        toConvertOptions(options),
        signal,
        (progress) => setStage({ name: 'converting', progress, total }),
      );

      setStage({ name: 'result', outcomes: result.outcomes });
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') {
        setStage({ name: 'ready' });
        return;
      }
      setStage({ name: 'error', message: GENERIC_FAILURE });
    }
  }, [options, queue, start]);

  const actions = useMemo(
    () => ({
      addFiles,
      trySample,
      removeFile,
      convert,
      setOptions,
      keepEditing: () => setStage({ name: 'ready' }),
      cancel: () => running.current?.abort(),
      reset: () => {
        running.current?.abort();
        setQueue([]);
        setStage({ name: 'empty' });
      },
      reject: (messages: readonly string[]) => {
        for (const message of messages) notify({ title: message, tone: 'error' });
      },
    }),
    [addFiles, convert, notify, removeFile, trySample],
  );

  return { stage, queue, options, actions };
}
