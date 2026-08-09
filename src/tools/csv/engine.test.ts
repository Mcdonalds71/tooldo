import { describe, expect, it } from 'vitest';
import { detectFormat, runDataTask, sortRows } from './engine';

function fileOf(name: string, contents: string, type = ''): File {
  return new File([contents], name, { type });
}

describe('detectFormat', () => {
  it('reads the extension first', () => {
    expect(detectFormat(fileOf('data.json', '{}'))).toBe('json');
    expect(detectFormat(fileOf('data.csv', 'a,b'))).toBe('csv');
  });

  it('is case-insensitive about the extension', () => {
    expect(detectFormat(fileOf('DATA.JSON', '{}'))).toBe('json');
  });

  it('falls back to MIME type when the name has neither extension', () => {
    expect(detectFormat(fileOf('data', '{}', 'application/json'))).toBe('json');
    expect(detectFormat(fileOf('data', 'a,b', 'text/plain'))).toBe('csv');
  });
});

describe('runDataTask', () => {
  it('parses a dropped CSV file end to end', async () => {
    const result = await runDataTask({ kind: 'parse', file: fileOf('people.csv', 'name\nAda') });

    expect(result).toEqual({
      kind: 'parse',
      format: 'csv',
      table: { headers: ['name'], rows: [{ name: 'Ada' }] },
    });
  });

  it('parses a dropped JSON file end to end', async () => {
    const result = await runDataTask({
      kind: 'parse',
      file: fileOf('people.json', '[{"name":"Ada"}]'),
    });

    expect(result).toEqual({
      kind: 'parse',
      format: 'json',
      table: { headers: ['name'], rows: [{ name: 'Ada' }] },
    });
  });

  it('rejects a file with no real content', async () => {
    await expect(
      runDataTask({ kind: 'parse', file: fileOf('empty.csv', '   \n  ') }),
    ).rejects.toThrow();
  });

  it('produces the bundled sample', async () => {
    const result = await runDataTask({ kind: 'sample' });

    expect(result.kind).toBe('sample');
  });
});

describe('sortRows', () => {
  const rows = [
    { name: 'Grace', age: '85' },
    { name: 'Ada', age: '2' },
    { name: 'Bo', age: '10' },
  ];

  it('returns rows unchanged when no column is selected', () => {
    expect(sortRows(rows, { column: null, direction: 'asc' })).toBe(rows);
  });

  it('sorts a text column with locale-aware string comparison', () => {
    const sorted = sortRows(rows, { column: 'name', direction: 'asc' });
    expect(sorted.map((row) => row.name)).toEqual(['Ada', 'Bo', 'Grace']);
  });

  it('sorts a numeric-looking column numerically, not lexicographically', () => {
    const sorted = sortRows(rows, { column: 'age', direction: 'asc' });
    // A plain string sort would put "10" before "2"; a numeric sort puts 2 first.
    expect(sorted.map((row) => row.age)).toEqual(['2', '10', '85']);
  });

  it('reverses order for descending direction', () => {
    const sorted = sortRows(rows, { column: 'age', direction: 'desc' });
    expect(sorted.map((row) => row.age)).toEqual(['85', '10', '2']);
  });

  it('does not mutate the original array', () => {
    const copy = [...rows];
    sortRows(rows, { column: 'name', direction: 'asc' });
    expect(rows).toEqual(copy);
  });
});
