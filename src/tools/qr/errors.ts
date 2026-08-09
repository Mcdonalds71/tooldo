/**
 * An empty content field isn't an error — it's the tool's resting state, handled by a
 * plain `trim().length` check where the preview decides whether to render. Only real
 * failures get a code here: something was typed but won't produce a working QR code.
 */
export type QrErrorCode = 'ContentTooLongError' | 'InvalidLogoError' | 'RenderFailedError';

export class QrError extends Error {
  constructor(
    readonly code: QrErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = code;
  }
}

const SENTENCES: Record<QrErrorCode, string> = {
  ContentTooLongError: "That's too long for a QR code — try something shorter",
  InvalidLogoError: "That logo couldn't be read — try a different image",
  RenderFailedError: "That QR code couldn't be generated — try again",
};

export function describeQrError(name: string): string {
  return SENTENCES[name as QrErrorCode] ?? "That QR code couldn't be generated — try again";
}
