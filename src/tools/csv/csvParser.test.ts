import { describe, expect, it } from 'vitest';
import { parseCsv, tableToCsv } from './csvParser';

describe('parseCsv', () => {
  it('parses a simple header and rows', () => {
    const table = parseCsv('name,age\nAda,30\nGrace,85');

    expect(table.headers).toEqual(['name', 'age']);
    expect(table.rows).toEqual([
      { name: 'Ada', age: '30' },
      { name: 'Grace', age: '85' },
    ]);
  });

  it('keeps a comma inside a quoted field as part of that field', () => {
    const table = parseCsv('name,address\n"Ada","123 Main St, Apt 4"');

    expect(table.rows[0]).toEqual({ name: 'Ada', address: '123 Main St, Apt 4' });
  });

  it('keeps a newline inside a quoted field as part of that field', () => {
    const table = parseCsv('name,bio\nAda,"Line one\nLine two"');

    expect(table.rows[0]).toEqual({ name: 'Ada', bio: 'Line one\nLine two' });
  });

  it('unescapes a doubled quote inside a quoted field', () => {
    const table = parseCsv('quote\n"She said ""hi"""');

    expect(table.rows[0]).toEqual({ quote: 'She said "hi"' });
  });

  it('names an empty header cell rather than leaving it blank', () => {
    const table = parseCsv('a,,c\n1,2,3');

    expect(table.headers).toEqual(['a', 'Column 2', 'c']);
  });

  it('disambiguates duplicate header names instead of colliding', () => {
    const table = parseCsv('name,name\nAda,Lovelace');

    expect(table.headers).toEqual(['name', 'name (2)']);
    expect(table.rows[0]).toEqual({ name: 'Ada', 'name (2)': 'Lovelace' });
  });

  it('fills a short row with empty strings for the remaining columns', () => {
    const table = parseCsv('a,b,c\n1');

    expect(table.rows[0]).toEqual({ a: '1', b: '', c: '' });
  });

  it('drops fields beyond the header count in a long row', () => {
    const table = parseCsv('a,b\n1,2,3,4');

    expect(table.rows[0]).toEqual({ a: '1', b: '2' });
  });

  it('handles CRLF line endings the same as LF', () => {
    const table = parseCsv('a,b\r\n1,2\r\n3,4');

    expect(table.rows).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '4' },
    ]);
  });

  it('reads the final row whether or not the text ends with a newline', () => {
    const withTrailing = parseCsv('a\n1\n');
    const withoutTrailing = parseCsv('a\n1');

    expect(withTrailing.rows).toEqual([{ a: '1' }]);
    expect(withoutTrailing.rows).toEqual([{ a: '1' }]);
  });

  it('returns an empty table for empty text', () => {
    expect(parseCsv('')).toEqual({ headers: [], rows: [] });
  });
});

describe('tableToCsv', () => {
  it('quotes a field containing a comma, quote, or newline', () => {
    const csv = tableToCsv({
      headers: ['note'],
      rows: [{ note: 'has, a comma' }, { note: 'has "quotes"' }, { note: 'has\na newline' }],
    });

    expect(csv).toContain('"has, a comma"');
    expect(csv).toContain('"has ""quotes"""');
    expect(csv).toContain('"has\na newline"');
  });

  it('round-trips through parseCsv unchanged', () => {
    const original = parseCsv('name,note\nAda,"hello, world"\nGrace,plain');
    const roundTripped = parseCsv(tableToCsv(original));

    expect(roundTripped).toEqual(original);
  });
});
