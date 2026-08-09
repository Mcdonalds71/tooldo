export type SourceFormat = 'csv' | 'json';

export interface ParsedTable {
  readonly headers: readonly string[];
  readonly rows: readonly Record<string, string>[];
}

export const CSV_JSON_ACCEPT = ['text/csv', 'application/json', '.csv', '.json'] as const;

export const MAX_FILE_BYTES = 30_000_000;
/** Past this many rows a browser table is a scrollbar, not something read — the
 *  underlying data (and what a download converts) is never truncated, only the
 *  DOM the table actually renders. */
export const MAX_DISPLAY_ROWS = 500;

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  readonly column: string | null;
  readonly direction: SortDirection;
}

export interface DataFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly name: string;
  readonly mimeType: string;
}

export type DataTask =
  | { readonly kind: 'parse'; readonly file: File }
  | { readonly kind: 'sample' };

export type DataTaskResult =
  | { readonly kind: 'parse'; readonly format: SourceFormat; readonly table: ParsedTable }
  | { readonly kind: 'sample'; readonly file: DataFile };
