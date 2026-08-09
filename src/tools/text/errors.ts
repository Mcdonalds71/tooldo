export type TextToolErrorCode = 'TooManyLinesError';

export class TextToolError extends Error {
  constructor(
    readonly code: TextToolErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = code;
  }
}

const SENTENCES: Record<TextToolErrorCode, string> = {
  TooManyLinesError: "That's too many lines to compare — try a shorter excerpt",
};

export function describeTextToolError(name: string): string {
  return SENTENCES[name as TextToolErrorCode] ?? "That comparison couldn't run — try again";
}
