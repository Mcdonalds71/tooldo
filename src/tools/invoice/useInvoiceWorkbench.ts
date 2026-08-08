import { useCallback, useMemo, useRef, useState } from 'react';
import { useToast } from '../../design-system/components/Toast';
import { download } from '../../lib/download';
import {
  clearBusinessProfile,
  loadBusinessProfile,
  saveBusinessProfile,
} from './businessProfileStorage';
import { requestInvoicePdf } from './client';
import { calculateTotals } from './engine';
import { describeInvoiceError } from './errors';
import { sampleInvoiceData } from './sample';
import {
  type BusinessProfile,
  type ClientInfo,
  EMPTY_BUSINESS_PROFILE,
  EMPTY_CLIENT,
  EMPTY_DETAILS,
  type InvoiceDetails,
  type LineItem,
  LOGO_ACCEPT,
  MAX_LINE_ITEMS,
  MAX_LOGO_BYTES,
} from './types';

export type Stage = { readonly name: 'editing' } | { readonly name: 'generating' };

function newLineItem(): LineItem {
  return { id: crypto.randomUUID(), description: '', quantity: '1', unitPrice: '' };
}

/**
 * State for the whole tool and everything asynchronous it does. Simpler than the
 * file-tool state machines on purpose — the form and its live preview are visible
 * from the first render, so there's no `empty`/`ready` gate, only whether a download
 * is in flight. See ADR 0010.
 */
export function useInvoiceWorkbench() {
  const { notify } = useToast();
  const [business, setBusiness] = useState<BusinessProfile>(() => loadBusinessProfile());
  const [client, setClient] = useState<ClientInfo>(EMPTY_CLIENT);
  const [details, setDetails] = useState<InvoiceDetails>(EMPTY_DETAILS);
  const [lineItems, setLineItems] = useState<readonly LineItem[]>(() => [newLineItem()]);
  const [stage, setStage] = useState<Stage>({ name: 'editing' });
  const running = useRef<AbortController | null>(null);

  const totals = useMemo(
    () => calculateTotals(lineItems, details.taxRate, details.discountRate),
    [lineItems, details.taxRate, details.discountRate],
  );

  const updateBusiness = useCallback((patch: Partial<BusinessProfile>) => {
    setBusiness((current) => {
      const next = { ...current, ...patch };
      saveBusinessProfile(next);
      return next;
    });
  }, []);

  const setLogo = useCallback(
    async (file: File | null) => {
      if (!file) {
        updateBusiness({ logoDataUrl: null });
        return;
      }

      if (!LOGO_ACCEPT.includes(file.type as (typeof LOGO_ACCEPT)[number])) {
        notify({ title: "That logo isn't a PNG, JPEG, or WebP — try another", tone: 'error' });
        return;
      }
      if (file.size > MAX_LOGO_BYTES) {
        notify({ title: 'That logo is too large — try one under 2 MB', tone: 'error' });
        return;
      }

      try {
        updateBusiness({ logoDataUrl: await readAsDataUrl(file) });
      } catch {
        notify({ title: "That logo couldn't be read — try another", tone: 'error' });
      }
    },
    [notify, updateBusiness],
  );

  const clearSavedBusiness = useCallback(() => {
    clearBusinessProfile();
    setBusiness(EMPTY_BUSINESS_PROFILE);
  }, []);

  const updateClient = useCallback((patch: Partial<ClientInfo>) => {
    setClient((current) => ({ ...current, ...patch }));
  }, []);

  const updateDetails = useCallback((patch: Partial<InvoiceDetails>) => {
    setDetails((current) => ({ ...current, ...patch }));
  }, []);

  const addLineItem = useCallback(() => {
    setLineItems((current) => {
      if (current.length >= MAX_LINE_ITEMS) {
        notify({ title: `An invoice tops out at ${MAX_LINE_ITEMS} line items`, tone: 'error' });
        return current;
      }
      return [...current, newLineItem()];
    });
  }, [notify]);

  const updateLineItem = useCallback((id: string, patch: Partial<LineItem>) => {
    setLineItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }, []);

  const removeLineItem = useCallback((id: string) => {
    // Always at least one row — an empty table reads as broken, not blank on purpose.
    setLineItems((current) =>
      current.length <= 1 ? current : current.filter((item) => item.id !== id),
    );
  }, []);

  const trySample = useCallback(() => {
    const sample = sampleInvoiceData();
    setClient(sample.client);
    setDetails(sample.details);
    setLineItems(sample.lineItems);
    // Real saved business info is more useful in the demo than fake info would be —
    // only fill it in when there's nothing real to show yet.
    if (!business.name) updateBusiness(sample.business);
  }, [business.name, updateBusiness]);

  const downloadInvoice = useCallback(async () => {
    const controller = new AbortController();
    running.current = controller;
    setStage({ name: 'generating' });

    try {
      const result = await requestInvoicePdf(
        { business, client, details, lineItems },
        controller.signal,
      );
      download(new Blob([result.bytes], { type: 'application/pdf' }), invoiceFilename(details));
      notify({ title: 'Invoice downloaded', tone: 'success' });
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === 'AbortError')) {
        notify({
          title: describeInvoiceError(cause instanceof Error ? cause.name : ''),
          tone: 'error',
        });
      }
    } finally {
      setStage({ name: 'editing' });
    }
  }, [business, client, details, lineItems, notify]);

  const actions = useMemo(
    () => ({
      updateBusiness,
      setLogo,
      clearSavedBusiness,
      updateClient,
      updateDetails,
      addLineItem,
      updateLineItem,
      removeLineItem,
      trySample,
      download: downloadInvoice,
      cancel: () => running.current?.abort(),
    }),
    [
      addLineItem,
      clearSavedBusiness,
      downloadInvoice,
      removeLineItem,
      setLogo,
      trySample,
      updateBusiness,
      updateClient,
      updateDetails,
      updateLineItem,
    ],
  );

  return { business, client, details, lineItems, totals, stage, actions };
}

export type InvoiceActions = ReturnType<typeof useInvoiceWorkbench>['actions'];

function invoiceFilename(details: InvoiceDetails): string {
  return details.invoiceNumber ? `invoice-${details.invoiceNumber}.pdf` : 'invoice.pdf';
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
