import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { motion } from 'motion/react';
import { type ReactNode, useEffect, useState } from 'react';
import { Button } from '../../design-system/components/Button';
import { DropArt } from '../../design-system/components/DropArt';
import { Dropzone } from '../../design-system/components/Dropzone';
import { EmptyState } from '../../design-system/components/EmptyState';
import { FileQueue, type QueueItem } from '../../design-system/components/FileQueue';
import { ProcessingOverlay } from '../../design-system/components/ProcessingOverlay';
import { ResultPanel } from '../../design-system/components/ResultPanel';
import { ToastProvider } from '../../design-system/components/Toast';
import { fadeUp, instant, useReducedMotion } from '../../design-system/motion';
import { download } from '../../lib/download';
import { formatBytes } from '../../lib/formatBytes';
import { MAX_VIDEO_BYTES, VIDEO_ACCEPT, type VideoOutput } from './types';
import { useVideoWorkbench } from './useVideoWorkbench';
import { VideoOptions } from './VideoOptions';

export function VideoTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { file, stage, options, actions } = useVideoWorkbench();
  const reduced = useReducedMotion();

  const processing = stage.name === 'processing' ? stage : undefined;
  let body: ReactNode;

  if (stage.name === 'error') {
    body = (
      <EmptyState
        variant="error"
        illustration={<DropArt />}
        headline={stage.message}
        subtext="Nothing was sent anywhere — the video never left your device."
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
        output={stage.output}
        onReset={actions.reset}
        onKeepEditing={actions.keepEditing}
      />
    );
  } else if (stage.name === 'empty') {
    body = (
      <Dropzone
        headline="Drop a video to shrink it"
        hint="Compress it for chat and email, or turn it into a GIF — it all happens in this tab, nothing is uploaded."
        accept={VIDEO_ACCEPT}
        maxBytes={MAX_VIDEO_BYTES}
        maxFiles={1}
        multiple={false}
        illustration={<DropArt />}
        onFiles={actions.addFiles}
        onReject={actions.reject}
        sample={{ label: 'No file handy? Try a sample', onTry: actions.trySample }}
      />
    );
  } else if (file) {
    const items: QueueItem[] = [
      { id: file.name, name: file.name, size: file.size, status: 'queued' },
    ];

    body = (
      <div className="video-tool__board">
        <FileQueue items={items} label="Video to compress" onRemove={actions.removeFile} />

        <VideoOptions value={options} onChange={actions.setOptions} />

        <div className="video-tool__actions">
          <Button variant="ghost" onClick={actions.reset}>
            Start over
          </Button>
          <Button variant="primary" onClick={actions.run}>
            {options.format === 'gif' ? 'Convert to GIF' : 'Compress video'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-tool">
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
        title={options.format === 'gif' ? 'Building your GIF' : 'Compressing your video'}
        progress={processing?.progress}
        onCancel={actions.cancel}
      />
    </div>
  );
}

interface ResultViewProps {
  readonly output: VideoOutput;
  readonly onReset: () => void;
  readonly onKeepEditing: () => void;
}

function ResultView({ output, onReset, onKeepEditing }: ResultViewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const isGif = output.mimeType === 'image/gif';

  useEffect(() => {
    const url = URL.createObjectURL(new Blob([output.bytes], { type: output.mimeType }));
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [output]);

  const savedPercent =
    output.originalBytes > 0
      ? Math.round((1 - output.bytes.length / output.originalBytes) * 100)
      : 0;

  return (
    <ResultPanel
      headline={isGif ? 'Your GIF is ready' : 'Your video is ready'}
      stat={{
        value: savedPercent > 0 ? `${savedPercent}% smaller` : formatBytes(output.bytes.length),
        label: `${formatBytes(output.originalBytes)} → ${formatBytes(output.bytes.length)}`,
      }}
      preview={
        previewUrl ? (
          isGif ? (
            <img className="video-tool__preview" src={previewUrl} alt="Converted GIF preview" />
          ) : (
            <video className="video-tool__preview" src={previewUrl} controls muted playsInline />
          )
        ) : null
      }
      actions={
        <>
          <Button variant="ghost" onClick={onReset}>
            Start over
          </Button>
          <Button variant="secondary" onClick={onKeepEditing}>
            {isGif ? 'Convert again' : 'Compress again'}
          </Button>
          <Button
            variant="primary"
            icon={DownloadSimpleIcon}
            onClick={() =>
              download(new Blob([output.bytes], { type: output.mimeType }), output.name)
            }
          >
            Download
          </Button>
        </>
      }
    />
  );
}
