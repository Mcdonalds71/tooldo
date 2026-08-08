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
  /** A small embedded image, already re-encoded to a data URL — never a File held in state. */
  readonly logoDataUrl: string | null;
}

/** The part that's different every time, so it's never saved. */
export interface ClientInfo {
  readonly name: string;
  readonly address: string;
  readonly email: string;
}

export interface InvoiceDetails {
  readonly invoiceNumber: string;
  readonly issueDate: string;
  readonly dueDate: string;
  /** Percent, 0–100, same shape as discount so the two fields read as a pair. */
  readonly taxRate: string;
  readonly discountRate: string;
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
  logoDataUrl: null,
};

export const EMPTY_CLIENT: ClientInfo = { name: '', address: '', email: '' };

export const EMPTY_DETAILS: InvoiceDetails = {
  invoiceNumber: '',
  issueDate: '',
  dueDate: '',
  taxRate: '',
  discountRate: '',
  notes: '',
};

export const MAX_LINE_ITEMS = 50;
export const MAX_LOGO_BYTES = 2_000_000;
export const LOGO_ACCEPT = ['image/png', 'image/jpeg', 'image/webp'] as const;
