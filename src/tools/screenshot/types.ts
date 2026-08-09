/** What the dropzone takes, and the ceiling a crafted file has to stay under. Tighter
 *  than the image converter's list on purpose — a screenshot is never HEIC or AVIF in
 *  practice, so there's no reason to carry decoders this tool will never need. */
export const SCREENSHOT_ACCEPT = [
  'image/png',
  'image/jpeg',
  'image/webp',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
] as const;

export const MAX_SCREENSHOT_BYTES = 25_000_000;

export type BackgroundPresetId = 'paper' | 'ink' | 'sunset' | 'dusk' | 'ocean';

export interface BackgroundPreset {
  readonly id: BackgroundPresetId;
  readonly label: string;
  /** One stop is a solid fill; two is a diagonal gradient, first colour top-left. */
  readonly colors: readonly [string] | readonly [string, string];
}

/**
 * Ocean is the one preset that isn't paper-and-ink — this is decorative canvas behind
 * a visitor's own screenshot, not tooldo's own chrome, so it earns real variety rather
 * than staying inside the suite's own palette (see CLAUDE.md's glass note for why that
 * reasoning doesn't carry over: that's about tooldo's UI, this is about their image).
 *
 * Keyed by id rather than a plain array so looking one up is a guaranteed hit, not a
 * `.find()` that could come back `undefined` for a value the type system already
 * promises is valid.
 */
export const BACKGROUND_PRESETS: Record<BackgroundPresetId, BackgroundPreset> = {
  paper: { id: 'paper', label: 'Paper', colors: ['#f4f0e7'] },
  ink: { id: 'ink', label: 'Ink', colors: ['#16130d'] },
  sunset: { id: 'sunset', label: 'Sunset', colors: ['#ff3b14', '#ffb703'] },
  dusk: { id: 'dusk', label: 'Dusk', colors: ['#16130d', '#5c3b2e'] },
  ocean: { id: 'ocean', label: 'Ocean', colors: ['#0f4c5c', '#5fb3b3'] },
};

export const BACKGROUND_PRESET_LIST: readonly BackgroundPreset[] =
  Object.values(BACKGROUND_PRESETS);

export const MIN_PADDING_PERCENT = 0;
export const MAX_PADDING_PERCENT = 20;
export const MIN_CORNER_RADIUS = 0;
export const MAX_CORNER_RADIUS = 40;

export interface BeautifyOptions {
  readonly background: BackgroundPresetId;
  readonly paddingPercent: number;
  readonly cornerRadius: number;
  readonly shadow: boolean;
  readonly browserFrame: boolean;
}

export const DEFAULT_OPTIONS: BeautifyOptions = {
  background: 'paper',
  paddingPercent: 8,
  cornerRadius: 16,
  shadow: true,
  browserFrame: false,
};

export interface RenderedImage {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly width: number;
  readonly height: number;
}

export interface SampleFile {
  readonly bytes: Uint8Array<ArrayBuffer>;
  readonly name: string;
  readonly mimeType: string;
}

export type ScreenshotTask =
  | { readonly kind: 'render'; readonly file: File; readonly options: BeautifyOptions }
  | { readonly kind: 'sample' };

export type ScreenshotTaskResult =
  | { readonly kind: 'render'; readonly image: RenderedImage }
  | { readonly kind: 'sample'; readonly file: SampleFile };
