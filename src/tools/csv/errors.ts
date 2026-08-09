export type DataToolErrorCode = 'InvalidJsonError' | 'EmptyFileError';

export class DataToolError extends Error {
  constructor(
    readonly code: DataToolErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = code;
  }
}

const SENTENCES: Record<DataToolErrorCode, string> = {
  InvalidJsonError: "That file isn't valid JSON — try another",
  EmptyFileError: "That file doesn't have any data in it — try another",
};

export function describeDataToolError(name: string): string {
  return SENTENCES[name as DataToolErrorCode] ?? "That file couldn't be read — try another";
}
