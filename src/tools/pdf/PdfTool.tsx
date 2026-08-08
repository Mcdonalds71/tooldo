import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Button } from '../../design-system/components/Button';
import { DropArt } from '../../design-system/components/DropArt';
import { Dropzone } from '../../design-system/components/Dropzone';
import { EmptyState } from '../../design-system/components/EmptyState';
import { ProcessingOverlay } from '../../design-system/components/ProcessingOverlay';
import { ToastProvider } from '../../design-system/components/Toast';
import { fadeUp, instant, useReducedMotion } from '../../design-system/motion';
import { BoardToolbar } from './BoardToolbar';
import { PageBoard } from './PageBoard';
import { PdfResult } from './PdfResult';
import { MAX_PDF_BYTES, PDF_ACCEPT } from './types';
import { type Stage, usePdfWorkbench } from './usePdfWorkbench';

function viewName(stage: Stage, pageCount: number): string {
  if (stage.name === 'result' || stage.name === 'error') return stage.name;

  return pageCount === 0 ? 'idle' : 'board';
}

/**
 * Reading names the file it is on, because `inspect` reports once per file and that
 * number is exact. Saving doesn't pretend to: its progress spans loading and copying,
 * so a page count there would be a guess dressed up as a fact.
 */
function describeWork(stage: Extract<Stage, { name: 'reading' | 'saving' }>): string {
  if (stage.name === 'saving') return 'Copying them in the order you set.';
  if (stage.total === 1) return 'Nothing is being uploaded.';

  const current = Math.min(stage.total, Math.floor(stage.progress * stage.total) + 1);

  return `File ${current} of ${stage.total}.`;
}

export function PdfTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { stage, pages, origins, thumbnails, actions } = usePdfWorkbench();
  const reduced = useReducedMotion();

  const working = stage.name === 'reading' || stage.name === 'saving' ? stage : undefined;
  const first = pages[0];
  const lead = first ? thumbnails.urls.get(first.id) : undefined;
  let body: ReactNode;

  if (stage.name === 'result') {
    body = (
      <PdfResult
        blob={stage.blob}
        filename={stage.filename}
        pages={stage.pages}
        {...(lead ? { preview: lead } : {})}
        onKeepEditing={actions.keepEditing}
        onReset={actions.reset}
      />
    );
  } else if (stage.name === 'error') {
    body = (
      <EmptyState
        variant="error"
        illustration={<DropArt />}
        headline={stage.message}
        subtext="Nothing was sent anywhere — the file never left your device."
        primaryAction={
          <Button variant="primary" onClick={actions.reset}>
            Try another file
          </Button>
        }
        sampleAction={{ label: 'Or open the sample', onTry: actions.trySample }}
      />
    );
  } else if (pages.length === 0) {
    body = (
      <Dropzone
        headline="Drop a PDF to merge, reorder, or trim it"
        hint="Its pages open as a board you can rearrange. All of it happens in this tab — nothing is uploaded."
        accept={PDF_ACCEPT}
        maxBytes={MAX_PDF_BYTES}
        illustration={<DropArt />}
        onFiles={actions.addFiles}
        onReject={actions.reject}
        sample={{ label: 'No file handy? Try a sample', onTry: actions.trySample }}
      />
    );
  } else {
    body = (
      <div className="pdf-tool__board">
        <BoardToolbar
          pages={pages.length}
          files={origins.length}
          onSort={actions.sort}
          onReverse={actions.reverse}
          onRotateEvery={actions.rotateEvery}
          onReset={actions.reset}
          onSave={actions.save}
        />

        <PageBoard
          pages={pages}
          thumbnails={thumbnails.urls}
          origins={origins}
          previewsUnavailable={thumbnails.unavailable}
          onMove={actions.move}
          onShift={actions.shift}
          onRotate={actions.rotate}
          onRemove={actions.remove}
        />

        <Dropzone
          size="sm"
          headline="Drop another PDF to merge it in"
          hint="Its pages land at the end of the board."
          accept={PDF_ACCEPT}
          maxBytes={MAX_PDF_BYTES}
          onFiles={actions.addFiles}
          onReject={actions.reject}
        />
      </div>
    );
  }

  return (
    <div className="pdf-tool">
      {/* Keyed so each turn of the flow fades in rather than swapping under the cursor. */}
      <motion.div
        key={viewName(stage, pages.length)}
        variants={reduced ? instant : fadeUp}
        initial="hidden"
        animate="visible"
      >
        {body}
      </motion.div>

      <ProcessingOverlay
        open={working !== undefined}
        title={working?.name === 'saving' ? 'Building your PDF' : 'Reading the pages'}
        {...(working ? { detail: describeWork(working), progress: working.progress } : {})}
        onCancel={actions.cancel}
      />
    </div>
  );
}
