import { describe, expect, it } from 'vitest';
import { buildQrConfig, qrFilename, validateContentLength } from './engine';
import { DEFAULT_STYLE, MAX_CONTENT_LENGTH } from './types';

describe('validateContentLength', () => {
  it('allows content at or under the limit', () => {
    expect(() => validateContentLength('https://tooldo.online')).not.toThrow();
    expect(() => validateContentLength('a'.repeat(MAX_CONTENT_LENGTH))).not.toThrow();
  });

  it('rejects content over the limit', () => {
    expect(() => validateContentLength('a'.repeat(MAX_CONTENT_LENGTH + 1))).toThrow();
  });

  it('names the error code', () => {
    try {
      validateContentLength('a'.repeat(MAX_CONTENT_LENGTH + 1));
      expect.unreachable('should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as Error).name).toBe('ContentTooLongError');
    }
  });
});

describe('buildQrConfig', () => {
  it('maps content and size', () => {
    const config = buildQrConfig('https://tooldo.online', DEFAULT_STYLE);

    expect(config.data).toBe('https://tooldo.online');
    expect(config.width).toBe(config.height);
  });

  it('applies the style to dots, corners, and background', () => {
    const style = {
      ...DEFAULT_STYLE,
      foreground: '#ff3b14',
      background: '#ffffff',
      dotStyle: 'rounded' as const,
      cornerStyle: 'extra-rounded' as const,
    };
    const config = buildQrConfig('hello', style);

    expect(config.dotsOptions).toMatchObject({ type: 'rounded', color: '#ff3b14' });
    expect(config.cornersSquareOptions).toMatchObject({ type: 'extra-rounded', color: '#ff3b14' });
    expect(config.cornersDotOptions).toMatchObject({ type: 'extra-rounded', color: '#ff3b14' });
    expect(config.backgroundOptions).toMatchObject({ color: '#ffffff' });
  });

  it('uses a lighter error correction level with no logo', () => {
    const config = buildQrConfig('hello', DEFAULT_STYLE);

    expect(config.qrOptions?.errorCorrectionLevel).toBe('Q');
    expect(config.image).toBeUndefined();
    expect(config.imageOptions).toBeUndefined();
  });

  it('raises error correction and sets the image once a logo is set', () => {
    const style = { ...DEFAULT_STYLE, logoDataUrl: 'data:image/png;base64,abc' };
    const config = buildQrConfig('hello', style);

    expect(config.qrOptions?.errorCorrectionLevel).toBe('H');
    expect(config.image).toBe('data:image/png;base64,abc');
    expect(config.imageOptions?.hideBackgroundDots).toBe(true);
  });
});

describe('qrFilename', () => {
  it('slugifies a URL and strips the scheme', () => {
    expect(qrFilename('https://tooldo.online', 'png')).toBe('qr-tooldo-online.png');
  });

  it('strips diacritics', () => {
    expect(qrFilename('café.com', 'svg')).toBe('qr-cafe-com.svg');
  });

  it('falls back to a generic name when nothing slug-worthy remains', () => {
    expect(qrFilename('   ', 'png')).toBe('qr-code.png');
    expect(qrFilename('!!!', 'png')).toBe('qr-code.png');
  });

  it('truncates a long slug rather than producing an unwieldy filename', () => {
    const filename = qrFilename('a'.repeat(200), 'png');

    expect(filename.length).toBeLessThan(60);
    expect(filename.endsWith('.png')).toBe(true);
  });
});
