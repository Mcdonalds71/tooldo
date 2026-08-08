import { Card } from '../../design-system/components/Card';
import { TextField } from '../../design-system/components/TextField';
import type { InvoiceDetails } from './types';

export interface DetailsSectionProps {
  readonly details: InvoiceDetails;
  readonly onChange: (patch: Partial<InvoiceDetails>) => void;
}

export function DetailsSection({ details, onChange }: DetailsSectionProps) {
  return (
    <Card tone="calm" className="invoice-form__section">
      <h3>Details</h3>
      <div className="invoice-form__grid">
        <TextField
          label="Invoice number"
          value={details.invoiceNumber}
          onChange={(invoiceNumber) => onChange({ invoiceNumber })}
          placeholder="1042"
        />
        <TextField
          label="Issue date"
          value={details.issueDate}
          onChange={(issueDate) => onChange({ issueDate })}
          type="date"
        />
        <TextField
          label="Due date"
          value={details.dueDate}
          onChange={(dueDate) => onChange({ dueDate })}
          type="date"
        />
        <TextField
          label="Tax %"
          value={details.taxRate}
          onChange={(taxRate) => onChange({ taxRate })}
          type="number"
          min="0"
          step="0.1"
          placeholder="8"
        />
        <TextField
          label="Discount %"
          value={details.discountRate}
          onChange={(discountRate) => onChange({ discountRate })}
          type="number"
          min="0"
          max="100"
          step="0.1"
          placeholder="0"
        />
      </div>
    </Card>
  );
}
