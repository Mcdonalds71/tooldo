import type { InvoiceData } from './types';

/** Realistic filled-in data, not a file — "try a sample" for a form means seeing a
 *  complete invoice appear, not loading anything from disk. */
export function sampleInvoiceData(): InvoiceData {
  return {
    business: {
      name: 'Northwind Studio',
      address: '148 Baker Street, Austin, TX 78701',
      email: 'hello@northwindstudio.com',
      phone: '(512) 555-0142',
      /* Deliberately the full international shape, not a two-line domestic one: an
         account name, the bank and account type, the numbers a foreign transfer needs,
         and a billing address long enough to wrap. It shows what the field is for, and
         it is the layout case most likely to collide with the notes below it. */
      paymentDetails:
        'Northwind Studio LLC\nFirst National Bank · Checking\nAccount 0123456789 · Routing 021000021\nSWIFT NFNBUS33XXX\n148 Baker Street, Austin, TX 78701',
      logoDataUrl: null,
    },
    client: {
      name: 'Harlow & Finch Co',
      address: '22 Riverside Ave, Denver, CO 80202',
      email: 'accounts@harlowfinch.com',
    },
    details: {
      invoiceNumber: '1042',
      issueDate: isoDate(0),
      dueDate: isoDate(14),
      taxRate: '8',
      discountRate: '0',
      currency: 'USD',
      notes: 'Payment due within 14 days. Thanks for the work.',
    },
    lineItems: [
      {
        id: crypto.randomUUID(),
        description: 'Brand identity design',
        quantity: '1',
        unitPrice: '1800',
      },
      {
        id: crypto.randomUUID(),
        description: 'Website homepage build',
        quantity: '12',
        unitPrice: '95',
      },
      { id: crypto.randomUUID(), description: 'Revision rounds', quantity: '2', unitPrice: '150' },
    ],
  };
}

function isoDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().slice(0, 10);
}
