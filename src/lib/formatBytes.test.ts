import { describe, expect, it } from 'vitest';
import { formatBytes } from './formatBytes';

describe('formatBytes', () => {
  it('keeps whole bytes below a kilobyte', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1)).toBe('1 B');
    expect(formatBytes(999)).toBe('999 B');
  });

  it('steps up a unit at a thousand', () => {
    expect(formatBytes(1000)).toBe('1 KB');
    expect(formatBytes(2400)).toBe('2.4 KB');
    expect(formatBytes(340_000)).toBe('340 KB');
    expect(formatBytes(2_400_000)).toBe('2.4 MB');
    expect(formatBytes(1_100_000_000)).toBe('1.1 GB');
  });

  it('stops at terabytes rather than inventing a unit', () => {
    expect(formatBytes(1_000_000_000_000_000)).toBe('1000 TB');
  });

  it('honours the requested precision and drops empty decimals', () => {
    expect(formatBytes(2_450_000, 2)).toBe('2.45 MB');
    expect(formatBytes(2_000_000, 2)).toBe('2 MB');
  });

  it('rejects sizes that cannot be a file', () => {
    expect(() => formatBytes(-1)).toThrow(RangeError);
    expect(() => formatBytes(Number.NaN)).toThrow(RangeError);
    expect(() => formatBytes(Number.POSITIVE_INFINITY)).toThrow(RangeError);
  });
});
