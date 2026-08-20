import { describe, expect, it } from 'vitest';
import { toPdfText } from './pdfText';

describe('toPdfText', () => {
  it('leaves ordinary text alone', () => {
    expect(toPdfText('Acme Studio, 148 Baker Street')).toBe('Acme Studio, 148 Baker Street');
  });

  it('keeps the western European accents WinAnsi already covers', () => {
    expect(toPdfText('Café Möller & Sønner, Zürich')).toBe('Café Möller & Sønner, Zürich');
  });

  it('keeps the newlines a payment block is typed with', () => {
    expect(toPdfText('Acme Studio\n0123456789')).toBe('Acme Studio\n0123456789');
  });

  /* The case this module exists for. A naira sign used to throw out of pdf-lib and
     surface as "the invoice didn't generate, try again", on the one field a Nigerian
     business owner is most likely to type one into. */
  it('substitutes the naira sign for the code the totals already print', () => {
    expect(toPdfText('GTBank ₦45,000')).toBe('GTBank NGN45,000');
  });

  it.each([
    ['₹1,200', 'INR1,200'],
    ['₵80', 'GHS80'],
    ['₩9000', 'KRW9000'],
  ])('substitutes %s', (input, expected) => {
    expect(toPdfText(input)).toBe(expected);
  });

  it('flattens the smart punctuation a word processor inserts silently', () => {
    expect(toPdfText('Net‑30 terms')).toBe('Net-30 terms');
  });

  it('drops a zero-width space rather than rejecting the whole invoice for it', () => {
    expect(toPdfText('Acme​Studio')).toBe('AcmeStudio');
  });

  /* Substituting here would be a guess at what someone meant. A named error is the
     honest answer, and it is the difference between a person knowing to change one
     character and retrying forever. */
  it('rejects a script the font genuinely cannot draw, by name', () => {
    expect(() => toPdfText('株式会社')).toThrow(/cannot draw/);
  });

  it('reports the offending character so the message can name it', () => {
    expect(() => toPdfText('Bank ₸ 500')).not.toThrow();
    expect(() => toPdfText('Bank ☂ 500')).toThrow(/☂/);
  });
});
