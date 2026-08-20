import { TrashIcon, UploadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { useRef } from 'react';
import { Button } from '../../design-system/components/Button';
import { Card } from '../../design-system/components/Card';
import { TextAreaField } from '../../design-system/components/TextAreaField';
import { TextField } from '../../design-system/components/TextField';
import type { BusinessProfile } from './types';
import type { InvoiceActions } from './useInvoiceWorkbench';

export interface BusinessSectionProps {
  readonly business: BusinessProfile;
  readonly actions: InvoiceActions;
}

export function BusinessSection({ business, actions }: BusinessSectionProps) {
  const logoInput = useRef<HTMLInputElement>(null);
  const hasSavedDetails = Boolean(
    business.name ||
      business.address ||
      business.email ||
      business.phone ||
      business.paymentDetails,
  );

  return (
    <Card tone="calm" className="invoice-form__section">
      <div className="invoice-form__section-head">
        <h3>Your business</h3>
        {hasSavedDetails ? (
          <button
            type="button"
            className="invoice-form__clear"
            onClick={actions.clearSavedBusiness}
          >
            Clear saved details
          </button>
        ) : null}
      </div>

      <div className="invoice-form__logo">
        {business.logoDataUrl ? (
          <img className="invoice-form__logo-preview" src={business.logoDataUrl} alt="Your logo" />
        ) : null}
        <input
          ref={logoInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={(event) => {
            void actions.setLogo(event.target.files?.[0] ?? null);
            event.target.value = '';
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          icon={UploadSimpleIcon}
          onClick={() => logoInput.current?.click()}
        >
          {business.logoDataUrl ? 'Replace logo' : 'Add logo'}
        </Button>
        {business.logoDataUrl ? (
          <Button
            variant="ghost"
            size="sm"
            icon={TrashIcon}
            onClick={() => void actions.setLogo(null)}
          >
            Remove
          </Button>
        ) : null}
      </div>

      <div className="invoice-form__grid">
        <TextField
          label="Business name"
          value={business.name}
          onChange={(name) => actions.updateBusiness({ name })}
          placeholder="Northwind Studio"
        />
        <TextField
          label="Email"
          value={business.email}
          onChange={(email) => actions.updateBusiness({ email })}
          type="email"
          placeholder="hello@northwindstudio.com"
        />
        <TextField
          label="Phone"
          value={business.phone}
          onChange={(phone) => actions.updateBusiness({ phone })}
          type="tel"
          placeholder="(512) 555-0142"
        />
        <TextField
          label="Address"
          value={business.address}
          onChange={(address) => actions.updateBusiness({ address })}
          placeholder="148 Baker Street, Austin, TX"
        />
      </div>
      <TextAreaField
        label="Payment details"
        value={business.paymentDetails}
        onChange={(paymentDetails) => actions.updateBusiness({ paymentDetails })}
        placeholder={'Northwind Studio\nFirst National · 0123456789\nSort code 04-00-04'}
      />
      <p className="invoice-form__hint">Saved on this device so you don't retype it next time.</p>
    </Card>
  );
}
