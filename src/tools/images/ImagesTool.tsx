import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Button } from '../../design-system/components/Button';
import { DropArt } from '../../design-system/components/DropArt';
import { Dropzone } from '../../design-system/components/Dropzone';
import { EmptyState } from '../../design-system/components/EmptyState';
import { FileQueue, type QueueItem } from '../../design-system/components/FileQueue';
import { ProcessingOverlay } from '../../design-system/components/ProcessingOverlay';
import { ToastProvider } from '../../design-system/components/Toast';
import { fadeUp, instant, useReducedMotion } from '../../design-system/motion';
import { download } from '../../lib/download';
import { describeConvertFailure } from './errors';
import { ImageOptions } from './ImageOptions';
import type { ConvertOutcome } from './types';
import { IMAGE_ACCEPT, MAX_FILES, MAX_IMAGE_BYTES } from './types';
import { type QueuedFile, type Stage, useImagesWorkbench } from './useImagesWorkbench';
import { useZipDownload } from './useZipDownload';

export function ImagesTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { stage, queue, options, actions } = useImagesWorkbench();
  const reduced = useReducedMotion();
  const zip = useZipDownload();

  const converting = stage.name === 'converting' ? stage : undefined;
  let body: ReactNode;

  if (stage.name === 'error') {
    body = (
      <EmptyState
        variant="error"
        illustration={<DropArt />}
        headline={stage.message}
        subtext="Nothing was sent anywhere — the files never left your device."
        primaryAction={
          <Button variant="primary" onClick={actions.reset}>
            Try again
          </Button>
        }
      />
    );
  } else if (stage.name === 'result') {
    body = (
      <ResultView
        queue={queue}
        outcomes={stage.outcomes}
        zip={zip}
        onReset={actions.reset}
        onKeepEditing={actions.keepEditing}
      />
    );
  } else if (stage.name === 'empty') {
    body = (
      <Dropzone
        headline="Drop images to convert or shrink them"
        hint="Change the format, resize, or hit a size target — it all happens in this tab, nothing is uploaded."
        accept={IMAGE_ACCEPT}
        maxBytes={MAX_IMAGE_BYTES}
        maxFiles={MAX_FILES}
        illustration={<DropArt />}
        onFiles={actions.addFiles}
        onReject={actions.reject}
        sample={{ label: 'No file handy? Try a sample', onTry: actions.trySample }}
      />
    );
  } else {
    const items: QueueItem[] = queue.map((entry) => ({
      id: entry.id,
      name: entry.file.name,
      size: entry.file.size,
      status: 'queued',
    }));

    body = (
      <div className="images-tool__board">
        <FileQueue items={items} label="Images to convert" onRemove={actions.removeFile} />

        <Dropzone
          size="sm"
          headline="Drop more images to add them"
          hint="They join the same batch."
          accept={IMAGE_ACCEPT}
          maxBytes={MAX_IMAGE_BYTES}
          maxFiles={MAX_FILES}
          onFiles={actions.addFiles}
          onReject={actions.reject}
        />

        <ImageOptions value={options} onChange={actions.setOptions} />

        <div className="images-tool__actions">
          <Button variant="ghost" onClick={actions.reset}>
            Start over
          </Button>
          <Button variant="primary" onClick={actions.convert}>
            Convert {items.length} {items.length === 1 ? 'image' : 'images'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="images-tool">
      <motion.div
        key={stage.name}
        variants={reduced ? instant : fadeUp}
        initial="hidden"
        animate="visible"
      >
        {body}
      </motion.div>

      <ProcessingOverlay
        open={converting !== undefined}
        title="Converting your images"
        detail={converting ? `Image ${currentFile(converting)} of ${converting.total}.` : undefined}
        progress={converting?.progress}
        onCancel={actions.cancel}
      />
    </div>
  );
}

function currentFile(stage: Extract<Stage, { name: 'converting' }>): number {
  return Math.min(stage.total, Math.floor(stage.progress * stage.total) + 1);
}

interface ResultViewProps {
  readonly queue: readonly QueuedFile[];
  readonly outcomes: readonly ConvertOutcome[];
  readonly zip: ReturnType<typeof useZipDownload>;
  readonly onReset: () => void;
  readonly onKeepEditing: () => void;
}

function ResultView({ queue, outcomes, zip, onReset, onKeepEditing }: ResultViewProps) {
  const items: QueueItem[] = queue.map((entry, index) => {
    const outcome = outcomes[index];

    if (outcome?.ok) {
      return {
        id: entry.id,
        name: outcome.name,
        size: outcome.originalBytes,
        status: 'done',
        outputSize: outcome.bytes.length,
      };
    }

    return {
      id: entry.id,
      name: entry.file.name,
      size: entry.file.size,
      status: 'failed',
      error: describeConvertFailure(entry.file.name),
    };
  });

  const succeeded = outcomes.filter((outcome) => outcome.ok);
  const originalTotal = succeeded.reduce((total, outcome) => total + outcome.originalBytes, 0);
  const outputTotal = succeeded.reduce((total, outcome) => total + outcome.bytes.length, 0);
  const savedPercent = originalTotal > 0 ? Math.round((1 - outputTotal / originalTotal) * 100) : 0;

  return (
    <div className="images-tool__board">
      {succeeded.length > 0 ? (
        <p className="images-tool__stat">
          <strong>{savedPercent > 0 ? `${savedPercent}% smaller` : 'Converted'}</strong>
          <span>
            {succeeded.length} of {queue.length} converted
          </span>
        </p>
      ) : null}

      <FileQueue
        items={items}
        label="Converted images"
        onDownload={(id) => {
          const index = queue.findIndex((entry) => entry.id === id);
          const outcome = outcomes[index];
          if (!outcome?.ok) return;

          download(new Blob([outcome.bytes], { type: outcome.mimeType }), outcome.name);
        }}
      />

      <div className="images-tool__actions">
        <Button variant="ghost" onClick={onReset}>
          Start over
        </Button>
        <Button variant="secondary" onClick={onKeepEditing}>
          Convert again
        </Button>
        {succeeded.length > 1 ? (
          <Button
            variant="primary"
            loading={zip.state.status === 'working'}
            loadingLabel="Zipping"
            onClick={() =>
              zip.state.status === 'ready'
                ? zip.save()
                : zip.prepare(
                    succeeded.map((outcome) => ({ name: outcome.name, bytes: outcome.bytes })),
                  )
            }
          >
            {zip.state.status === 'ready' ? 'Save the zip' : 'Download all (.zip)'}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
