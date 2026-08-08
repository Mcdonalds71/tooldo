import { describe, expect, it } from 'vitest';
import { outputName } from './imageUtils';

describe('outputName', () => {
  it('swaps a known extension for .png', () => {
    expect(outputName('portrait.jpg')).toBe('portrait.png');
  });

  it('swaps a longer, unrelated extension too', () => {
    expect(outputName('holiday.jpeg')).toBe('holiday.png');
  });

  it('adds .png to a name with no extension', () => {
    expect(outputName('photo')).toBe('photo.png');
  });

  it('only touches the last extension', () => {
    expect(outputName('archive.tar.gz')).toBe('archive.tar.png');
  });

  it('treats a dotfile as all-extension, same as the rest of the suite', () => {
    expect(outputName('.hidden')).toBe('.png');
  });
});
