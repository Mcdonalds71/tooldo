import { PlusIcon } from '@phosphor-icons/react/dist/ssr';
import { TextField } from '../../design-system/components/TextField';
import type { CityEntry } from './cities';

export interface CityPickerProps {
  readonly query: string;
  readonly onQueryChange: (value: string) => void;
  readonly results: readonly CityEntry[];
  readonly onAdd: (entry: CityEntry) => void;
}

export function CityPicker({ query, onQueryChange, results, onAdd }: CityPickerProps) {
  const trimmed = query.trim();

  return (
    <div className="city-picker">
      <TextField
        label="Add a city"
        value={query}
        onChange={onQueryChange}
        placeholder="Lagos, Tokyo, São Paulo…"
      />

      {trimmed ? (
        <ul className="city-picker__results">
          {results.length === 0 ? (
            <li className="city-picker__empty">Nothing matches "{trimmed}"</li>
          ) : (
            results.map((entry) => (
              <li key={`${entry.city}-${entry.country}`}>
                <button type="button" className="city-picker__result" onClick={() => onAdd(entry)}>
                  <PlusIcon size="1rem" weight="bold" aria-hidden />
                  <span className="city-picker__city">{entry.city}</span>
                  <span className="city-picker__country">{entry.country}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
