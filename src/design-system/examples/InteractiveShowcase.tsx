import { useCallback, useState } from 'react';
import { Button } from '../components/Button';
import { Dropzone } from '../components/Dropzone';
import { FileQueue, type QueueItem } from '../components/FileQueue';
import { ProcessingOverlay } from '../components/ProcessingOverlay';
import { ToastProvider, useToast } from '../components/Toast';

const SAMPLE_QUEUE: readonly QueueItem[] = [
  { id: 'a', name: 'beach-photo.heic', size: 2_400_000, status: 'working', progress: 0.72 },
  { id: 'b', name: 'invoice-final.pdf', size: 1_100_000, status: 'done', outputSize: 340_000 },
  { id: 'c', name: 'screenshot.png', size: 820_000, status: 'done', outputSize: 190_000 },
  {
    id: 'd',
    name: 'holiday-clip.mov',
    size: 48_000_000,
    status: 'failed',
    error: "That file's video, not an image",
  },
];

export function InteractiveShowcase() {
  return (
    <ToastProvider>
      <Playground />
    </ToastProvider>
  );
}

function Playground() {
  const { notify } = useToast();
  const [items, setItems] = useState<readonly QueueItem[]>(SAMPLE_QUEUE);
  const [overlay, setOverlay] = useState<'none' | 'progress' | 'spinner'>('none');

  const addFiles = useCallback(
    (files: readonly File[]) => {
      setItems((current) => [
        ...current,
        ...files.map((file) => ({
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          status: 'queued' as const,
        })),
      ]);
      notify({
        title: `${files.length} ${files.length === 1 ? 'file' : 'files'} added`,
        tone: 'success',
      });
    },
    [notify],
  );

  const rejectFiles = useCallback(
    (messages: readonly string[]) => {
      for (const message of messages) notify({ title: message, tone: 'error' });
    },
    [notify],
  );

  return (
    <div className="showcase-stack">
      <Dropzone
        headline="Drop your images here"
        hint="They're converted right here in your browser — nothing gets uploaded."
        accept={['image/*', '.heic']}
        maxBytes={50_000_000}
        onFiles={addFiles}
        onReject={rejectFiles}
        sample={{
          label: 'No file handy? Try a sample',
          onTry: () => notify({ title: 'Sample loaded', tone: 'success' }),
        }}
      />

      <FileQueue
        items={items}
        label="Demo queue"
        onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
      />

      <div className="showcase-stage">
        <p className="showcase-caption">the overlay covers its own panel, not the page</p>
        <div className="showcase-row">
          <Button size="sm" onClick={() => setOverlay('progress')}>
            Show progress
          </Button>
          <Button size="sm" onClick={() => setOverlay('spinner')}>
            Show without a figure
          </Button>
        </div>

        <ProcessingOverlay
          open={overlay !== 'none'}
          title="Compressing 4 images"
          detail="Two done, two to go."
          {...(overlay === 'progress' ? { progress: 0.5 } : {})}
          onCancel={() => setOverlay('none')}
        />
      </div>

      <div className="showcase-row">
        <Button size="sm" onClick={() => notify({ title: 'Settings saved' })}>
          Toast
        </Button>
        <Button size="sm" onClick={() => notify({ title: 'Files compressed', tone: 'success' })}>
          Success toast
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() =>
            notify({
              title: "That file isn't a PDF — try another",
              description: 'holiday-clip.mov stayed in the queue.',
              tone: 'error',
            })
          }
        >
          Error toast
        </Button>
      </div>
    </div>
  );
}
