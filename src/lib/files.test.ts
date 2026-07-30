import { describe, expect, it } from 'vitest';
import { describeRejection, matchesAccept, partitionFiles } from './files';

const fileOf = (name: string, type: string, size = 1000) =>
  new File([new Uint8Array(size)], name, { type });

describe('matchesAccept', () => {
  const pdf = fileOf('report.pdf', 'application/pdf');

  it('accepts anything when no rule is given', () => {
    expect(matchesAccept(pdf, [])).toBe(true);
  });

  it('matches an exact mime type', () => {
    expect(matchesAccept(pdf, ['application/pdf'])).toBe(true);
    expect(matchesAccept(pdf, ['image/png'])).toBe(false);
  });

  it('matches a wildcard mime type', () => {
    expect(matchesAccept(fileOf('cat.png', 'image/png'), ['image/*'])).toBe(true);
    expect(matchesAccept(pdf, ['image/*'])).toBe(false);
  });

  it('falls back to the extension, which is all some browsers give us', () => {
    expect(matchesAccept(fileOf('holiday.HEIC', ''), ['.heic'])).toBe(true);
    expect(matchesAccept(fileOf('holiday.heic', ''), ['.png'])).toBe(false);
  });
});

describe('partitionFiles', () => {
  it('keeps every file when nothing is restricted', () => {
    const files = [fileOf('a.pdf', 'application/pdf'), fileOf('b.png', 'image/png')];

    expect(partitionFiles(files).accepted).toHaveLength(2);
  });

  it('separates the wrong type', () => {
    const files = [fileOf('a.pdf', 'application/pdf'), fileOf('b.png', 'image/png')];
    const { accepted, rejected } = partitionFiles(files, { accept: ['application/pdf'] });

    expect(accepted.map((file) => file.name)).toEqual(['a.pdf']);
    expect(rejected).toEqual([{ file: files[1], reason: 'type' }]);
  });

  it('separates a file over the size cap', () => {
    const big = fileOf('huge.png', 'image/png', 5000);
    const { accepted, rejected } = partitionFiles([big], { maxBytes: 4000 });

    expect(accepted).toEqual([]);
    expect(rejected[0]?.reason).toBe('size');
  });

  it('takes files up to the count cap and rejects the overflow', () => {
    const files = [fileOf('a.png', 'image/png'), fileOf('b.png', 'image/png')];
    const { accepted, rejected } = partitionFiles(files, { maxFiles: 1 });

    expect(accepted).toHaveLength(1);
    expect(rejected[0]?.reason).toBe('count');
  });

  it('reports the first thing wrong rather than stacking reasons', () => {
    const wrongAndBig = fileOf('huge.png', 'image/png', 5000);
    const { rejected } = partitionFiles([wrongAndBig], {
      accept: ['application/pdf'],
      maxBytes: 10,
    });

    expect(rejected[0]?.reason).toBe('type');
  });
});

describe('describeRejection', () => {
  it('names the file and the type it needed', () => {
    const rejection = { file: fileOf('notes.txt', 'text/plain'), reason: 'type' } as const;

    expect(describeRejection(rejection, { accept: ['.pdf'] })).toBe(
      "notes.txt isn't a PDF — try another",
    );
    expect(describeRejection(rejection, { accept: ['image/*'] })).toBe(
      "notes.txt isn't an image — try another",
    );
    expect(describeRejection(rejection, { accept: ['.png', '.jpg'] })).toBe(
      "notes.txt isn't a PNG or JPG — try another",
    );
    expect(describeRejection(rejection, { accept: ['.png', '.jpg', '.webp'] })).toBe(
      "notes.txt isn't a PNG, JPG, or WEBP — try another",
    );
  });

  it('leans on the family when one is listed, instead of reciting every extension', () => {
    const rejection = { file: fileOf('clip.mov', 'video/quicktime'), reason: 'type' } as const;

    expect(describeRejection(rejection, { accept: ['image/*', '.heic', '.png'] })).toBe(
      "clip.mov isn't an image — try another",
    );
  });

  it('gives the size limit in the same units the UI shows', () => {
    const rejection = { file: fileOf('huge.png', 'image/png'), reason: 'size' } as const;

    expect(describeRejection(rejection, { maxBytes: 50_000_000 })).toBe(
      'huge.png is bigger than 50 MB — try a smaller one',
    );
  });

  it('says how many files fit, with the right plural', () => {
    const rejection = { file: fileOf('k.png', 'image/png'), reason: 'count' } as const;

    expect(describeRejection(rejection, { maxFiles: 20 })).toBe('You can add 20 files at a time');
    expect(describeRejection(rejection, { maxFiles: 1 })).toBe('You can add 1 file at a time');
  });
});
