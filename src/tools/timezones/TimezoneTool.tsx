import type { CSSProperties } from 'react';
import { Button } from '../../design-system/components/Button';
import { Slider } from '../../design-system/components/Slider';
import { ToastProvider } from '../../design-system/components/Toast';
import { CityPicker } from './CityPicker';
import { TimezoneRow } from './TimezoneRow';
import { useTimezoneWorkbench } from './useTimezoneWorkbench';

export function TimezoneTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { cities, timelines, selectedMinute, query, results, actions } = useTimezoneWorkbench();

  return (
    <div className="timezone-tool">
      <div className="timezone-tool__toolbar">
        <CityPicker
          query={query}
          onQueryChange={actions.setQuery}
          results={results}
          onAdd={actions.addCity}
        />
        <Button variant="ghost" size="sm" onClick={actions.trySample}>
          Try a sample
        </Button>
      </div>

      {cities.length === 0 ? (
        <p className="timezone-tool__hint">
          Search for a city above to see its time, or try a sample comparison.
        </p>
      ) : (
        <>
          <Slider
            label="Time"
            value={selectedMinute}
            onChange={actions.setSelectedMinute}
            min={0}
            max={23 * 60 + 59}
            step={15}
            formatValue={formatMinuteOfDay}
          />

          <div className="timezone-tool__timeline">
            {/* `--cursor-fraction` alone, not a computed `left`: each row insets its
                strip from the timeline's edge by `--space-sm` of padding, so the CSS
                does the same padding-aware math the strip itself uses rather than a
                bare percentage that would drift out of alignment with the cells. */}
            <span
              className="timezone-tool__cursor"
              style={{ '--cursor-fraction': selectedMinute / 1440 } as CSSProperties}
              aria-hidden="true"
            />
            {timelines.map((timeline) => (
              <TimezoneRow key={timeline.id} timeline={timeline} onRemove={actions.removeCity} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function formatMinuteOfDay(minute: number): string {
  const hour24 = Math.floor(minute / 60);
  const mins = minute % 60;
  const period = hour24 < 12 ? 'AM' : 'PM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;

  return `${hour12}:${mins.toString().padStart(2, '0')} ${period}`;
}
