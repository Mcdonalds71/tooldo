import { InvoiceError } from './errors';
import { lineItemAmount, round2, toSafeNumber } from './money';
import { drawInvoicePage } from './pdfLayout';
import { toPdfSafeInvoice } from './pdfText';
import type { GenerateInvoiceResult, InvoiceData, InvoiceTotals, LineItem } from './types';

type PdfLib = typeof import('pdf-lib');

/** Kept out of the module's top level: the PDF machinery only loads once generation
 *  actually runs, not just because a form field changed. */
async function loadPdfLib(): Promise<PdfLib> {
  return import('pdf-lib');
}

/**
 * Pure and synchronous on purpose: the live preview calls this on every keystroke, so
 * it has to be cheap. The worker-side PDF draw calls the exact same function for its
 * own totals, which is what guarantees the preview and the download never disagree.
 */
export function calculateTotals(
  lineItems: readonly LineItem[],
  taxRate: string,
  discountRate: string,
): InvoiceTotals {
  const subtotal = round2(lineItems.reduce((sum, item) => sum + lineItemAmount(item), 0));

  const discountPercent = Math.min(100, toSafeNumber(discountRate));
  const discountAmount = round2(subtotal * (discountPercent / 100));
  const taxableAmount = subtotal - discountAmount;

  const taxPercent = toSafeNumber(taxRate);
  const taxAmount = round2(taxableAmount * (taxPercent / 100));

  return { subtotal, discountAmount, taxAmount, total: round2(taxableAmount + taxAmount) };
}

export async function generateInvoicePdf(
  data: InvoiceData,
  onProgress?: (fraction: number) => void,
): Promise<GenerateInvoiceResult> {
  if (data.lineItems.length === 0) {
    throw new InvoiceError('EmptyLineItemsError', 'Add at least one line item before downloading');
  }

  /* Before anything is drawn, so an unsupported character fails the run cleanly rather
     than part-way through a page. Totals come from the original data, since the
     substitution only ever touches text. */
  const drawable = toPdfSafeInvoice(data);

  const { PDFDocument } = await loadPdfLib();
  const totals = calculateTotals(data.lineItems, data.details.taxRate, data.details.discountRate);

  const doc = await PDFDocument.create();
  onProgress?.(0.2);

  await drawInvoicePage(doc, drawable, totals);
  onProgress?.(0.8);

  doc.setCreator('tooldo');
  const saved = await doc.save({ useObjectStreams: true });
  onProgress?.(1);

  return { bytes: new Uint8Array(saved) };
}
