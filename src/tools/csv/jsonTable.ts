import { DataToolError } from './errors';
import type { ParsedTable } from './types';

export function parseJson(text: string): ParsedTable {
  let data: unknown;

  try {
    data = JSON.parse(text);
  } catch (cause) {
    throw new DataToolError('InvalidJsonError', "That file isn't valid JSON", { cause });
  }

  return normalizeToTable(data);
}

/**
 * Every shape JSON can legally be, read as a table: an array of objects becomes rows
 * directly; a single object becomes one row; an array of primitives or a lone
 * primitive wraps into a `value` column, since a table needs a column to put
 * something in. Objects that don't all share the same keys take the union of every
 * key seen as the header set — a row missing a key reads blank rather than the file
 * being rejected for not being perfectly uniform, which real-world JSON rarely is.
 */
function normalizeToTable(data: unknown): ParsedTable {
  const records = toRecordArray(data);
  const headers = collectHeaders(records);

  const rows = records.map((record) => {
    const row: Record<string, string> = {};
    for (const header of headers) {
      row[header] = stringifyCell(record[header]);
    }
    return row;
  });

  return { headers, rows };
}

function toRecordArray(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.map((item) => (isPlainObject(item) ? item : { value: item }));
  }
  if (isPlainObject(data)) {
    return [data];
  }
  return [{ value: data }];
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function collectHeaders(records: readonly Record<string, unknown>[]): string[] {
  const headers: string[] = [];
  const seen = new Set<string>();

  for (const record of records) {
    for (const key of Object.keys(record)) {
      if (!seen.has(key)) {
        seen.add(key);
        headers.push(key);
      }
    }
  }

  return headers;
}

function stringifyCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  return JSON.stringify(value);
}

export function tableToJson(table: ParsedTable): string {
  return JSON.stringify(table.rows, null, 2);
}
