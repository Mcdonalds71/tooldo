import { describe, expect, it } from 'vitest';
import { parseJson, tableToJson } from './jsonTable';

describe('parseJson', () => {
  it('reads an array of objects as rows directly', () => {
    const table = parseJson('[{"name":"Ada","age":30},{"name":"Grace","age":85}]');

    expect(table.headers).toEqual(['name', 'age']);
    expect(table.rows).toEqual([
      { name: 'Ada', age: '30' },
      { name: 'Grace', age: '85' },
    ]);
  });

  it('wraps a single object into one row', () => {
    const table = parseJson('{"name":"Ada","age":30}');

    expect(table.rows).toEqual([{ name: 'Ada', age: '30' }]);
  });

  it('wraps an array of primitives into a value column', () => {
    const table = parseJson('[1,2,3]');

    expect(table.headers).toEqual(['value']);
    expect(table.rows).toEqual([{ value: '1' }, { value: '2' }, { value: '3' }]);
  });

  it('wraps a lone primitive into a single-row value column', () => {
    expect(parseJson('"just a string"').rows).toEqual([{ value: 'just a string' }]);
    expect(parseJson('42').rows).toEqual([{ value: '42' }]);
  });

  it('takes the union of keys across objects that differ, leaving gaps blank', () => {
    const table = parseJson('[{"a":1,"b":2},{"a":3,"c":4}]');

    expect(table.headers).toEqual(['a', 'b', 'c']);
    expect(table.rows).toEqual([
      { a: '1', b: '2', c: '' },
      { a: '3', b: '', c: '4' },
    ]);
  });

  it('stringifies a nested object or array value rather than dropping it', () => {
    const table = parseJson('[{"name":"Ada","tags":["math","computing"]}]');

    expect(table.rows[0]?.tags).toBe('["math","computing"]');
  });

  it('renders null and missing values as an empty string, not the word null', () => {
    const table = parseJson('[{"a":1,"b":null}]');

    expect(table.rows[0]).toEqual({ a: '1', b: '' });
  });

  it('throws a named error for invalid JSON instead of an uncaught SyntaxError', () => {
    try {
      parseJson('{not valid json');
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('InvalidJsonError');
    }
  });
});

describe('tableToJson', () => {
  it('serializes the table rows back to a JSON array', () => {
    const json = tableToJson({ headers: ['a'], rows: [{ a: '1' }, { a: '2' }] });

    expect(JSON.parse(json)).toEqual([{ a: '1' }, { a: '2' }]);
  });
});
