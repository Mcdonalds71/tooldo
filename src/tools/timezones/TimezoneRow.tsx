import { XIcon } from '@phosphor-icons/react/dist/ssr';
import { IconButton } from '../../design-system/components/IconButton';
import type { CityTimeline } from './types';

export interface TimezoneRowProps {
  readonly timeline: CityTimeline;
  readonly onRemove: (id: string) => void;
}

/**
 * The strip is `aria-hidden`: it's a second, visual representation of the exact time
 * already stated in the row's head (`selected.label`, `dateLabel`), not new
 * information — a screen reader gains nothing from 24 individually-announced cells
 * that the clock reading right above them already covers.
 */
export function TimezoneRow({ timeline, onRemove }: TimezoneRowProps) {
  return (
    <div className="timezone-row">
      <div className="timezone-row__head">
        <div className="timezone-row__name">
          <span className="timezone-row__city">{timeline.city}</span>
          {timeline.country ? (
            <span className="timezone-row__country">{timeline.country}</span>
          ) : null}
        </div>

        <div className="timezone-row__time">
          <span className="timezone-row__clock">{timeline.selected.label}</span>
          <span className="timezone-row__meta">
            {timeline.selected.dateLabel} · {timeline.offsetLabel}
          </span>
        </div>

        <IconButton
          icon={XIcon}
          label={`Remove ${timeline.city}`}
          variant="ghost"
          size="sm"
          onClick={() => onRemove(timeline.id)}
        />
      </div>

      <div className="timezone-row__strip" aria-hidden="true">
        {timeline.cells.map((cell) => (
          <span
            key={cell.viewerHour}
            className={`timezone-row__cell timezone-row__cell--${cell.phase}`}
          >
            {cell.viewerHour % 3 === 0 ? cell.localHour : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
