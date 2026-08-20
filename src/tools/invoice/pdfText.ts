import { InvoiceError } from './errors';
import type { InvoiceData } from './types';

/**
 * pdf-lib's standard fonts encode WinAnsi (CP1252) and throw on anything outside it.
 * That covers English and the western European accents, and leaves out most of the
 * world: every non-Latin script, and a lot of currency symbols including the naira.
 *
 * ADR 0010 already hit this once, which is why `formatMoney` prints a currency code
 * rather than a symbol. The same reasoning has to reach the free-text fields, because
 * a business owner typing their own bank details is the single likeliest place for a
 * naira sign to appear, and the failure mode was a thrown error surfacing as "the
 * invoice didn't generate, try again" — advice that cannot ever work, on a document the
 * person needs to send today.
 */

/** The symbols for currencies this tool actually offers, mapped to the code the rest of
 *  the invoice already prints. Substituting is deliberate: `NGN 45,000` is a correct,
 *  readable invoice line, and it is what the totals column says anyway. */
const SYMBOL_TO_CODE = new Map<string, string>([
  ['₦', 'NGN'],
  ['₹', 'INR'],
  ['₵', 'GHS'],
  ['₸', 'KZT'],
  ['₺', 'TRY'],
  ['₽', 'RUB'],
  ['₩', 'KRW'],
  ['₪', 'ILS'],
  ['₫', 'VND'],
  ['₱', 'PHP'],
  ['฿', 'THB'],
  ['₴', 'UAH'],
  ['﷼', 'SAR'],
  ['元', 'CNY'],
]);

/** Typographic characters a word processor inserts silently, which have plain
 *  equivalents inside WinAnsi. Worth mapping rather than rejecting, since the person
 *  usually did not type them on purpose. */
const LOOKALIKES = new Map<string, string>([
  ['‑', '-'],
  ['‒', '-'],
  ['―', '-'],
  ['−', '-'],
  [' ', ' '],
  [' ', ' '],
  [' ', ' '],
  ['​', ''],
  ['﻿', ''],
]);

/** WinAnsi is Latin-1 plus a scattered block of extras in the 0x80 to 0x9F range. */
const WIN_ANSI_EXTRAS = new Set('€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ'.split(''));

function isEncodable(character: string): boolean {
  const code = character.codePointAt(0) ?? 0;
  if (code === 0x0a || code === 0x0d) return true;
  if (code >= 0x20 && code <= 0x7e) return true;
  if (code >= 0xa0 && code <= 0xff) return true;
  return WIN_ANSI_EXTRAS.has(character);
}

/**
 * Rewrites what can be rewritten and reports what cannot, rather than letting pdf-lib
 * throw an error naming a code point at somebody trying to invoice a client.
 */
export function toPdfText(value: string): string {
  let out = '';

  for (const character of value) {
    const substitute = SYMBOL_TO_CODE.get(character) ?? LOOKALIKES.get(character);
    if (substitute !== undefined) {
      out += substitute;
      continue;
    }

    if (!isEncodable(character)) {
      throw new InvoiceError(
        'UnsupportedCharacterError',
        `The invoice font cannot draw "${character}"`,
      );
    }

    out += character;
  }

  return out;
}

/**
 * One pass over every string the PDF will draw, done before any drawing starts, so a
 * rejected character fails the whole run cleanly instead of leaving half an invoice on
 * the page. Anything added to the data shape later has to be added here too, which is
 * the trade for keeping the check in one readable place rather than at every draw call.
 */
export function toPdfSafeInvoice(data: InvoiceData): InvoiceData {
  return {
    business: {
      ...data.business,
      name: toPdfText(data.business.name),
      address: toPdfText(data.business.address),
      email: toPdfText(data.business.email),
      phone: toPdfText(data.business.phone),
      paymentDetails: toPdfText(data.business.paymentDetails),
    },
    client: {
      name: toPdfText(data.client.name),
      address: toPdfText(data.client.address),
      email: toPdfText(data.client.email),
    },
    details: {
      ...data.details,
      invoiceNumber: toPdfText(data.details.invoiceNumber),
      notes: toPdfText(data.details.notes),
    },
    lineItems: data.lineItems.map((item) => ({
      ...item,
      description: toPdfText(item.description),
    })),
  };
}
