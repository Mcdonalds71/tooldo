import { CaretDownIcon, CaretUpIcon } from '@phosphor-icons/react/dist/ssr';
import { MAX_DISPLAY_ROWS, type ParsedTable, type SortState } from './types';

export interface DataTableProps {
  readonly table: ParsedTable;
  readonly sortedRows: readonly Record<string, string>[];
  readonly sort: SortState;
  readonly onSort: (column: string) => void;
}

export function DataTable({ table, sortedRows, sort, onSort }: DataTableProps) {
  const displayRows = sortedRows.slice(0, MAX_DISPLAY_ROWS);
  const hiddenCount = sortedRows.length - displayRows.length;

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {table.headers.map((header) => (
              <th key={header} scope="col">
                <button
                  type="button"
                  className="data-table__sort"
                  onClick={() => onSort(header)}
                  aria-label={`Sort by ${header}`}
                >
                  {header}
                  {sort.column === header ? (
                    sort.direction === 'asc' ? (
                      <CaretUpIcon size="0.75em" weight="bold" aria-hidden />
                    ) : (
                      <CaretDownIcon size="0.75em" weight="bold" aria-hidden />
                    )
                  ) : null}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayRows.map((row, index) => (
            // Cells are plain text with no focus or animation state of their own, so
            // reordering on sort has no visible cost — an index-based key just avoids
            // inventing a synthetic row id that would then have to be kept out of every
            // CSV/JSON round-trip.
            // biome-ignore lint/suspicious/noArrayIndexKey: rows are stateless text, reordering is harmless
            <tr key={index}>
              {table.headers.map((header) => (
                <td key={header}>{row[header]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      {hiddenCount > 0 ? (
        <p className="data-table__note">
          Showing {displayRows.length.toLocaleString()} of {sortedRows.length.toLocaleString()} rows
          — download to get all of them.
        </p>
      ) : null}
    </div>
  );
}
