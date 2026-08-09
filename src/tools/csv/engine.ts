import { parseCsv } from './csvParser';
import { DataToolError } from './errors';
import { parseJson } from './jsonTable';
import { createSample } from './sample';
import type { DataTask, DataTaskResult, ParsedTable, SortState, SourceFormat } from './types';

/** Extension first, since it's what the visitor actually named the file; the MIME
 *  type is only a fallback for the rare drop where the browser reports one but the
 *  filename doesn't end in either — a CSV default there is the safer of two guesses,
 *  since a JSON file always ends in `.json` in practice and a CSV export sometimes
 *  doesn't carry an extension at all. */
export function detectFormat(file: File): SourceFormat {
  const name = file.name.toLowerCase();
  if (name.endsWith('.json')) return 'json';
  if (name.endsWith('.csv')) return 'csv';
  return file.type === 'application/json' ? 'json' : 'csv';
}

export async function runDataTask(task: DataTask): Promise<DataTaskResult> {
  if (task.kind === 'sample') {
    return { kind: 'sample', file: await createSample() };
  }

  const format = detectFormat(task.file);
  const text = await task.file.text();

  if (text.trim().length === 0) {
    throw new DataToolError('EmptyFileError', 'The file has no content');
  }

  const table = format === 'json' ? parseJson(text) : parseCsv(text);

  return { kind: 'parse', format, table };
}

/** Unsorted when there's no active column, otherwise a stable sort — `Array.sort` is
 *  guaranteed stable in every engine this project targets, so rows that tie on the
 *  active column keep their original relative order instead of shuffling. */
export function sortRows(rows: ParsedTable['rows'], sort: SortState): ParsedTable['rows'] {
  if (!sort.column) return rows;

  const column = sort.column;
  const factor = sort.direction === 'asc' ? 1 : -1;

  return [...rows].sort((a, b) => compareValues(a[column] ?? '', b[column] ?? '') * factor);
}

/** Numeric when both sides genuinely look like numbers, so a price or age column
 *  sorts 2 before 10 rather than "10" before "2" the way a plain string sort would —
 *  falls back to locale-aware string comparison for everything else, including a
 *  column that mixes numbers and text. */
function compareValues(a: string, b: string): number {
  if (a === '' || b === '') return a.localeCompare(b);

  const numA = Number(a);
  const numB = Number(b);

  if (!Number.isNaN(numA) && !Number.isNaN(numB)) {
    return numA - numB;
  }

  return a.localeCompare(b);
}
