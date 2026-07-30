import { describe, expect, it } from 'vitest';
import { sanitizeFilename } from './download';

describe('sanitizeFilename', () => {
  it('leaves an ordinary filename alone', () => {
    expect(sanitizeFilename('beach-photo.jpg')).toBe('beach-photo.jpg');
    expect(sanitizeFilename('Q3 report (final).pdf')).toBe('Q3 report (final).pdf');
  });

  it('defuses path traversal', () => {
    const result = sanitizeFilename('../../etc/passwd');

    expect(result).not.toContain('/');
    expect(result).not.toContain('..');
    expect(result.startsWith('.')).toBe(false);
  });

  it('strips separators and characters the filesystem rejects', () => {
    expect(sanitizeFilename('in:valid?name*.png')).toBe('in-valid-name-.png');
    expect(sanitizeFilename('folder\\file.png')).toBe('folder-file.png');
  });

  it('removes control characters', () => {
    expect(sanitizeFilename(`re${String.fromCharCode(0)}port.csv`)).toBe('re-port.csv');
  });

  it('escapes Windows device names', () => {
    expect(sanitizeFilename('con.txt')).toBe('download-con.txt');
    expect(sanitizeFilename('LPT1')).toBe('download-LPT1');
  });

  it('falls back when nothing usable is left', () => {
    expect(sanitizeFilename('')).toBe('download');
    expect(sanitizeFilename('...')).toBe('download');
    expect(sanitizeFilename('   ', 'export')).toBe('export');
  });

  it('truncates a long name but keeps its extension', () => {
    const result = sanitizeFilename(`${'a'.repeat(500)}.pdf`);

    expect(result.length).toBe(200);
    expect(result.endsWith('.pdf')).toBe(true);
  });
});
