import { Card } from '../../design-system/components/Card';
import { TextAreaField } from '../../design-system/components/TextAreaField';
import { BusinessSection } from './BusinessSection';
import { ClientSection } from './ClientSection';
import { DetailsSection } from './DetailsSection';
import { LineItemsEditor } from './LineItemsEditor';
import type { BusinessProfile, ClientInfo, InvoiceDetails, LineItem } from './types';
import type { InvoiceActions } from './useInvoiceWorkbench';

export interface InvoiceFormProps {
  readonly business: BusinessProfile;
  readonly client: ClientInfo;
  readonly details: InvoiceDetails;
  readonly lineItems: readonly LineItem[];
  readonly actions: InvoiceActions;
}

export function InvoiceForm({ business, client, details, lineItems, actions }: InvoiceFormProps) {
  return (
    <div className="invoice-form">
      <BusinessSection business={business} actions={actions} />
      <ClientSection client={client} onChange={actions.updateClient} />
      <DetailsSection details={details} onChange={actions.updateDetails} />

      <Card tone="calm" className="invoice-form__section">
        <h3>Line items</h3>
        <LineItemsEditor
          lineItems={lineItems}
          onAdd={actions.addLineItem}
          onUpdate={actions.updateLineItem}
          onRemove={actions.removeLineItem}
        />
      </Card>

      <Card tone="calm" className="invoice-form__section">
        <TextAreaField
          label="Notes"
          value={details.notes}
          onChange={(notes) => actions.updateDetails({ notes })}
          placeholder="Payment due within 14 days. Thanks for the work."
        />
      </Card>
    </div>
  );
}
