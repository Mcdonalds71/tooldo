const UNITS = ['B', 'KB', 'MB', 'GB', 'TB'] as const;

type Unit = (typeof UNITS)[number];

/**
 * Decimal units, matching what an operating system reports for a file — a 2,400-byte
 * file reads as "2.4 KB" here and in Finder, which is the number people compare against.
 */
export function formatBytes(bytes: number, fractionDigits = 1): string {
  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new RangeError(`Expected a non-negative byte count, got ${bytes}`);
  }

  let value = bytes;
  let unit: Unit = 'B';

  for (const candidate of UNITS) {
    unit = candidate;
    if (value < 1000 || candidate === 'TB') break;
    value /= 1000;
  }

  if (unit === 'B') return `${Math.round(value)} B`;

  return `${value.toFixed(fractionDigits).replace(/\.0+$/, '')} ${unit}`;
}
