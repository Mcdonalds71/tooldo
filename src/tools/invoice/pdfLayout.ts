import type { PDFDocument, PDFFont, PDFPage, RGB } from 'pdf-lib';
import { InvoiceError } from './errors';
import { formatMoney, lineItemAmount, toSafeNumber } from './money';
import type { InvoiceData, InvoiceTotals, LineItem } from './types';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 50;
const CONTENT_RIGHT = PAGE_WIDTH - MARGIN;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const LOGO_MAX = 64;
const ROW_HEIGHT = 22;

const COLUMN = {
  description: MARGIN,
  qty: MARGIN + CONTENT_WIDTH * 0.58,
  unitPrice: MARGIN + CONTENT_WIDTH * 0.72,
};

interface Fonts {
  readonly regular: PDFFont;
  readonly bold: PDFFont;
}

interface Palette {
  readonly ink: RGB;
  readonly inkSoft: RGB;
  readonly line: RGB;
  readonly signal: RGB;
}

/**
 * Everything below the page margin, top to bottom. Every section function takes the
 * `y` it may start drawing at and returns the `y` the next section should start at —
 * one consistent contract instead of each section knowing about its neighbours.
 */
export async function drawInvoicePage(
  doc: PDFDocument,
  data: InvoiceData,
  totals: InvoiceTotals,
): Promise<void> {
  const { StandardFonts, rgb } = await import('pdf-lib');

  const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  const fonts: Fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const palette: Palette = {
    ink: rgb(0.086, 0.075, 0.051),
    inkSoft: rgb(0.341, 0.325, 0.29),
    line: rgb(0.851, 0.827, 0.773),
    signal: rgb(1, 0.231, 0.078),
  };

  let y = PAGE_HEIGHT - MARGIN;
  y = await drawHeader(page, fonts, palette, doc, data, y);
  y = drawBillTo(page, fonts, palette, data, y - 28);
  y = drawLineItems(page, fonts, palette, data.lineItems, y - 28);
  y = drawTotals(page, fonts, palette, totals, data.details, y - 14);

  if (data.details.notes.trim()) {
    drawNotes(page, fonts, palette, data.details.notes, y - 32);
  }
}

async function drawHeader(
  page: PDFPage,
  fonts: Fonts,
  palette: Palette,
  doc: PDFDocument,
  data: InvoiceData,
  top: number,
): Promise<number> {
  let leftY = top;

  if (data.business.logoDataUrl) {
    const image = await embedLogo(doc, data.business.logoDataUrl);
    const { width, height } = image.scaleToFit(LOGO_MAX, LOGO_MAX);
    page.drawImage(image, { x: MARGIN, y: leftY - height, width, height });
    leftY -= height + 10;
  }

  if (data.business.name) {
    drawLeft(page, fonts.bold, 15, data.business.name, MARGIN, leftY - 14, palette.ink);
    leftY -= 30;
  }

  for (const line of [data.business.address, data.business.email, data.business.phone]) {
    if (!line) continue;
    drawLeft(page, fonts.regular, 9, line, MARGIN, leftY - 10, palette.inkSoft);
    leftY -= 14;
  }

  let rightY = top - 18;
  drawRight(page, fonts.bold, 20, 'INVOICE', rightY, palette.signal);
  rightY -= 20;

  const meta = [
    data.details.invoiceNumber && `Invoice #${data.details.invoiceNumber}`,
    data.details.issueDate && `Issued ${data.details.issueDate}`,
    data.details.dueDate && `Due ${data.details.dueDate}`,
  ].filter((line): line is string => Boolean(line));

  for (const line of meta) {
    drawRight(page, fonts.regular, 9, line, rightY, palette.inkSoft);
    rightY -= 13;
  }

  return Math.min(leftY, rightY);
}

function drawBillTo(
  page: PDFPage,
  fonts: Fonts,
  palette: Palette,
  data: InvoiceData,
  top: number,
): number {
  drawLeft(page, fonts.bold, 8, 'BILL TO', MARGIN, top, palette.inkSoft);
  let y = top - 16;

  const lines = [data.client.name, data.client.address, data.client.email].filter(Boolean);
  for (const line of lines) {
    drawLeft(page, fonts.regular, 10, line, MARGIN, y, palette.ink);
    y -= 14;
  }

  return lines.length > 0 ? y : top - 14;
}

function drawLineItems(
  page: PDFPage,
  fonts: Fonts,
  palette: Palette,
  lineItems: readonly LineItem[],
  top: number,
): number {
  let y = top;

  drawLeft(page, fonts.bold, 8, 'DESCRIPTION', COLUMN.description, y, palette.inkSoft);
  drawLeft(page, fonts.bold, 8, 'QTY', COLUMN.qty, y, palette.inkSoft);
  drawLeft(page, fonts.bold, 8, 'UNIT PRICE', COLUMN.unitPrice, y, palette.inkSoft);
  drawRight(page, fonts.bold, 8, 'AMOUNT', y, palette.inkSoft);

  y -= 8;
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: CONTENT_RIGHT, y },
    thickness: 1,
    color: palette.line,
  });
  y -= ROW_HEIGHT - 6;

  for (const item of lineItems) {
    drawLeft(
      page,
      fonts.regular,
      10,
      item.description || 'Untitled item',
      COLUMN.description,
      y,
      palette.ink,
    );
    drawLeft(page, fonts.regular, 10, item.quantity || '0', COLUMN.qty, y, palette.ink);
    drawLeft(
      page,
      fonts.regular,
      10,
      formatMoney(toSafeNumber(item.unitPrice)),
      COLUMN.unitPrice,
      y,
      palette.ink,
    );
    drawRight(page, fonts.regular, 10, formatMoney(lineItemAmount(item)), y, palette.ink);
    y -= ROW_HEIGHT;
  }

  const bottom = y + ROW_HEIGHT - 8;
  page.drawLine({
    start: { x: MARGIN, y: bottom },
    end: { x: CONTENT_RIGHT, y: bottom },
    thickness: 1,
    color: palette.line,
  });

  return y;
}

function drawTotals(
  page: PDFPage,
  fonts: Fonts,
  palette: Palette,
  totals: InvoiceTotals,
  details: InvoiceData['details'],
  top: number,
): number {
  const labelX = CONTENT_RIGHT - 160;
  let y = top;

  const row = (label: string, amount: number, emphasize: boolean) => {
    const size = emphasize ? 13 : 10;
    const font = emphasize ? fonts.bold : fonts.regular;
    const color = emphasize ? palette.signal : palette.inkSoft;
    drawLeft(page, font, size, label, labelX, y, color);
    drawRight(page, font, size, formatMoney(amount), y, emphasize ? palette.signal : palette.ink);
    y -= emphasize ? 22 : 16;
  };

  row('Subtotal', totals.subtotal, false);
  if (totals.discountAmount > 0)
    row(`Discount (${details.discountRate}%)`, -totals.discountAmount, false);
  if (totals.taxAmount > 0) row(`Tax (${details.taxRate}%)`, totals.taxAmount, false);

  y -= 4;
  page.drawLine({
    start: { x: labelX, y: y + 12 },
    end: { x: CONTENT_RIGHT, y: y + 12 },
    thickness: 1,
    color: palette.inkSoft,
  });
  row('Total', totals.total, true);

  return y;
}

function drawNotes(
  page: PDFPage,
  fonts: Fonts,
  palette: Palette,
  notes: string,
  top: number,
): void {
  drawLeft(page, fonts.bold, 8, 'NOTES', MARGIN, top, palette.inkSoft);
  page.drawText(notes, {
    x: MARGIN,
    y: top - 16,
    size: 9,
    font: fonts.regular,
    color: palette.inkSoft,
    lineHeight: 13,
    maxWidth: CONTENT_WIDTH,
  });
}

function drawLeft(
  page: PDFPage,
  font: PDFFont,
  size: number,
  text: string,
  x: number,
  y: number,
  color: RGB,
): void {
  page.drawText(text, { x, y, size, font, color });
}

function drawRight(
  page: PDFPage,
  font: PDFFont,
  size: number,
  text: string,
  y: number,
  color: RGB,
): void {
  const width = font.widthOfTextAtSize(text, size);
  page.drawText(text, { x: CONTENT_RIGHT - width, y, size, font, color });
}

async function embedLogo(doc: PDFDocument, dataUrl: string) {
  try {
    if (dataUrl.startsWith('data:image/png')) return await doc.embedPng(dataUrl);
    return await doc.embedJpg(dataUrl);
  } catch (cause) {
    throw new InvoiceError('InvalidLogoError', "That logo couldn't be embedded", { cause });
  }
}
