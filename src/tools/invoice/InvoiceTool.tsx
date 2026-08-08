import { DownloadSimpleIcon } from '@phosphor-icons/react/dist/ssr';
import { useState } from 'react';
import { Button } from '../../design-system/components/Button';
import { Segmented } from '../../design-system/components/Segmented';
import { ToastProvider } from '../../design-system/components/Toast';
import { InvoiceForm } from './InvoiceForm';
import { InvoicePreview } from './InvoicePreview';
import { useInvoiceWorkbench } from './useInvoiceWorkbench';

type View = 'edit' | 'preview';

export function InvoiceTool() {
  return (
    <ToastProvider>
      <Workbench />
    </ToastProvider>
  );
}

function Workbench() {
  const { business, client, details, lineItems, totals, stage, actions } = useInvoiceWorkbench();
  const [view, setView] = useState<View>('edit');

  return (
    <div className="invoice-tool">
      <div className="invoice-tool__toolbar">
        <div className="invoice-tool__toggle">
          <Segmented<View>
            label="View"
            value={view}
            onChange={setView}
            options={[
              { value: 'edit', label: 'Edit' },
              { value: 'preview', label: 'Preview' },
            ]}
          />
        </div>

        <div className="invoice-tool__actions">
          <Button variant="ghost" size="sm" onClick={actions.trySample}>
            Try a sample
          </Button>
          <Button
            variant="primary"
            icon={DownloadSimpleIcon}
            loading={stage.name === 'generating'}
            loadingLabel="Generating"
            onClick={() => void actions.download()}
          >
            Download PDF
          </Button>
        </div>
      </div>

      <div className="invoice-tool__panels" data-view={view}>
        <div className="invoice-tool__form-pane">
          <InvoiceForm
            business={business}
            client={client}
            details={details}
            lineItems={lineItems}
            actions={actions}
          />
        </div>

        <div className="invoice-tool__preview-pane">
          <div className="invoice-tool__preview-sticky">
            <InvoicePreview
              business={business}
              client={client}
              details={details}
              lineItems={lineItems}
              totals={totals}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
