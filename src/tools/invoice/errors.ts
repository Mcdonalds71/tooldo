/**
 * The error name crosses the worker boundary intact (structured clone drops the class,
 * `WorkerTaskError` re-reads the name), so the code doubles as the name. The island
 * turns it back into a sentence through `describeInvoiceError`.
 */
export type InvoiceErrorCode = 'EmptyLineItemsError' | 'InvalidLogoError';

export class InvoiceError extends Error {
  constructor(
    readonly code: InvoiceErrorCode,
    message: string,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = code;
  }
}

const SENTENCES: Record<InvoiceErrorCode, string> = {
  EmptyLineItemsError: 'Add at least one line item before downloading',
  InvalidLogoError: "That logo couldn't be read — try a different image",
};

/** Anything without a code is still a real failure, so it gets an honest sentence too. */
export function describeInvoiceError(name: string): string {
  return SENTENCES[name as InvoiceErrorCode] ?? "The invoice didn't generate — try again";
}
