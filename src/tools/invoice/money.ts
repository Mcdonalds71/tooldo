import type { CurrencyCode, LineItem } from './types';

/** A half-typed "1." or an emptied field is still valid form state, just not yet a
 *  number — treat it as 0 rather than let it throw or turn the total into NaN. */
export function toSafeNumber(raw: string): number {
  const parsed = Number.parseFloat(raw);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
}

export function lineItemAmount(item: LineItem): number {
  return round2(toSafeNumber(item.quantity) * toSafeNumber(item.unitPrice));
}

/** Half-up to the cent, so repeated addition can't drift a total by fractions of a cent. */
export function round2(amount: number): number {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

/**
 * Renders with the currency code (`USD 1,234.50`), not a symbol — `$`, `£`, and `¥` are
 * each shared by several currencies in the picker, so a bare symbol doesn't say which
 * one is meant. It also sidesteps a real constraint: a few symbols this list needs (₦,
 * ₹) fall outside the WinAnsi encoding `pdfLayout.ts`'s font supports, so the code is
 * what keeps the preview and the PDF rendering identically instead of one of them
 * needing a fallback. `Intl.NumberFormat` also gets each currency's own decimal
 * convention right on its own — JPY shows no cents, USD shows two — which a hand-rolled
 * `toFixed(2)` would have gotten wrong for exactly the currencies this feature is for.
 */
export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    currencyDisplay: 'code',
  }).format(amount);
}
