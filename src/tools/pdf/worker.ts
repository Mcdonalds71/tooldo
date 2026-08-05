import { serveWorkerTask } from '../../lib/workerHost';
import { runPdfTask } from './engine';
import type { PdfTask, PdfTaskResult } from './types';

serveWorkerTask<PdfTask, PdfTaskResult>(runPdfTask);
