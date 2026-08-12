export type VideoErrorCode = 'InvalidVideoError' | 'EncodeFailedError' | 'UnsupportedBrowserError';

export class VideoError extends Error {
  constructor(
    readonly code: VideoErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = code;
  }
}

const SENTENCES: Record<VideoErrorCode, string> = {
  InvalidVideoError: "That file isn't a video this tool reads — try an MP4, MOV, WebM, MKV, or AVI",
  EncodeFailedError: "That video couldn't be processed — try again",
  UnsupportedBrowserError: "This browser can't encode video — try a recent Chrome, Edge, or Safari",
};

export function describeVideoError(name: string): string {
  return SENTENCES[name as VideoErrorCode] ?? "That video couldn't be processed — try again";
}
