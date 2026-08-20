/** Numeric-ish fields stay raw strings in form state — parsed only where math happens,
 *  so a half-typed "1." or an emptied field never fights the input as you type. */
export interface LineItem {
  readonly id: string;
  readonly description: string;
  readonly quantity: string;
  readonly unitPrice: string;
}

/** The part that repeats across invoices, so it's the part worth remembering. */
export interface BusinessProfile {
  readonly name: string;
  readonly address: string;
  readonly email: string;
  readonly phone: string;
  /**
   * Where the money should go: account name and number, bank, sort code, a payment link,
   * whatever the sender's country expects. Free text on purpose, because the shape of
   * this differs per country and guessing at fields would be worse than a box.
   *
   * It lives on the profile rather than in `notes` because it is the same on every
   * invoice a business ever sends, and the profile is the half that gets saved.
   */
  readonly paymentDetails: string;
  /** A small embedded image, already re-encoded to a data URL — never a File held in state. */
  readonly logoDataUrl: string | null;
}

/** The part that's different every time, so it's never saved. */
export interface ClientInfo {
  readonly name: string;
  readonly address: string;
  readonly email: string;
}

/**
 * A working set of major and regional currencies, not the full ISO-4217 list — wide
 * enough that most visitors find their own without a search box, small enough to stay
 * one screen in a plain `<select>`. `formatMoney` (`money.ts`) renders amounts with the
 * code rather than a symbol, since a symbol alone (`$`, `£`) doesn't say which of
 * several currencies that share it is meant, and some symbols this list needs (₦, ₹)
 * aren't in the WinAnsi encoding the PDF's font supports — the code works everywhere,
 * identically, in both the live preview and the download.
 */
export const CURRENCIES = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'NGN', name: 'Nigerian Naira' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
  { code: 'ZAR', name: 'South African Rand' },
  { code: 'GHS', name: 'Ghanaian Cedi' },
  { code: 'KES', name: 'Kenyan Shilling' },
  { code: 'EGP', name: 'Egyptian Pound' },
  { code: 'AED', name: 'UAE Dirham' },
  { code: 'BRL', name: 'Brazilian Real' },
  { code: 'MXN', name: 'Mexican Peso' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'SEK', name: 'Swedish Krona' },
  { code: 'SGD', name: 'Singapore Dollar' },
  { code: 'NZD', name: 'New Zealand Dollar' },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]['code'];

export interface InvoiceDetails {
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly dueDate: string;
  /** Percent, 0–100, same shape as discount so the two fields read as a pair. */
  readonly taxRate: string;
  readonly discountRate: string;
  readonly currency: CurrencyCode;
  readonly notes: string;
}

export interface InvoiceData {
  readonly business: BusinessProfile;
  readonly client: ClientInfo;
  readonly details: InvoiceDetails;
  readonly lineItems: readonly LineItem[];
}

export interface InvoiceTotals {
  readonly subtotal: number;
  readonly discountAmount: number;
  readonly taxAmount: number;
  readonly total: number;
}

export interface GenerateInvoiceResult {
  /** The plain buffer kind, so the island can hand it straight to a Blob. */
  readonly bytes: Uint8Array<ArrayBuffer>;
}

export const EMPTY_BUSINESS_PROFILE: BusinessProfile = {
  name: '',
  address: '',
  email: '',
  phone: '',
  paymentDetails: '',
  logoDataUrl: null,
};

export const EMPTY_CLIENT: ClientInfo = { name: '', address: '', email: '' };

export const EMPTY_DETAILS: InvoiceDetails = {
  invoiceNumber: '',
  issueDate: '',
  dueDate: '',
  taxRate: '',
  discountRate: '',
  currency: 'USD',
  notes: '',
};

export const MAX_LINE_ITEMS = 50;
export const MAX_LOGO_BYTES = 2_000_000;
export const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'] as const;
