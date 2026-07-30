import {
  CheckCircleIcon,
  FileIcon,
  WarningCircleIcon,
  XIcon,
} from '@phosphor-icons/react/dist/ssr';
import { AnimatePresence, motion } from 'motion/react';
import { formatBytes } from '../../lib/formatBytes';
import { instant, scaleIn, useReducedMotion } from '../motion';
import { IconButton } from './IconButton';
import { Progress } from './Progress';

export type QueueStatus = 'queued' | 'working' | 'done' | 'failed';

export interface QueueItem {
  readonly id: string;
  readonly name: string;
  readonly size: number;
  readonly status: QueueStatus;
  /** 0 to 1 while working. */
  readonly progress?: number | undefined;
  readonly outputSize?: number | undefined;
  readonly error?: string | undefined;
}

export interface FileQueueProps {
  readonly items: readonly QueueItem[];
  readonly onRemove?: ((id: string) => void) | undefined;
  readonly label?: string | undefined;
}

export function FileQueue({ items, onRemove, label = 'Files' }: FileQueueProps) {
  const reduced = useReducedMotion();

  return (
    <ul className="queue" aria-label={label} aria-live="polite">
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.li
            key={item.id}
            className="queue__row"
            data-status={item.status}
            layout={!reduced}
            variants={reduced ? instant : scaleIn}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <span className="queue__thumb" aria-hidden>
              <FileIcon size="1.25rem" weight="duotone" />
            </span>

            <span className="queue__meta">
              <b className="queue__name">{item.name}</b>
              <span className="queue__status">{statusLine(item)}</span>
            </span>

            {item.status === 'working' ? (
              <Progress
                className="queue__progress"
                value={item.progress ?? 0}
                label={`Working on ${item.name}`}
              />
            ) : null}

            {item.status === 'done' ? (
              <span className="queue__done">
                <CheckCircleIcon size="1rem" weight="fill" aria-hidden /> Done
              </span>
            ) : null}

            {item.status === 'failed' ? (
              <span className="queue__failed">
                <WarningCircleIcon size="1rem" weight="fill" aria-hidden /> Failed
              </span>
            ) : null}

            {onRemove ? (
              <IconButton
                icon={XIcon}
                label={`Remove ${item.name}`}
                variant="ghost"
                size="sm"
                onClick={() => onRemove(item.id)}
              />
            ) : null}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}

function statusLine(item: QueueItem): string {
  if (item.status === 'failed') return item.error ?? 'Something went wrong';

  if (item.status === 'done' && item.outputSize !== undefined) {
    return `${formatBytes(item.size)} → ${formatBytes(item.outputSize)}`;
  }

  return formatBytes(item.size);
}
