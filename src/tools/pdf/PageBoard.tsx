import { useState } from 'react';
import { useReducedMotion } from '../../design-system/motion';
import type { BoardPage } from './board';
import { PageCard, type PageDragHandlers } from './PageCard';

export interface PageBoardProps {
  readonly pages: readonly BoardPage[];
  readonly thumbnails: ReadonlyMap<string, string>;
  /** File names by source index. Only shown once a second file joins the board. */
  readonly origins: readonly string[];
  readonly onMove: (id: string, to: number) => void;
  readonly onShift: (id: string, step: number) => void;
  readonly onRotate: (id: string) => void;
  readonly onRemove: (id: string) => void;
}

/**
 * Pages reorder as the pointer crosses them rather than on drop, so the document
 * rearranges under the hand. Motion's layout animation carries each card to its new
 * place; the arrow buttons on every card are the same move from the keyboard.
 */
export function PageBoard({
  pages,
  thumbnails,
  origins,
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
    <ul className="page-board" aria-label="Pages in your document">
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
    </ul>
  );
}
