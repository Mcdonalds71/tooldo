import { AnimatePresence, motion } from 'motion/react';
import { instant, scaleIn, useReducedMotion } from '../motion';
import { Button } from './Button';
import { Card } from './Card';
import { Progress } from './Progress';
import { Spinner } from './Spinner';

export interface ProcessingOverlayProps {
  readonly open: boolean;
  readonly title: string;
  readonly detail?: string | undefined;
  /** 0 to 1. Leave it out while the work can't report a figure — a spinner shows instead. */
  readonly progress?: number | undefined;
  readonly onCancel?: (() => void) | undefined;
}

export function ProcessingOverlay({
  open,
  title,
  detail,
  progress,
  onCancel,
}: ProcessingOverlayProps) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          className="overlay"
          variants={reduced ? instant : scaleIn}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="status"
          aria-live="polite"
        >
          <Card className="overlay__panel">
            <p className="overlay__title">{title}</p>
            {detail ? <p className="overlay__detail">{detail}</p> : null}

            {progress === undefined ? (
              <Spinner className="overlay__spinner" />
            ) : (
              <Progress value={progress} label={title} />
            )}

            {onCancel ? (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                Cancel
              </Button>
            ) : null}
          </Card>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
