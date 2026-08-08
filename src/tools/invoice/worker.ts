import { serveWorkerTask } from '../../lib/workerHost';
import { generateInvoicePdf } from './engine';
import type { GenerateInvoiceResult, InvoiceData } from './types';

serveWorkerTask<InvoiceData, GenerateInvoiceResult>(generateInvoicePdf);
