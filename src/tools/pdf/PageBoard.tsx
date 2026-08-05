import { motion, type PanInfo } from 'motion/react';
import { useRef, useState } from 'react';
import { instant, stagger, useReducedMotion } from '../../design-system/motion';
import type { BoardPage } from './board';
import { PageCard, type PageDragHandlers } from './PageCard';

export interface PageBoardProps {
  readonly pages: readonly BoardPage[];
  readonly thumbnails: ReadonlyMap<string, string>;
  /** File names by source index. Only shown once a second file joins the board. */
  readonly origins: readonly string[];
  readonly previewsUnavailable: boolean;
  readonly onMove: (id: string, to: number) => void;
  readonly onShift: (id: string, step: number) => void;
  readonly onRotate: (id: string) => void;
  readonly onRemove: (id: string) => void;
}

/**
 * The tray the pages land in: frosted, with a warm glow behind it for the blur to have
 * something to work on — glass over flat paper is just a tinted box.
 *
 * Pages reorder as the pointer crosses them rather than on drop, so the document
 * rearranges under the hand. Motion's layout animation carries each card to its new
 * place. Each card decides for itself how a press becomes a drag — see the constants at
 * the top of PageCard — and this component only has to make sense of where it landed.
 * The arrow buttons on every card are the same move from the keyboard, and stand in for
 * drag anywhere it isn't available.
 */
export function PageBoard({
  pages,
  thumbnails,
  origins,
  previewsUnavailable,
  onMove,
  onShift,
  onRotate,
  onRemove,
}: PageBoardProps) {
  const reduced = useReducedMotion() ?? false;
  const [held, setHeld] = useState<string | null>(null);
  // Which card was last swapped into, so a still-hovering pointer doesn't reorder the
  // same pair on every animation frame.
  const lastTarget = useRef<string | null>(null);

  const dragHandlers = (id: string): PageDragHandlers => ({
    onDragStart: () => {
      lastTarget.current = id;
      setHeld(id);
    },
    onDrag: (event, info) => {
      const point = clientPoint(event, info);
      // The dragged card sits `pointer-events: none` while `[data-dragging]` (see
      // pdf.css), so this always resolves to whichever card is genuinely underneath it.
      const hovered = document.elementFromPoint(point.x, point.y)?.closest('[data-page-id]');
      const targetId = hovered instanceof HTMLElement ? hovered.dataset.pageId : undefined;

      // Own id: the dragged card's slot still occupies its layout position underneath
      // the transform that's carrying it, so the pointer can cross back over it.
      if (targetId === undefined || targetId === id || targetId === lastTarget.current) return;

      const targetIndex = pages.findIndex((page) => page.id === targetId);
      if (targetIndex === -1) return;

      lastTarget.current = targetId;
      onMove(id, targetIndex);
    },
    onDragEnd: () => {
      lastTarget.current = null;
      setHeld(null);
    },
  });

  return (
    <div className="page-stage">
      <span className="page-stage__glow" aria-hidden />

      <div className="page-tray">
        <BoardStatus
          drawn={thumbnails.size}
          total={pages.length}
          unavailable={previewsUnavailable}
        />

        <motion.ul
          className="page-board"
          aria-label="Pages in your document"
          variants={reduced ? instant : stagger}
          initial="hidden"
          animate="visible"
        >
          {pages.map((page, index) => (
            <PageCard
              key={page.id}
              page={page}
              position={index + 1}
              total={pages.length}
              thumbnail={thumbnails.get(page.id)}
              {...(origins.length > 1 ? { origin: origins[page.source] } : {})}
              dragging={held === page.id}
              reduced={reduced}
              drag={dragHandlers(page.id)}
              onShift={(step) => onShift(page.id, step)}
              onRotate={() => onRotate(page.id)}
              onRemove={() => onRemove(page.id)}
            />
          ))}
        </motion.ul>
      </div>
    </div>
  );
}

/**
 * `elementFromPoint` needs viewport coordinates. Motion hands back a real `PointerEvent`
 * in practice, which already carries those — `info.point` is the fallback, since it's
 * relative to the page rather than the viewport and needs the scroll offset backed out.
 */
function clientPoint(
  event: MouseEvent | TouchEvent | PointerEvent,
  info: PanInfo,
): { x: number; y: number } {
  if ('clientX' in event) return { x: event.clientX, y: event.clientY };

  return { x: info.point.x - window.scrollX, y: info.point.y - window.scrollY };
}

/**
 * The counter from the reference: a page number, not a percentage. It says nothing at
 * all once every page is drawn, since by then the board itself is the answer.
 */
function BoardStatus({
  drawn,
  total,
  unavailable,
}: {
  readonly drawn: number;
  readonly total: number;
  readonly unavailable: boolean;
}) {
  if (unavailable) {
    return (
      <p className="page-tray__status" data-tone="quiet">
        Previews didn't load, so pages show as numbers. Everything else still works.
      </p>
    );
  }

  if (drawn >= total) return null;

  return (
    <p className="page-tray__status" aria-live="polite">
      <span className="page-tray__tick">
        <b>{drawn}</b> of {total}
      </span>
      pages drawn
    </p>
  );
}
