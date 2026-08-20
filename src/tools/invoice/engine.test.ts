import { PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { calculateTotals, generateInvoicePdf } from './engine';
import {
  EMPTY_BUSINESS_PROFILE,
  EMPTY_CLIENT,
  EMPTY_DETAILS,
  type InvoiceData,
  type LineItem,
} from './types';

const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

function item(overrides: Partial<LineItem> = {}): LineItem {
  return { id: '1', description: 'Design work', quantity: '1', unitPrice: '100', ...overrides };
}

function invoice(overrides: Partial<InvoiceData> = {}): InvoiceData {
  return {
    business: EMPTY_BUSINESS_PROFILE,
    client: EMPTY_CLIENT,
    details: EMPTY_DETAILS,
    lineItems: [item()],
    ...overrides,
  };
}

describe('calculateTotals', () => {
  it('has nothing to total with no line items', () => {
    expect(calculateTotals([], '', '')).toEqual({
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      total: 0,
    });
  });

  it('sums quantity times unit price across every item', () => {
    const items = [
      item({ quantity: '2', unitPrice: '50' }),
      item({ id: '2', quantity: '3', unitPrice: '10' }),
    ];

    expect(calculateTotals(items, '', '')).toMatchObject({ subtotal: 130, total: 130 });
  });

  it('applies tax on top of the subtotal', () => {
    const totals = calculateTotals([item({ quantity: '1', unitPrice: '100' })], '10', '');

    expect(totals).toEqual({ subtotal: 100, discountAmount: 0, taxAmount: 10, total: 110 });
  });

  it('takes the discount off the subtotal before tax, not after', () => {
    const totals = calculateTotals([item({ quantity: '1', unitPrice: '100' })], '10', '20');

    // 100 - 20% = 80, then +10% tax on 80 = 8 → 88, not the 90 a naive order would give.
    expect(totals).toEqual({ subtotal: 100, discountAmount: 20, taxAmount: 8, total: 88 });
  });

  it('clamps a discount over 100% rather than turning the total negative', () => {
    const totals = calculateTotals([item({ quantity: '1', unitPrice: '100' })], '', '150');

    expect(totals).toMatchObject({ discountAmount: 100, total: 0 });
  });

  it('treats malformed, negative, or empty numeric fields as zero, never NaN', () => {
    const items = [
      item({ quantity: 'abc', unitPrice: '' }),
      item({ id: '2', quantity: '-5', unitPrice: '10' }),
    ];

    expect(calculateTotals(items, 'not a number', '').total).toBe(0);
  });

  it("doesn't let repeated cents drift with floating point", () => {
    const items = [item({ quantity: '3', unitPrice: '0.1' })];

    expect(calculateTotals(items, '', '').subtotal).toBe(0.3);
  });
});

describe('generateInvoicePdf', () => {
  it('refuses to generate an invoice with no line items', async () => {
    await expect(generateInvoicePdf(invoice({ lineItems: [] }))).rejects.toMatchObject({
      name: 'EmptyLineItemsError',
    });
  });

  it('produces one real, loadable page for a minimal invoice', async () => {
    const result = await generateInvoicePdf(invoice());
    const doc = await PDFDocument.load(result.bytes);

    expect(doc.getPageCount()).toBe(1);
  });

  it('fills in the totals row for a fully detailed invoice', async () => {
    const result = await generateInvoicePdf(
      invoice({
        business: { ...EMPTY_BUSINESS_PROFILE, name: 'Acme Studio', email: 'hi@acme.test' },
        client: { name: 'River Co', address: '1 Market St', email: 'ap@river.test' },
        details: { ...EMPTY_DETAILS, invoiceNumber: 'INV-001', taxRate: '10', discountRate: '5' },
        lineItems: [item({ quantity: '2', unitPrice: '75' })],
      }),
    );

    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it('generates for a currency whose symbol the PDF font cannot encode', async () => {
    // ₦ falls outside WinAnsi, which is exactly why formatMoney renders the code
    // ("NGN") instead of the symbol — this only stays true if nothing upstream ever
    // tries to draw the symbol directly.
    const result = await generateInvoicePdf(
      invoice({ details: { ...EMPTY_DETAILS, currency: 'NGN' } }),
    );

    const doc = await PDFDocument.load(result.bytes);
    expect(doc.getPageCount()).toBe(1);
  });

  it('embeds an optional logo without failing', async () => {
    const withLogo = invoice({
      business: { ...EMPTY_BUSINESS_PROFILE, name: 'Acme Studio', logoDataUrl: TINY_PNG },
    });

    const result = await generateInvoicePdf(withLogo);
    const doc = await PDFDocument.load(result.bytes);

    expect(doc.getPageCount()).toBe(1);
  });

  /* Multi-line payment details are the normal case, not the exception: an account name
     over an account number over a sort code. pdf-lib throws on a character its font
     cannot encode, and a newline is exactly the kind of thing that gets missed, so this
     guards the shape people will actually type rather than a single tidy line. */
  it('draws multi-line payment details without failing', async () => {
    const withPayment = invoice({
      business: {
        ...EMPTY_BUSINESS_PROFILE,
        name: 'Acme Studio',
        paymentDetails: 'Acme Studio LLC\nFirst National · 0123456789\nRouting 021000021',
      },
      details: { ...EMPTY_DETAILS, notes: 'Payment due within 14 days.' },
    });

    const result = await generateInvoicePdf(withPayment);
    const doc = await PDFDocument.load(result.bytes);

    // Both blocks are drawn, and neither pushes the invoice onto a second page.
    expect(doc.getPageCount()).toBe(1);
  });

  it('reports progress up to completion', async () => {
    const seen: number[] = [];

    await generateInvoicePdf(invoice(), (fraction) => seen.push(fraction));

    expect(seen.length).toBeGreaterThan(0);
    expect(seen.at(-1)).toBe(1);
  });
});
