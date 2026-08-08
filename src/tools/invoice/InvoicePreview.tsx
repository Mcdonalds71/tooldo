import { Card } from '../../design-system/components/Card';
import { formatMoney, lineItemAmount, toSafeNumber } from './money';
import type { BusinessProfile, ClientInfo, InvoiceDetails, InvoiceTotals, LineItem } from './types';

export interface InvoicePreviewProps {
  readonly business: BusinessProfile;
  readonly client: ClientInfo;
  readonly details: InvoiceDetails;
  readonly lineItems: readonly LineItem[];
  readonly totals: InvoiceTotals;
}

/**
 * A styled mirror of the PDF `pdfLayout.ts` draws — never the PDF itself. Re-rendering
 * this on every keystroke is just a DOM update, cheap enough to feel instant; the real
 * PDF is only ever built once, when the download actually runs.
 */
export function InvoicePreview({
  business,
  client,
  details,
  lineItems,
  totals,
}: InvoicePreviewProps) {
  return (
    <Card tone="brut" className="invoice-preview" role="region" aria-label="Invoice preview">
      <header className="invoice-preview__header">
        <div className="invoice-preview__from">
          {business.logoDataUrl ? (
            <img className="invoice-preview__logo" src={business.logoDataUrl} alt="" />
          ) : null}
          <p className="invoice-preview__business-name">{business.name || 'Your business name'}</p>
          {business.address ? <p className="invoice-preview__muted">{business.address}</p> : null}
          {business.email ? <p className="invoice-preview__muted">{business.email}</p> : null}
          {business.phone ? <p className="invoice-preview__muted">{business.phone}</p> : null}
        </div>

        <div className="invoice-preview__meta">
          <p className="invoice-preview__title">Invoice</p>
          {details.invoiceNumber ? (
            <p className="invoice-preview__muted">#{details.invoiceNumber}</p>
          ) : null}
          {details.issueDate ? (
            <p className="invoice-preview__muted">Issued {details.issueDate}</p>
          ) : null}
          {details.dueDate ? <p className="invoice-preview__muted">Due {details.dueDate}</p> : null}
        </div>
      </header>

      <section className="invoice-preview__bill-to">
        <p className="invoice-preview__label">Bill to</p>
        <p className="invoice-preview__client-name">{client.name || 'Client name'}</p>
        {client.address ? <p className="invoice-preview__muted">{client.address}</p> : null}
        {client.email ? <p className="invoice-preview__muted">{client.email}</p> : null}
      </section>

      <table className="invoice-preview__table">
        <thead>
          <tr>
            <th>Description</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((item) => (
            <tr key={item.id}>
              <td>{item.description || 'Untitled item'}</td>
              <td>{item.quantity || '0'}</td>
              <td>{formatMoney(toSafeNumber(item.unitPrice))}</td>
              <td>{formatMoney(lineItemAmount(item))}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <section className="invoice-preview__totals">
        <div className="invoice-preview__totals-row">
          <span>Subtotal</span>
          <span>{formatMoney(totals.subtotal)}</span>
        </div>
        {totals.discountAmount > 0 ? (
          <div className="invoice-preview__totals-row">
            <span>Discount ({details.discountRate}%)</span>
            <span>-{formatMoney(totals.discountAmount)}</span>
          </div>
        ) : null}
        {totals.taxAmount > 0 ? (
          <div className="invoice-preview__totals-row">
            <span>Tax ({details.taxRate}%)</span>
            <span>{formatMoney(totals.taxAmount)}</span>
          </div>
        ) : null}
        <div className="invoice-preview__totals-row invoice-preview__totals-row--total">
          <span>Total</span>
          <span>{formatMoney(totals.total)}</span>
        </div>
      </section>

      {details.notes.trim() ? (
        <section className="invoice-preview__notes">
          <p className="invoice-preview__label">Notes</p>
          <p className="invoice-preview__muted">{details.notes}</p>
        </section>
      ) : null}
    </Card>
  );
}
