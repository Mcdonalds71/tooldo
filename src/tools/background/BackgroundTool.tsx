import { motion } from 'motion/react';
import type { ReactNode } from 'react';
import { Button } from '../../design-system/components/Button';
import { Dropzone } from '../../design-system/components/Dropzone';
import { EmptyState } from '../../design-system/components/EmptyState';
import { FileQueue, type QueueItem } from '../../design-system/components/FileQueue';
import { ProcessingOverlay } from '../../design-system/components/ProcessingOverlay';
import { ToastProvider } from '../../design-system/components/Toast';
import { fadeUp, instant, useReducedMotion } from '../../design-system/motion';
import { download } from '../../lib/download';
import { BackgroundArt } from './BackgroundArt';
import { describeRemoveFailure } from './errors';
import type { RemoveOutcome } from './types';
import { BACKGROUND_ACCEPT, MAX_FILES, MAX_IMAGE_BYTES } from './types';
import { type QueuedFile, type Stage, useBackgroundWorkbench } from './useBackgroundWorkbench';
import { useZipDownload } from './useZipDownload';

export function BackgroundTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { stage, queue, actions } = useBackgroundWorkbench();
  const reduced = useReducedMotion();
  const zip = useZipDownload();

  const processing = stage.name === 'processing' ? stage : undefined;
  let body: ReactNode;

  if (stage.name === 'error') {
    body = (
      <EmptyState
        variant="error"
        illustration={<BackgroundArt />}
        headline={stage.message}
        subtext="Nothing was sent anywhere — the photo never left your device."
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
        headline="Drop a photo to erase its background"
        hint="Any subject, not just people — it comes back as a transparent PNG, nothing is uploaded."
        accept={BACKGROUND_ACCEPT}
        maxBytes={MAX_IMAGE_BYTES}
        maxFiles={MAX_FILES}
        illustration={<BackgroundArt />}
        onFiles={actions.addFiles}
        onReject={actions.reject}
        sample={{ label: 'No photo handy? Try a sample', onTry: actions.trySample }}
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
      <div className="background-tool__board">
        <FileQueue items={items} label="Photos to process" onRemove={actions.removeFile} />

        <Dropzone
          size="sm"
          headline="Drop more photos to add them"
          hint="They join the same batch."
          accept={BACKGROUND_ACCEPT}
          maxBytes={MAX_IMAGE_BYTES}
          maxFiles={MAX_FILES}
          onFiles={actions.addFiles}
          onReject={actions.reject}
        />

        <div className="background-tool__actions">
          <Button variant="ghost" onClick={actions.reset}>
            Start over
          </Button>
          <Button variant="primary" onClick={actions.run}>
            Remove {items.length} {items.length === 1 ? 'background' : 'backgrounds'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="background-tool">
      <motion.div
        key={stage.name}
        variants={reduced ? instant : fadeUp}
        initial="hidden"
        animate="visible"
      >
        {body}
      </motion.div>

      <ProcessingOverlay
        open={processing !== undefined}
        title={
          processing?.phase === 'loading-model'
            ? 'Getting the model ready'
            : 'Erasing the background'
        }
        detail={processing ? processingDetail(processing) : undefined}
        progress={processing?.progress}
        onCancel={actions.cancel}
      />
    </div>
  );
}

function processingDetail(stage: Extract<Stage, { name: 'processing' }>): string {
  if (stage.phase === 'loading-model') {
    return 'One-time download — it stays cached on this device from here on.';
  }

  return `Photo ${stage.current} of ${stage.total}.`;
}

interface ResultViewProps {
  readonly queue: readonly QueuedFile[];
  readonly outcomes: readonly RemoveOutcome[];
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
      error: describeRemoveFailure(entry.file.name),
    };
  });

  const succeeded = outcomes.filter((outcome) => outcome.ok);

  return (
    <div className="background-tool__board">
      {succeeded.length > 0 ? (
        <p className="background-tool__stat">
          <strong>{succeeded.length}</strong>
          <span>of {queue.length} cut out</span>
        </p>
      ) : null}

      <FileQueue
        items={items}
        label="Cutouts"
        onDownload={(id) => {
          const index = queue.findIndex((entry) => entry.id === id);
          const outcome = outcomes[index];
          if (!outcome?.ok) return;

          download(new Blob([outcome.bytes], { type: outcome.mimeType }), outcome.name);
        }}
      />

      <div className="background-tool__actions">
        <Button variant="ghost" onClick={onReset}>
          Start over
        </Button>
        <Button variant="secondary" onClick={onKeepEditing}>
          Add more photos
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
