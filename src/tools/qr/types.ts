/** The library's own dot/corner vocabulary is wider than this — these are the ones
 *  that read as genuinely distinct shapes at QR scale, so the picker stays a short
 *  list instead of six near-duplicates. */
export type DotStyle =
  | 'square'
  | 'dots'
  | 'rounded'
  | 'classy'
  | 'classy-rounded'
  | 'extra-rounded';
export type CornerStyle = 'square' | 'dot' | 'rounded' | 'extra-rounded';

export interface StyleOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
}

export const DOT_STYLES: readonly StyleOption<DotStyle>[] = [
  { value: 'square', label: 'Square' },
  { value: 'dots', label: 'Dots' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'classy', label: 'Classy' },
  { value: 'classy-rounded', label: 'Classy rounded' },
  { value: 'extra-rounded', label: 'Extra rounded' },
];

export const CORNER_STYLES: readonly StyleOption<CornerStyle>[] = [
  { value: 'square', label: 'Square' },
  { value: 'dot', label: 'Dot' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'extra-rounded', label: 'Extra rounded' },
];

export interface QrStyle {
  readonly foreground: string;
  readonly background: string;
  readonly dotStyle: DotStyle;
  readonly cornerStyle: CornerStyle;
  readonly logoDataUrl: string | null;
}

/** What a visitor starts from when they type their own content — plain, on-brand,
 *  never the styled preset "Try a sample" applies (that one has to demonstrate range,
 *  this one has to be a sensible default for someone's own logo and colours). */
export const DEFAULT_STYLE: QrStyle = {
  foreground: '#16130d',
  background: '#f4f0e7',
  dotStyle: 'square',
  cornerStyle: 'square',
  logoDataUrl: null,
};

export const QR_SIZE = 320;
export const MAX_CONTENT_LENGTH = 2000;
export const MAX_LOGO_BYTES = 2_000_000;
export const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'] as const;
export type LogoMimeType = (typeof LOGO_ACCEPT)[number];

export type DownloadFormat = 'png' | 'svg';
