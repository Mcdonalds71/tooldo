import {
  ArrowArcRightIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon,
} from '@phosphor-icons/react/dist/ssr';
import { type DragHandler, motion, useDragControls } from 'motion/react';
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { IconButton } from '../../design-system/components/IconButton';
import { dropIn, instant } from '../../design-system/motion';
import { type BoardPage, displayRatio } from './board';

export interface PageDragHandlers {
  readonly onDragStart: DragHandler;
  readonly onDrag: DragHandler;
  readonly onDragEnd: DragHandler;
}

/**
 * A mouse press starts dragging the moment it moves — there's no ambiguity, since a
 * mouse has no separate "scroll the page" gesture to protect. A touch does, so a touch
 * or pen press has to sit still through this hold before it commits to a drag; anything
 * shorter, or any real movement first, reads as the start of a scroll instead.
 */
const TOUCH_HOLD_MS = 180;
const TOUCH_HOLD_TOLERANCE = 6;

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
  const controls = useDragControls();
  const holdTimer = useRef<number | undefined>(undefined);
  const holdOrigin = useRef<{ x: number; y: number } | null>(null);

  const cancelHold = useCallback(() => {
    window.clearTimeout(holdTimer.current);
    holdTimer.current = undefined;
    holdOrigin.current = null;
  }, []);

  // A page can be removed by another finger while this one is still holding — the timer
  // would otherwise fire on a card that's no longer there.
  useEffect(() => cancelHold, [cancelHold]);

  const armDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.pointerType === 'mouse') {
      controls.start(event);
      return;
    }

    holdOrigin.current = { x: event.clientX, y: event.clientY };
    // The event is still valid to hand to Motion once the timer fires — React 17+
    // doesn't recycle these, so holding a reference across the delay is safe.
    holdTimer.current = window.setTimeout(() => {
      holdTimer.current = undefined;
      controls.start(event);
    }, TOUCH_HOLD_MS);
  };

  const watchHold = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!holdOrigin.current) return;

    const moved = Math.hypot(
      event.clientX - holdOrigin.current.x,
      event.clientY - holdOrigin.current.y,
    );
    if (moved > TOUCH_HOLD_TOLERANCE) cancelHold();
  };

  return (
    // The board hit-tests drops against this id — see PageBoard's onDrag.
    <li className="page-slot" data-page-id={page.id}>
      {/* The entrance is inherited from the board, which staggers it, so no `animate`
          here — only the variants this card resolves it against.
          `dragListener` is off because `armDrag` decides when a press actually becomes
          a drag rather than Motion starting one on every press — see the constants
          above for why touch and mouse decide that differently. */}
      <motion.div
        className="page-card"
        layout={!reduced}
        variants={reduced ? instant : dropIn}
        data-dragging={dragging || undefined}
        drag
        dragListener={false}
        dragControls={controls}
        dragSnapToOrigin
        dragMomentum={false}
        onPointerDown={armDrag}
        onPointerMove={watchHold}
        onPointerUp={cancelHold}
        onPointerCancel={cancelHold}
        onDragStart={drag.onDragStart}
        onDrag={drag.onDrag}
        onDragEnd={(event, info) => {
          cancelHold();
          drag.onDragEnd(event, info);
        }}
      >
        {/* The ratio shapes the frame and tells a turned preview how wide to draw so it
            lands back inside it. */}
        <span
          className="page-card__paper"
          style={{ '--page-ratio': displayRatio(page) } as CSSProperties}
        >
          {thumbnail ? (
            // A browser drags an image out of the page by default, on nothing more than
            // it being an <img> — that native drag would win the gesture before Motion's
            // own pointer tracking ever got it, so it's switched off here specifically.
            <img
              className="page-card__preview"
              src={thumbnail}
              alt={`Page ${position}`}
              data-turned={turned || undefined}
              draggable={false}
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

        {/* Stops the press from bubbling to the card's own pointer-down handler above,
            so tapping a control is always just a tap — never the start of a drag. */}
        <div className="page-card__controls" onPointerDown={(event) => event.stopPropagation()}>
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
