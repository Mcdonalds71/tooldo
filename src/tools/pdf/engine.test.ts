import { degrees, PDFDocument } from 'pdf-lib';
import { describe, expect, it } from 'vitest';
import { build, inspect } from './engine';
import { createSample } from './sample';
import { MAX_PAGES, type PagePlan } from './types';

async function asFile(document: PDFDocument, name: string): Promise<File> {
  return new File([new Uint8Array(await document.save())], name, { type: 'application/pdf' });
}

/** Pages get distinct widths so the order of the finished document is readable from it. */
async function makePdf(widths: readonly number[], name = 'notes.pdf'): Promise<File> {
  const document = await PDFDocument.create();
  for (const width of widths) document.addPage([width, 400]);

  return asFile(document, name);
}

async function widthsOf(bytes: Uint8Array): Promise<number[]> {
  const document = await PDFDocument.load(bytes);

  return document.getPages().map((page) => Math.round(page.getSize().width));
}

const plan = (source: number, page: number, rotation: PagePlan['rotation'] = 0): PagePlan => ({
  source,
  page,
  rotation,
});

describe('inspect', () => {
  it('reports every page of every file in the order they were dropped', async () => {
    const files = [await makePdf([200, 210], 'first.pdf'), await makePdf([300], 'second.pdf')];

    const { sources, pages } = await inspect(files);

    expect(sources.map((source) => [source.name, source.pages])).toEqual([
      ['first.pdf', 2],
      ['second.pdf', 1],
    ]);
    expect(pages.map((page) => [page.source, page.page])).toEqual([
      [0, 0],
      [0, 1],
      [1, 0],
    ]);
    expect(pages.map((page) => page.width)).toEqual([200, 210, 300]);
  });

  it('reports a quarter-turned page with its sides swapped, the way it is displayed', async () => {
    const document = await PDFDocument.create();
    document.addPage([200, 400]).setRotation(degrees(90));
    const file = await asFile(document, 'sideways.pdf');

    const { pages } = await inspect([file]);

    expect(pages[0]).toMatchObject({ width: 400, height: 200 });
  });

  it('reads the sample it draws', async () => {
    const file = new File([await createSample()], 'tooldo-sample.pdf');

    const { pages, sources } = await inspect([file]);

    expect(sources[0]?.pages).toBe(6);
    expect(pages).toHaveLength(6);
    expect(pages.filter((page) => page.width > page.height)).toHaveLength(1);
  });

  it('has nothing to say about nothing', async () => {
    await expect(inspect([])).resolves.toEqual({ sources: [], pages: [] });
  });

  it('reports progress once per file', async () => {
    const seen: number[] = [];
    const files = [await makePdf([200]), await makePdf([300])];

    await inspect(files, (fraction) => seen.push(fraction));

    expect(seen).toEqual([0.5, 1]);
  });

  it('turns a file that is not a PDF into a typed error', async () => {
    const file = new File([new Uint8Array([0x89, 0x50, 0x4e, 0x47])], 'cat.png');

    await expect(inspect([file])).rejects.toMatchObject({ name: 'UnreadablePdfError' });
  });

  it('turns a PDF that stops half way into a typed error', async () => {
    const whole = await createSample();
    const file = new File([whole.slice(0, Math.floor(whole.length / 2))], 'truncated.pdf');

    await expect(inspect([file])).rejects.toMatchObject({ name: 'UnreadablePdfError' });
  });

  it('refuses a document longer than the cap rather than working through it', async () => {
    const file = await makePdf(
      Array.from({ length: MAX_PAGES + 1 }, () => 200),
      'phonebook.pdf',
    );

    await expect(inspect([file])).rejects.toMatchObject({ name: 'TooManyPagesError' });
  });

  it('refuses a PDF with no pages in it', async () => {
    // Written by hand: pdf-lib rebuilds a page tree it created itself, so a document
    // that genuinely holds nothing has to come from somewhere else.
    const pageless = [
      '%PDF-1.7',
      '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
      '2 0 obj << /Type /Pages /Kids [] /Count 0 >> endobj',
      'trailer << /Size 3 /Root 1 0 R >>',
      '%%EOF',
    ].join('\n');

    const file = new File([pageless], 'blank.pdf', { type: 'application/pdf' });

    await expect(inspect([file])).rejects.toMatchObject({ name: 'EmptyDocumentError' });
  });
});

describe('build', () => {
  it('merges files and lays the pages out in the order the plan gives', async () => {
    const files = [await makePdf([200, 210]), await makePdf([300])];

    const { bytes, pages } = await build(files, [plan(1, 0), plan(0, 1), plan(0, 0)]);

    expect(pages).toBe(3);
    await expect(widthsOf(bytes)).resolves.toEqual([300, 210, 200]);
  });

  it('drops the pages the plan leaves out', async () => {
    const files = [await makePdf([200, 210, 220])];

    const { bytes } = await build(files, [plan(0, 2)]);

    await expect(widthsOf(bytes)).resolves.toEqual([220]);
  });

  it('takes the same page twice when the plan asks twice', async () => {
    const files = [await makePdf([200, 210])];

    const { bytes } = await build(files, [plan(0, 1), plan(0, 1)]);

    await expect(widthsOf(bytes)).resolves.toEqual([210, 210]);
  });

  it('turns a page on top of the rotation it already carries', async () => {
    const document = await PDFDocument.create();
    document.addPage([200, 400]).setRotation(degrees(270));
    const files = [await asFile(document, 'sideways.pdf')];

    const { bytes } = await build(files, [plan(0, 0, 180)]);
    const output = await PDFDocument.load(bytes);

    expect(output.getPage(0).getRotation().angle).toBe(90);
  });

  it('leaves the source metadata behind, since the document is a new one', async () => {
    const document = await PDFDocument.create();
    document.addPage([200, 400]);
    document.setAuthor('Someone else');
    document.setTitle('Q3 board pack');
    const files = [await asFile(document, 'board-pack.pdf')];

    const { bytes } = await build(files, [plan(0, 0)]);
    const output = await PDFDocument.load(bytes);

    expect(output.getAuthor()).toBeUndefined();
    expect(output.getTitle()).toBeUndefined();
    expect(output.getCreator()).toBe('tooldo');
  });

  it('refuses to save a document with no pages', async () => {
    const files = [await makePdf([200])];

    await expect(build(files, [])).rejects.toMatchObject({ name: 'EmptyPlanError' });
  });

  it.each([
    ['a page past the end', plan(0, 7)],
    ['a page before the start', plan(0, -1)],
    ['a file that was never dropped', plan(4, 0)],
  ])('refuses a plan pointing at %s', async (_case, entry) => {
    const files = [await makePdf([200, 210])];

    await expect(build(files, [entry])).rejects.toMatchObject({ name: 'InvalidPageError' });
  });

  it('reports progress that only ever moves forward', async () => {
    const seen: number[] = [];
    const files = [await makePdf([200]), await makePdf([300])];

    await build(files, [plan(0, 0), plan(1, 0)], (fraction) => seen.push(fraction));

    expect(seen.at(-1)).toBe(1);
    expect([...seen].sort((a, b) => a - b)).toEqual(seen);
  });
});
