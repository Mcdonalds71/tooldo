import { useCallback, useMemo, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { download } from '../../lib/download';
import { cleanText, computeStats, convertCase, diffLines, summarizeDiff } from './engine';
import { describeTextToolError } from './errors';
import { SAMPLE_CHANGED, SAMPLE_CLEANUP, SAMPLE_EDIT_TEXT, SAMPLE_ORIGINAL } from './sample';
import { type CaseMode, type CleanupOptions, DEFAULT_CLEANUP, type TextMode } from './types';

/**
 * No Worker anywhere, the same reading Timezone Finder's ADR 0011 gives the rest of
 * the suite: every operation here — counting, cleaning, case conversion, even the LCS
 * diff at its capped size — is a synchronous string or array operation completing in
 * a millisecond or two, worlds away from the kind of work that needs to leave the main
 * thread. Everything below is computed directly with `useMemo`, recomputed on every
 * keystroke, the same as the totals in the invoice tool's live preview.
 */
export function useTextWorkbench() {
  const { notify } = useToast();
  const [mode, setMode] = useState<TextMode>('edit');
  const [editText, setEditText] = useState('');
  const [cleanup, setCleanup] = useState<CleanupOptions>(DEFAULT_CLEANUP);
  const [caseMode, setCaseMode] = useState<CaseMode>('none');
  const [originalText, setOriginalText] = useState('');
  const [changedText, setChangedText] = useState('');

  const inputStats = useMemo(() => computeStats(editText), [editText]);
  const outputText = useMemo(
    () => convertCase(cleanText(editText, cleanup), caseMode),
    [editText, cleanup, caseMode],
  );
  const outputStats = useMemo(() => computeStats(outputText), [outputText]);

  const diffOutcome = useMemo(() => {
    try {
      const lines = diffLines(originalText, changedText);
      return { ok: true as const, lines, summary: summarizeDiff(lines) };
    } catch (cause) {
      return {
        ok: false as const,
        message: describeTextToolError(cause instanceof Error ? cause.name : ''),
      };
    }
  }, [originalText, changedText]);

  const updateCleanup = useCallback((patch: Partial<CleanupOptions>) => {
    setCleanup((current) => ({ ...current, ...patch }));
  }, []);

  const copyOutput = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(outputText);
      notify({ title: 'Copied to your clipboard', tone: 'success' });
    } catch {
      notify({ title: "Couldn't copy — try selecting and copying manually", tone: 'error' });
    }
  }, [outputText, notify]);

  const downloadOutput = useCallback(() => {
    download(new Blob([outputText], { type: 'text/plain' }), 'cleaned-text.txt');
  }, [outputText]);

  const trySample = useCallback(() => {
    setMode('edit');
    setEditText(SAMPLE_EDIT_TEXT);
    setCleanup(SAMPLE_CLEANUP);
    setCaseMode('none');
    setOriginalText(SAMPLE_ORIGINAL);
    setChangedText(SAMPLE_CHANGED);
  }, []);

  const reset = useCallback(() => {
    setEditText('');
    setCleanup(DEFAULT_CLEANUP);
    setCaseMode('none');
    setOriginalText('');
    setChangedText('');
  }, []);

  const actions = useMemo(
    () => ({
      setMode,
      setEditText,
      updateCleanup,
      setCaseMode,
      setOriginalText,
      setChangedText,
      copyOutput,
      downloadOutput,
      trySample,
      reset,
    }),
    [updateCleanup, copyOutput, downloadOutput, trySample, reset],
  );

  return {
    mode,
    editText,
    cleanup,
    caseMode,
    outputText,
    inputStats,
    outputStats,
    originalText,
    changedText,
    diffOutcome,
    actions,
  };
}

export type TextActions = ReturnType<typeof useTextWorkbench>['actions'];
