import workerSource from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { pageKey } from './board';

/**
 * Page previews, drawn one at a time so the board fills in rather than waiting.
 *
 * This is the one part of the tool that doesn't go through `runInWorker`: pdf.js parses
 * in a worker it ships and owns, and the paint has to happen where the canvas is. The
 * heavy half is still off the main thread, which is what the rule is protecting.
 */

type Pdfjs = typeof import('pdfjs-dist');
type PdfDocumentProxy = Awaited<ReturnType<Pdfjs['getDocument']>['promise']>;

const THUMBNAIL_WIDTH = 240;

export interface Thumbnail {
  readonly key: string;
  readonly url: string;
}

export async function* renderThumbnails(
  files: readonly File[],
  signal: AbortSignal,
): AsyncGenerator<Thumbnail> {
  const pdfjs = await import('pdfjs-dist');
  pdfjs.GlobalWorkerOptions.workerSrc = workerSource;

  for (const [source, file] of files.entries()) {
    if (signal.aborted) return;

    const task = pdfjs.getDocument({
      data: new Uint8Array(await file.arrayBuffer()),
      // The policy has no font-src for data: URLs, and pdf.js installs its fonts that
      // way unless told not to. Glyphs are drawn as outlines instead, which a preview
      // this size can't tell apart.
      disableFontFace: true,
    });

    try {
      const pdf = await task.promise;

      for (let number = 1; number <= pdf.numPages; number += 1) {
        if (signal.aborted) return;

        const url = await renderPage(pdf, number);
        if (url) yield { key: pageKey(source, number - 1), url };
      }
    } finally {
      await task.destroy();
    }
  }
}

async function renderPage(pdf: PdfDocumentProxy, number: number): Promise<string | undefined> {
  const page = await pdf.getPage(number);

  try {
    const scale = THUMBNAIL_WIDTH / page.getViewport({ scale: 1 }).width;
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement('canvas');

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({ canvas, viewport }).promise;

    return await toObjectUrl(canvas);
  } catch {
    // One page that won't draw shouldn't cost the other four hundred their previews —
    // the board falls back to a numbered placeholder for this one.
    return undefined;
  } finally {
    page.cleanup();
  }
}

function toObjectUrl(canvas: HTMLCanvasElement): Promise<string | undefined> {
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(blob ? URL.createObjectURL(blob) : undefined),
      'image/webp',
      0.75,
    );
  });
}
