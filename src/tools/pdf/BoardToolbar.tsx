import {
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  ArrowsDownUpIcon,
  FloppyDiskIcon,
  SortAscendingIcon,
  SortDescendingIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '../../design-system/components/Button';
import type { SortDirection } from './board';

export interface BoardToolbarProps {
  readonly pages: number;
  readonly files: number;
  readonly onSort: (direction: SortDirection) => void;
  readonly onReverse: () => void;
  readonly onRotateEvery: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

export function BoardToolbar({
  pages,
  files,
  onSort,
  onReverse,
  onRotateEvery,
  onReset,
  onSave,
}: BoardToolbarProps) {
  return (
    <div className="board-bar">
      <p className="board-bar__count" aria-live="polite">
        <b className="board-bar__number">{pages}</b>
        {pages === 1 ? 'page' : 'pages'}
        {files > 1 ? <span className="board-bar__from">across {files} files</span> : null}
      </p>

      <div className="board-bar__arrange">
        {/* Sorting by name only means something once a second file is on the board. */}
        {files > 1 ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              icon={SortAscendingIcon}
              onClick={() => onSort('asc')}
            >
              A–Z
            </Button>
            <Button
              size="sm"
              variant="ghost"
              icon={SortDescendingIcon}
              onClick={() => onSort('desc')}
            >
              Z–A
            </Button>
          </>
        ) : null}

        <Button size="sm" variant="ghost" icon={ArrowsDownUpIcon} onClick={onReverse}>
          Reverse
        </Button>
      </div>

      <div className="board-bar__actions">
        <Button size="sm" variant="secondary" icon={ArrowsClockwiseIcon} onClick={onRotateEvery}>
          Turn all
        </Button>
        <Button size="sm" variant="secondary" icon={ArrowCounterClockwiseIcon} onClick={onReset}>
          Start over
        </Button>
        <Button size="sm" variant="primary" icon={FloppyDiskIcon} onClick={onSave}>
          Save PDF
        </Button>
      </div>
    </div>
  );
}
