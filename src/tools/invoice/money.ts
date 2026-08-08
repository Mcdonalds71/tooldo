import type { LineItem } from './types';

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

export function formatMoney(amount: number): string {
  const sign = amount < 0 ? '-' : '';
  const formatted = Math.abs(amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${sign}$${formatted}`;
}
