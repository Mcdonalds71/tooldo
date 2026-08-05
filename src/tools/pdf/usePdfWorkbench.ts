import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import {
  appendPages,
  type BoardPage,
  movePage,
  removePage,
  rotateAll,
  rotatePage,
  shiftPage,
  toPlan,
} from './board';
import { buildPdf, inspectFiles, loadSample } from './client';
import { describePdfError } from './errors';
import { usePageThumbnails } from './usePageThumbnails';

export type Stage =
  | { readonly name: 'empty' }
  | { readonly name: 'reading'; readonly progress: number }
  | { readonly name: 'ready' }
  | { readonly name: 'saving'; readonly progress: number }
  | {
      readonly name: 'result';
      readonly blob: Blob;
      readonly filename: string;
      readonly pages: number;
    }
  | { readonly name: 'error'; readonly message: string };

interface Board {
  readonly files: readonly File[];
  readonly pages: readonly BoardPage[];
}

const EMPTY: Board = { files: [], pages: [] };

/**
 * The tool's state and everything asynchronous it does. Keeping it here leaves the
 * island as a rendering of `stage`, which is the whole reason the flow reads the same
 * in every tool.
 */
export function usePdfWorkbench() {
  const { notify } = useToast();
  const [board, setBoard] = useState<Board>(EMPTY);
  const [stage, setStage] = useState<Stage>({ name: 'empty' });
  const running = useRef<AbortController | null>(null);
  const thumbnails = usePageThumbnails(board.files);

  /**
   * A failure with pages already on the board is a passing setback — say it and leave
   * the work alone. A failure on the first file has nothing to go back to, so it takes
   * over the empty state instead.
   */
  const fail = useCallback(
    (cause: unknown, keepBoard: boolean) => {
      if (cause instanceof Error && cause.name === 'AbortError') {
        setStage(keepBoard ? { name: 'ready' } : { name: 'empty' });
        return;
      }

      const message = describePdfError(cause instanceof Error ? cause.name : '');

      if (keepBoard) {
        notify({ title: message, tone: 'error' });
        setStage({ name: 'ready' });
      } else {
        setStage({ name: 'error', message });
      }
    },
    [notify],
  );

  const start = useCallback(() => {
    const controller = new AbortController();
    running.current = controller;

    return controller.signal;
  }, []);

  const addFiles = useCallback(
    async (incoming: readonly File[]) => {
      if (incoming.length === 0) return;

      const signal = start();
      const keepBoard = board.pages.length > 0;
      setStage({ name: 'reading', progress: 0 });

      try {
        const inspected = await inspectFiles(incoming, signal, (progress) =>
          setStage({ name: 'reading', progress }),
        );

        setBoard((current) => ({
          files: [...current.files, ...incoming],
          pages: appendPages(current.pages, inspected, current.files.length),
        }));
        setStage({ name: 'ready' });
      } catch (cause) {
        fail(cause, keepBoard);
      }
    },
    [board.pages.length, fail, start],
  );

  const trySample = useCallback(async () => {
    const signal = start();
    setStage({ name: 'reading', progress: 0 });

    try {
      await addFiles([await loadSample(signal)]);
    } catch (cause) {
      fail(cause, board.pages.length > 0);
    }
  }, [addFiles, board.pages.length, fail, start]);

  const save = useCallback(async () => {
    const signal = start();
    setStage({ name: 'saving', progress: 0 });

    try {
      const built = await buildPdf(board.files, toPlan(board.pages), signal, (progress) =>
        setStage({ name: 'saving', progress }),
      );

      setStage({
        name: 'result',
        blob: new Blob([built.bytes], { type: 'application/pdf' }),
        filename: outputName(board.files),
        pages: built.pages,
      });
    } catch (cause) {
      fail(cause, true);
    }
  }, [board.files, board.pages, fail, start]);

  const edit = useCallback((change: (pages: readonly BoardPage[]) => BoardPage[]) => {
    setBoard((current) => {
      const pages = change(current.pages);

      // The last page leaving takes its file with it, back to a clean sheet.
      return pages.length === 0 ? EMPTY : { ...current, pages };
    });
  }, []);

  const actions = useMemo(
    () => ({
      addFiles,
      trySample,
      save,
      reject: (messages: readonly string[]) => {
        for (const message of messages) notify({ title: message, tone: 'error' });
      },
      cancel: () => running.current?.abort(),
      reset: () => {
        running.current?.abort();
        setBoard(EMPTY);
        setStage({ name: 'empty' });
      },
      keepEditing: () => setStage({ name: 'ready' }),
      move: (id: string, to: number) => edit((pages) => movePage(pages, id, to)),
      shift: (id: string, step: number) => edit((pages) => shiftPage(pages, id, step)),
      rotate: (id: string) => edit((pages) => rotatePage(pages, id)),
      rotateEvery: () => edit(rotateAll),
      remove: (id: string) => edit((pages) => removePage(pages, id)),
    }),
    [addFiles, edit, notify, save, trySample],
  );

  const origins = useMemo(() => board.files.map((file) => file.name), [board.files]);

  return { stage, pages: board.pages, origins, thumbnails, actions };
}

function outputName(files: readonly File[]): string {
  const only = files.length === 1 ? files[0] : undefined;

  return only ? `${only.name.replace(/\.pdf$/i, '')}-edited.pdf` : 'merged.pdf';
}
