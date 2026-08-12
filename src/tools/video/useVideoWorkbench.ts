import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { loadSample, processVideo } from './client';
import { describeVideoError } from './errors';
import { DEFAULT_OPTIONS, toVideoOptions } from './options';
import type { UiOptions } from './optionTypes';
import type { VideoOutput } from './types';

export type Stage =
  | { readonly name: 'empty' }
  | { readonly name: 'ready' }
  | { readonly name: 'processing'; readonly progress: number }
  | { readonly name: 'result'; readonly output: VideoOutput }
  | { readonly name: 'error'; readonly message: string };

const GENERIC_FAILURE = "That video couldn't be processed — try again";

export function useVideoWorkbench() {
  const { notify } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<UiOptions>(DEFAULT_OPTIONS);
  const [stage, setStage] = useState<Stage>({ name: 'empty' });
  const running = useRef<AbortController | null>(null);

  const start = useCallback(() => {
    const controller = new AbortController();
    running.current = controller;

    return controller.signal;
  }, []);

  const addFiles = useCallback((incoming: readonly File[]) => {
    const next = incoming[0];
    if (!next) return;

    setFile(next);
    setStage({ name: 'ready' });
  }, []);

  const trySample = useCallback(async () => {
    const signal = start();

    try {
      const sample = await loadSample(signal);
      setFile(sample);
      setOptions(DEFAULT_OPTIONS);
      setStage({ name: 'ready' });
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      notify({ title: "Couldn't load the sample — try again", tone: 'error' });
    }
  }, [notify, start]);

  const run = useCallback(async () => {
    if (!file) return;

    const signal = start();
    setStage({ name: 'processing', progress: 0 });

    try {
      const output = await processVideo(file, toVideoOptions(options), signal, (progress) =>
        setStage({ name: 'processing', progress }),
      );

      setStage({ name: 'result', output });
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') {
        setStage({ name: 'ready' });
        return;
      }

      const name = cause instanceof Error ? cause.name : '';
      setStage({ name: 'error', message: name ? describeVideoError(name) : GENERIC_FAILURE });
      if (name === 'InvalidVideoError') setFile(null);
    }
  }, [file, options, start]);

  const actions = useMemo(
    () => ({
      addFiles,
      trySample,
      run,
      setOptions,
      removeFile: () => {
        setFile(null);
        setStage({ name: 'empty' });
      },
      keepEditing: () => setStage({ name: 'ready' }),
      cancel: () => running.current?.abort(),
      reset: () => {
        running.current?.abort();
        setFile(null);
        setOptions(DEFAULT_OPTIONS);
        setStage({ name: 'empty' });
      },
      reject: (messages: readonly string[]) => {
        for (const message of messages) notify({ title: message, tone: 'error' });
      },
    }),
    [addFiles, notify, run, trySample],
  );

  return { file, stage, options, actions };
}
