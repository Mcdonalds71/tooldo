import type { ParsedTable } from './types';

/**
 * A character-by-character state machine, not a split on commas — a naive split
 * breaks the moment a quoted field contains a comma or a newline, which real CSV
 * exports do constantly (addresses, descriptions, anything with a comma in it).
 * There's no unbounded lookahead or backtracking here, so a malformed file (an
 * unterminated quote, say) can't hang the tab — it just reads oddly, the same way
 * a real spreadsheet app degrades on the same input.
 */
export function parseCsv(text: string): ParsedTable {
  return rowsToTable(tokenizeCsv(text));
}

function tokenizeCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text.charAt(i);

    if (inQuotes) {
      if (char === '"') {
        if (text.charAt(i + 1) === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (char === '\r') {
      // Swallowed — the paired \n of a CRLF line ending closes the row on its own.
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

function rowsToTable(rawRows: readonly string[][]): ParsedTable {
  if (rawRows.length === 0) return { headers: [], rows: [] };

  const [headerRow, ...dataRows] = rawRows;
  const headers = dedupeHeaders(headerRow ?? []);

  const rows = dataRows.map((dataRow) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = dataRow[index] ?? '';
    });
    return record;
  });

  return { headers, rows };
}

/** An empty header cell or a name repeated across columns would otherwise become a
 *  `Record` key collision — silently losing every column but the last one sharing a
 *  name, which is worse than an odd-looking header. */
function dedupeHeaders(rawHeaders: readonly string[]): string[] {
  const seen = new Map<string, number>();

  return rawHeaders.map((raw, index) => {
    const base = raw.trim() || `Column ${index + 1}`;
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base} (${count + 1})`;
  });
}

export function tableToCsv(table: ParsedTable): string {
  const lines = [table.headers.map(escapeCsvField).join(',')];

  for (const row of table.rows) {
    lines.push(table.headers.map((header) => escapeCsvField(row[header] ?? '')).join(','));
  }

  return lines.join('\r\n');
}

function escapeCsvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}
