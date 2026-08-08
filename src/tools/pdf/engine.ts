import { PdfError } from './errors';
import { createSample } from './sample';
import {
  type BuildResult,
  type InspectResult,
  MAX_PAGES,
  type PageInfo,
  type PagePlan,
  type PdfTask,
  type PdfTaskResult,
  type SourceSummary,
} from './types';

type PdfLib = typeof import('pdf-lib');
type PdfDocument = Awaited<ReturnType<PdfLib['PDFDocument']['create']>>;
type PdfPage = Awaited<ReturnType<PdfDocument['copyPages']>>[number];

/** Kept out of the module's top level: the PDF machinery only loads once a file arrives. */
async function loadPdfLib(): Promise<PdfLib> {
  return import('pdf-lib');
}

export async function runPdfTask(
  task: PdfTask,
  onProgress: (fraction: number) => void,
): Promise<PdfTaskResult> {
  if (task.kind === 'inspect') {
    return { kind: 'inspect', result: await inspect(task.files, onProgress) };
  }

  if (task.kind === 'build') {
    return { kind: 'build', result: await build(task.files, task.plan, onProgress) };
  }

  return { kind: 'sample', bytes: await createSample() };
}

/** Reads what was dropped without changing it: how many pages, and how each one sits. */
export async function inspect(
  files: readonly File[],
  onProgress?: (fraction: number) => void,
): Promise<InspectResult> {
  if (files.length === 0) return { sources: [], pages: [] };

  const lib = await loadPdfLib();
  const sources: SourceSummary[] = [];
  const pages: PageInfo[] = [];

  for (const [source, file] of files.entries()) {
    const document = await readDocument(lib, file);
    const count = document.getPageCount();

    if (pages.length + count > MAX_PAGES) {
      throw new PdfError('TooManyPagesError', `${file.name} pushes the total past ${MAX_PAGES}`);
    }

    for (let page = 0; page < count; page += 1) {
      pages.push({ source, page, ...displaySize(document.getPage(page)) });
    }

    sources.push({ name: file.name, bytes: file.size, pages: count });
    onProgress?.((source + 1) / files.length);
  }

  if (pages.length === 0) {
    throw new PdfError('EmptyDocumentError', 'The files that were dropped hold no pages');
  }

  return { sources, pages };
}

/** Assembles one document from the plan. The output is new, so no source metadata rides along. */
export async function build(
  files: readonly File[],
  plan: readonly PagePlan[],
  onProgress?: (fraction: number) => void,
): Promise<BuildResult> {
  if (plan.length === 0) {
    throw new PdfError('EmptyPlanError', 'The plan holds no pages');
  }

  const lib = await loadPdfLib();
  const loaded: PdfDocument[] = [];

  for (const [index, file] of files.entries()) {
    loaded.push(await readDocument(lib, file));
    onProgress?.(((index + 1) / files.length) * 0.6);
  }

  const output = await lib.PDFDocument.create();
  const copies = new Map<number, readonly PdfPage[]>();

  // One copy call per source document. Copying page by page would run a fresh copier
  // each time, re-embedding every font and image the pages share.
  for (const [source, document] of loaded.entries()) {
    const wanted = wantedPages(plan, source, document.getPageCount());
    if (wanted.length > 0) copies.set(source, await output.copyPages(document, wanted));
  }

  const taken = new Map<number, number>();

  for (const entry of plan) {
    const nth = taken.get(entry.source) ?? 0;
    taken.set(entry.source, nth + 1);

    const page = copies.get(entry.source)?.[nth];
    if (page === undefined) {
      throw new PdfError('InvalidPageError', `page ${entry.page + 1} is no longer available`);
    }

    if (entry.rotation !== 0) {
      const turned = (((page.getRotation().angle + entry.rotation) % 360) + 360) % 360;
      page.setRotation(lib.degrees(turned));
    }

    output.addPage(page);
  }

  onProgress?.(0.9);

  // Creator only: pdf-lib writes its own Producer as it serialises, whatever we set.
  output.setCreator('tooldo');

  const saved = await output.save({ useObjectStreams: true });
  onProgress?.(1);

  // pdf-lib leaves the buffer kind open in its types, and a Blob will only take the
  // plain one. Re-wrapping settles that where the bytes are made rather than at every
  // place they're used.
  return { bytes: new Uint8Array(saved), pages: plan.length };
}

function wantedPages(plan: readonly PagePlan[], source: number, pageCount: number): number[] {
  const wanted: number[] = [];

  for (const entry of plan) {
    if (entry.source !== source) continue;

    if (!Number.isInteger(entry.page) || entry.page < 0 || entry.page >= pageCount) {
      throw new PdfError(
        'InvalidPageError',
        `page ${entry.page + 1} is outside file ${source + 1}`,
      );
    }

    wanted.push(entry.page);
  }

  return wanted;
}

async function readDocument(lib: PdfLib, file: File): Promise<PdfDocument> {
  let bytes: Uint8Array;

  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    // The picker hands back a handle, not the bytes — a file moved or deleted since
    // it was dropped fails here rather than at parse time.
    throw new PdfError('UnreadablePdfError', `${file.name} could not be read`);
  }

  try {
    return await lib.PDFDocument.load(bytes);
  } catch (cause) {
    const detail = cause instanceof Error ? cause.message : String(cause);

    if (/encrypt/i.test(detail)) {
      throw new PdfError('EncryptedPdfError', `${file.name} is encrypted`);
    }

    throw new PdfError('UnreadablePdfError', `${file.name} could not be parsed`);
  }
}

/** A page rotated a quarter turn is displayed with its sides swapped. */
function displaySize(page: PdfPage): { readonly width: number; readonly height: number } {
  const { width, height } = page.getSize();
  const quarterTurned = Math.abs(page.getRotation().angle / 90) % 2 === 1;

  return quarterTurned ? { width: height, height: width } : { width, height };
}
