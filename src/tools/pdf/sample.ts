/**
 * The "try a sample" file, drawn rather than shipped: a PDF is bytes, so a committed
 * binary would be one more thing to keep honest in a public repo. It reads as a short
 * document that explains the tool, and page three is landscape so rotating has a point.
 *
 * The two greys are written out because a PDF can't read a CSS variable — they are the
 * ink and soft-ink steps from the palette, expressed the only way this format takes.
 */

const INK = { red: 0.086, green: 0.075, blue: 0.051 } as const;
const SOFT_INK = { red: 0.341, green: 0.325, blue: 0.29 } as const;

const MARGIN = 56;
const NUMERAL_SIZE = 132;
const HEADLINE_SIZE = 22;
const NOTE_SIZE = 12;

interface SamplePage {
  readonly headline: string;
  readonly note: string;
  readonly landscape?: boolean;
}

const PAGES: readonly SamplePage[] = [
  {
    headline: 'Sample document',
    note: 'Six pages, so moving and turning them has something to show.',
  },
  {
    headline: 'Drag a page to move it',
    note: 'The arrows on each page do the same thing from the keyboard.',
  },
  {
    headline: 'This page is landscape',
    note: 'Turn it upright, and the PDF you save keeps the new angle.',
    landscape: true,
  },
  {
    headline: 'Drop a second PDF',
    note: 'Its pages join the end of the board, ready to be moved anywhere.',
  },
  {
    headline: "Remove what you don't need",
    note: 'Deleting a page here never touches the file on your disk.',
  },
  {
    headline: 'Save when it looks right',
    note: 'The new PDF is built in this tab and downloads straight to you.',
  },
];

export async function createSample(): Promise<Uint8Array<ArrayBuffer>> {
  const { PageSizes, PDFDocument, rgb, StandardFonts } = await import('pdf-lib');

  const document = await PDFDocument.create();
  const body = await document.embedFont(StandardFonts.Helvetica);
  const display = await document.embedFont(StandardFonts.HelveticaBold);
  const ink = rgb(INK.red, INK.green, INK.blue);
  const softInk = rgb(SOFT_INK.red, SOFT_INK.green, SOFT_INK.blue);

  const [shortSide, longSide] = PageSizes.A4;

  PAGES.forEach((content, index) => {
    const page = document.addPage(
      content.landscape ? [longSide, shortSide] : [shortSide, longSide],
    );
    const { height, width } = page.getSize();
    let cursor = height - MARGIN - NUMERAL_SIZE;

    page.drawText(String(index + 1), {
      x: MARGIN,
      y: cursor,
      size: NUMERAL_SIZE,
      font: display,
      color: ink,
    });

    cursor -= HEADLINE_SIZE + MARGIN / 2;
    page.drawText(content.headline, {
      x: MARGIN,
      y: cursor,
      size: HEADLINE_SIZE,
      font: display,
      color: ink,
    });

    cursor -= MARGIN / 2;
    page.drawLine({
      start: { x: MARGIN, y: cursor },
      end: { x: width - MARGIN, y: cursor },
      thickness: 2,
      color: ink,
    });

    cursor -= MARGIN / 2 + NOTE_SIZE;
    page.drawText(content.note, {
      x: MARGIN,
      y: cursor,
      size: NOTE_SIZE,
      font: body,
      color: softInk,
    });
  });

  document.setTitle('tooldo sample');
  document.setCreator('tooldo');

  return new Uint8Array(await document.save({ useObjectStreams: true }));
}
