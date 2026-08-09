export type ScreenshotErrorCode = 'InvalidImageError' | 'RenderFailedError';

export class ScreenshotError extends Error {
  constructor(
    readonly code: ScreenshotErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = code;
  }
}

const SENTENCES: Record<ScreenshotErrorCode, string> = {
  InvalidImageError: "That file isn't a PNG, JPEG, or WebP — try another",
  RenderFailedError: "That screenshot couldn't be styled — try again",
};

export function describeScreenshotError(name: string): string {
  return SENTENCES[name as ScreenshotErrorCode] ?? "That screenshot couldn't be styled — try again";
}
