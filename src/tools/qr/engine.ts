import type { Options as QrRenderOptions } from 'qr-code-styling';
import { QrError } from './errors';
import { type DownloadFormat, MAX_CONTENT_LENGTH, QR_SIZE, type QrStyle } from './types';

const MARGIN = 8;
const LOGO_SIZE_RATIO = 0.4;
const LOGO_MARGIN = 4;
const FILENAME_SLUG_LENGTH = 40;

/** Throws rather than silently clamping — a QR code that got cut off wouldn't scan,
 *  so the visitor needs to know before they download it, not after. */
export function validateContentLength(content: string): void {
  if (content.length > MAX_CONTENT_LENGTH) {
    throw new QrError(
      'ContentTooLongError',
      `Content is ${content.length} characters, over the ${MAX_CONTENT_LENGTH} limit`,
    );
  }
}

/**
 * A logo covers the centre of the code, so error correction goes up to `H` whenever
 * one is set — the standard compensation for the obscured modules — and stays at the
 * lighter `Q` otherwise, since a denser-than-needed code is harder to scan for no
 * benefit. Corner squares and corner dots share `cornerStyle`: `CornerStyle` is a
 * subset of both of the library's own corner unions, so one choice styles both without
 * a mapping table, and the two read as a matched pair rather than two separate ones.
 */
export function buildQrConfig(content: string, style: QrStyle): Partial<QrRenderOptions> {
  const { logoDataUrl } = style;

  return {
    width: QR_SIZE,
    height: QR_SIZE,
    data: content,
    margin: MARGIN,
    qrOptions: { errorCorrectionLevel: logoDataUrl !== null ? 'H' : 'Q' },
    dotsOptions: { type: style.dotStyle, color: style.foreground },
    cornersSquareOptions: { type: style.cornerStyle, color: style.foreground },
    cornersDotOptions: { type: style.cornerStyle, color: style.foreground },
    backgroundOptions: { color: style.background },
    // Spread rather than `image: logoDataUrl ?? undefined` — `exactOptionalPropertyTypes`
    // treats an explicit `undefined` as a type error for a key the library types as
    // optional-string-or-absent, so the key has to be missing, not merely empty.
    ...(logoDataUrl !== null
      ? {
          image: logoDataUrl,
          imageOptions: {
            imageSize: LOGO_SIZE_RATIO,
            hideBackgroundDots: true,
            margin: LOGO_MARGIN,
          },
        }
      : {}),
  };
}

/** Strips the scheme so "https://tooldo.online" and "tooldo.online" name the same
 *  file, then the same diacritic-safe slug approach as the timezone city list. */
export function qrFilename(content: string, extension: DownloadFormat): string {
  const slug = content
    .trim()
    .replace(/^https?:\/\//i, '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, FILENAME_SLUG_LENGTH);

  return `qr-${slug.length > 0 ? slug : 'code'}.${extension}`;
}
