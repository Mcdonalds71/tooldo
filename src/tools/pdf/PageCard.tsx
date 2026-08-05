import {
  ArrowArcRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { motion } from 'motion/react';
import type { CSSProperties, DragEventHandler } from 'react';
import { IconButton } from '../../design-system/components/IconButton';
import { dropIn, instant } from '../../design-system/motion';
import { type BoardPage, displayRatio } from './board';

export interface PageDragHandlers {
  readonly onDragStart: DragEventHandler<HTMLLIElement>;
  readonly onDragEnter: DragEventHandler<HTMLLIElement>;
  readonly onDragOver: DragEventHandler<HTMLLIElement>;
  readonly onDragEnd: DragEventHandler<HTMLLIElement>;
  readonly onDrop: DragEventHandler<HTMLLIElement>;
}

export interface PageCardProps {
  readonly page: BoardPage;
  /** Where it will land in the finished document, counting from one. */
  readonly position: number;
  readonly total: number;
  readonly thumbnail?: string | undefined;
  /** The file it came from, shown only once a second file joins the board. */
  readonly origin?: string | undefined;
  readonly dragging: boolean;
  readonly reduced: boolean;
  readonly drag: PageDragHandlers;
  readonly onShift: (step: number) => void;
  readonly onRotate: () => void;
  readonly onRemove: () => void;
}

export function PageCard({
  page,
  position,
  total,
  thumbnail,
  origin,
  dragging,
  reduced,
  drag,
  onShift,
  onRotate,
  onRemove,
}: PageCardProps) {
  const turned = page.rotation === 90 || page.rotation === 270;

  return (
    // The list item owns the native drag, the card inside owns the layout animation:
    // Motion claims `onDragStart` and `onDragEnd` for its own pan gesture, so the two
    // can't sit on the same element.
    <li className="page-slot" draggable {...drag}>
      {/* The entrance is inherited from the board, which staggers it, so no `animate`
          here — only the variants this card resolves it against. */}
      <motion.div
        className="page-card"
        layout={!reduced}
        variants={reduced ? instant : dropIn}
        data-dragging={dragging || undefined}
      >
        {/* The ratio shapes the frame and tells a turned preview how wide to draw so it
            lands back inside it. */}
        <span
          className="page-card__paper"
          style={{ '--page-ratio': displayRatio(page) } as CSSProperties}
        >
          {thumbnail ? (
            <img
              className="page-card__preview"
              src={thumbnail}
              alt={`Page ${position}`}
              data-turned={turned || undefined}
              style={{ rotate: `${page.rotation}deg` }}
            />
          ) : (
            <span className="page-card__waiting">{position}</span>
          )}
        </span>

        <p className="page-card__meta">
          <b className="page-card__number">{position}</b>
          {origin ? <span className="page-card__origin">{origin}</span> : null}
        </p>

        <div className="page-card__controls">
          <IconButton
            icon={ArrowLeftIcon}
            label={`Move page ${position} earlier`}
            variant="ghost"
            size="sm"
            disabled={position === 1}
            onClick={() => onShift(-1)}
          />
          <IconButton
            icon={ArrowArcRightIcon}
            label={`Turn page ${position}`}
            variant="ghost"
            size="sm"
            onClick={onRotate}
          />
          <IconButton
            icon={TrashIcon}
            label={`Remove page ${position}`}
            variant="ghost"
            size="sm"
            onClick={onRemove}
          />
          <IconButton
            icon={ArrowRightIcon}
            label={`Move page ${position} later`}
            variant="ghost"
            size="sm"
            disabled={position === total}
            onClick={() => onShift(1)}
          />
        </div>
      </motion.div>
    </li>
  );
}
