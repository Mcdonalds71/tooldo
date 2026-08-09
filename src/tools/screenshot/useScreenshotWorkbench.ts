import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { download } from '../../lib/download';
import { loadSample, renderScreenshot } from './client';
import { describeScreenshotError } from './errors';
import { SAMPLE_OPTIONS } from './sample';
import { type BeautifyOptions, DEFAULT_OPTIONS, type RenderedImage } from './types';

const DEBOUNCE_MS = 120;

function beautifiedFilename(originalName: string): string {
  const stem = originalName.replace(/\.[^./]+$/, '') || 'screenshot';

  return `${stem}-beautified.png`;
}

/**
 * Two states in practice, `empty` and `ready`, not the full file-tool machine — this
 * tool's "processing" is a live preview that redraws on every option change, not a
 * one-shot batch action with a result screen at the end, so there's no separate
 * `processing`/`result` step to be in. Invoice's own workbench made the same call for
 * its own reason (ADR 0010); this is this tool's version of that reasoning, not a copy
 * of it — the preview simply *is* the result, continuously.
 */
export function useScreenshotWorkbench() {
  const { notify } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [options, setOptions] = useState<BeautifyOptions>(DEFAULT_OPTIONS);
  const [renderedImage, setRenderedImage] = useState<RenderedImage | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const running = useRef<AbortController | null>(null);
  const previousFile = useRef<File | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setRenderedImage(null);
      previousFile.current = null;
      return;
    }

    const isNewFile = file !== previousFile.current;
    previousFile.current = file;

    const fire = () => {
      const controller = new AbortController();
      running.current?.abort();
      running.current = controller;
      setIsRendering(true);

      renderScreenshot(file, options, controller.signal)
        .then((image) => {
          setRenderedImage(image);
          setPreviewUrl((current) => {
            if (current) URL.revokeObjectURL(current);
            return URL.createObjectURL(new Blob([image.bytes], { type: 'image/png' }));
          });
          setIsRendering(false);
        })
        .catch((cause: unknown) => {
          if (cause instanceof Error && cause.name === 'AbortError') return;

          setIsRendering(false);
          const name = cause instanceof Error ? cause.name : '';
          notify({ title: describeScreenshotError(name), tone: 'error' });

          // The file itself is what failed to decode — there's nothing an option
          // change can fix, so back to the dropzone rather than a preview that can
          // never render.
          if (name === 'InvalidImageError') setFile(null);
        });
    };

    if (isNewFile) {
      fire();
      return;
    }

    const timeoutId = window.setTimeout(fire, DEBOUNCE_MS);
    return () => window.clearTimeout(timeoutId);
  }, [file, options, notify]);

  const addFile = useCallback((files: readonly File[]) => {
    const next = files[0];
    if (next) setFile(next);
  }, []);

  const updateOptions = useCallback((patch: Partial<BeautifyOptions>) => {
    setOptions((current) => ({ ...current, ...patch }));
  }, []);

  const trySample = useCallback(async () => {
    const controller = new AbortController();

    try {
      const sampleFile = await loadSample(controller.signal);
      setOptions(SAMPLE_OPTIONS);
      setFile(sampleFile);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      notify({ title: "Couldn't load the sample — try again", tone: 'error' });
    }
  }, [notify]);

  const reset = useCallback(() => {
    running.current?.abort();
    setFile(null);
    setOptions(DEFAULT_OPTIONS);
  }, []);

  const downloadImage = useCallback(() => {
    if (!renderedImage || !file) return;

    download(new Blob([renderedImage.bytes], { type: 'image/png' }), beautifiedFilename(file.name));
  }, [file, renderedImage]);

  const actions = useMemo(
    () => ({
      addFile,
      updateOptions,
      trySample,
      reset,
      download: downloadImage,
      reject: (messages: readonly string[]) => {
        for (const message of messages) notify({ title: message, tone: 'error' });
      },
    }),
    [addFile, downloadImage, notify, reset, trySample, updateOptions],
  );

  return { file, options, previewUrl, isRendering, actions };
}

export type ScreenshotActions = ReturnType<typeof useScreenshotWorkbench>['actions'];
