import { MAX_PAGES } from './types';

/**
 * The error name crosses the worker boundary intact (structured clone drops the class,
 * `WorkerTaskError` re-reads the name), so the code doubles as the name. The island
 * turns it back into a sentence through `describePdfError`.
 */
export type PdfErrorCode =
  | 'UnreadablePdfError'
  | 'EncryptedPdfError'
  | 'EmptyDocumentError'
  | 'EmptyPlanError'
  | 'InvalidPageError'
  | 'TooManyPagesError';

export class PdfError extends Error {
  constructor(
    readonly code: PdfErrorCode,
    message: string,
  ) {
    super(message);
    this.name = code;
  }
}

const SENTENCES: Record<PdfErrorCode, string> = {
  UnreadablePdfError: "That file isn't a PDF we can read — try another",
  EncryptedPdfError: 'That PDF is password-protected — unlock it first, then drop it again',
  EmptyDocumentError: 'That PDF has no pages in it — try another',
  EmptyPlanError: 'Keep at least one page to save a PDF',
  InvalidPageError: "Those pages don't match the files any more — start again",
  TooManyPagesError: `That's over ${MAX_PAGES} pages — drop a shorter document`,
};

/** Anything without a code is still a real failure, so it gets an honest sentence too. */
export function describePdfError(name: string): string {
  return SENTENCES[name as PdfErrorCode] ?? 'That PDF stopped part way through — try another';
}
