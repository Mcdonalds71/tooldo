import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { download } from '../../lib/download';
import { loadSample, parseFile } from './client';
import { tableToCsv } from './csvParser';
import { sortRows } from './engine';
import { describeDataToolError } from './errors';
import { tableToJson } from './jsonTable';
import type { ParsedTable, SortState, SourceFormat } from './types';

export type Stage =
  | { readonly name: 'empty' }
  | { readonly name: 'processing' }
  | { readonly name: 'result'; readonly format: SourceFormat; readonly table: ParsedTable }
  | { readonly name: 'error'; readonly message: string };

const DEFAULT_SORT: SortState = { column: null, direction: 'asc' };

/**
 * No separate `ready` stage — every other file-in tool has one because there's an
 * option panel to fill in before the real work starts, and this tool has no options
 * at all: a dropped file goes straight from `empty` to `processing`, the same way
 * Screenshot Beautifier's own drop kicks off a render immediately (ADR 0013). Once
 * parsed, `result` holds the whole table; sorting is a client-side re-order of
 * already-parsed rows, not a reason to touch the Worker again.
 */
export function useDataWorkbench() {
  const { notify } = useToast();
  const [stage, setStage] = useState<Stage>({ name: 'empty' });
  const [sort, setSort] = useState<SortState>(DEFAULT_SORT);
  const running = useRef<AbortController | null>(null);

  const load = useCallback(async (file: File) => {
    const controller = new AbortController();
    running.current = controller;
    setStage({ name: 'processing' });
    setSort(DEFAULT_SORT);

    try {
      const { format, table } = await parseFile(file, controller.signal);
      setStage({ name: 'result', format, table });
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      setStage({
        name: 'error',
        message: describeDataToolError(cause instanceof Error ? cause.name : ''),
      });
    }
  }, []);

  const addFiles = useCallback(
    (files: readonly File[]) => {
      const file = files[0];
      if (file) void load(file);
    },
    [load],
  );

  const trySample = useCallback(async () => {
    const controller = new AbortController();

    try {
      const file = await loadSample(controller.signal);
      await load(file);
    } catch (cause) {
      if (cause instanceof Error && cause.name === 'AbortError') return;
      notify({ title: "Couldn't load the sample — try again", tone: 'error' });
    }
  }, [load, notify]);

  const toggleSort = useCallback((column: string) => {
    setSort((current) =>
      current.column === column
        ? { column, direction: current.direction === 'asc' ? 'desc' : 'asc' }
        : { column, direction: 'asc' },
    );
  }, []);

  const reset = useCallback(() => {
    running.current?.abort();
    setStage({ name: 'empty' });
    setSort(DEFAULT_SORT);
  }, []);

  const reject = useCallback(
    (messages: readonly string[]) => {
      for (const message of messages) notify({ title: message, tone: 'error' });
    },
    [notify],
  );

  const downloadAs = useCallback(
    (format: SourceFormat) => {
      if (stage.name !== 'result') return;

      const content = format === 'csv' ? tableToCsv(stage.table) : tableToJson(stage.table);
      const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
      download(new Blob([content], { type: mimeType }), `data.${format}`);
    },
    [stage],
  );

  const sortedRows = useMemo(
    () => (stage.name === 'result' ? sortRows(stage.table.rows, sort) : []),
    [stage, sort],
  );

  const actions = useMemo(
    () => ({ addFiles, trySample, toggleSort, reset, reject, downloadAs }),
    [addFiles, trySample, toggleSort, reset, reject, downloadAs],
  );

  return { stage, sort, sortedRows, actions };
}

export type DataActions = ReturnType<typeof useDataWorkbench>['actions'];
