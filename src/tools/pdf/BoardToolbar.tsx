import {
  ArrowCounterClockwiseIcon,
  ArrowsClockwiseIcon,
  FloppyDiskIcon,
} from '@phosphor-icons/react/dist/ssr';
import { Button } from '../../design-system/components/Button';

export interface BoardToolbarProps {
  readonly pages: number;
  readonly files: number;
  readonly onRotateEvery: () => void;
  readonly onReset: () => void;
  readonly onSave: () => void;
}

export function BoardToolbar({ pages, files, onRotateEvery, onReset, onSave }: BoardToolbarProps) {
  return (
    <div className="board-bar">
      <p className="board-bar__count" aria-live="polite">
        <b className="board-bar__number">{pages}</b>
        {pages === 1 ? 'page' : 'pages'}
        {files > 1 ? <span className="board-bar__from">across {files} files</span> : null}
      </p>

      <div className="board-bar__actions">
        <Button size="sm" variant="ghost" icon={ArrowsClockwiseIcon} onClick={onRotateEvery}>
          Turn every page
        </Button>
        <Button size="sm" variant="ghost" icon={ArrowCounterClockwiseIcon} onClick={onReset}>
          Start over
        </Button>
        <Button size="sm" variant="primary" icon={FloppyDiskIcon} onClick={onSave}>
          Save PDF
        </Button>
      </div>
    </div>
  );
}
