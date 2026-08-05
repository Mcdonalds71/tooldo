import { motion } from 'motion/react';
import { useState } from 'react';
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
 * place; the arrow buttons on every card are the same move from the keyboard, and the
 * only one a touchscreen has.
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

  const dragHandlers = (id: string, index: number): PageDragHandlers => ({
    onDragStart: (event) => {
      // Firefox refuses to start a drag until the transfer carries something.
      event.dataTransfer.setData('text/plain', id);
      event.dataTransfer.effectAllowed = 'move';
      setHeld(id);
    },
    onDragOver: (event) => {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
    },
    onDragEnter: () => {
      if (held !== null && held !== id) onMove(held, index);
    },
    onDragEnd: () => setHeld(null),
    onDrop: (event) => {
      event.preventDefault();
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
              drag={dragHandlers(page.id, index)}
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
