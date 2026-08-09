import { describe, expect, it } from 'vitest';
import { cleanText, computeStats, convertCase, diffLines, summarizeDiff } from './engine';
import { DEFAULT_CLEANUP, MAX_DIFF_LINES } from './types';

describe('computeStats', () => {
  it('counts characters, words, lines, and sentences', () => {
    const stats = computeStats('Hello world. How are you?\nSecond line.');

    expect(stats.words).toBe(7);
    expect(stats.lines).toBe(2);
    expect(stats.sentences).toBe(3);
    expect(stats.charactersNoSpaces).toBeLessThan(stats.characters);
  });

  it('returns all zeros for empty text', () => {
    const stats = computeStats('');

    expect(stats).toEqual({
      characters: 0,
      charactersNoSpaces: 0,
      words: 0,
      lines: 0,
      sentences: 0,
      readingMinutes: 0,
    });
  });

  it('never reports zero reading minutes for non-empty text', () => {
    expect(computeStats('one word').readingMinutes).toBeGreaterThanOrEqual(1);
  });

  it('counts a sentence with no terminal punctuation as one', () => {
    expect(computeStats('no ending punctuation here').sentences).toBe(1);
  });
});

describe('cleanText', () => {
  it('leaves text untouched when every option is off', () => {
    const messy = '  hi   there  \n\n\n\n  bye  ';
    expect(cleanText(messy, DEFAULT_CLEANUP)).toBe(messy);
  });

  it('trims each line independently', () => {
    const result = cleanText('  a  \n  b  ', { ...DEFAULT_CLEANUP, trimLines: true });
    expect(result).toBe('a\nb');
  });

  it('collapses multiple spaces without touching newlines', () => {
    const result = cleanText('a    b\nc     d', { ...DEFAULT_CLEANUP, collapseSpaces: true });
    expect(result).toBe('a b\nc d');
  });

  it('collapses three or more blank lines down to exactly one', () => {
    const result = cleanText('a\n\n\n\n\nb', { ...DEFAULT_CLEANUP, collapseBlankLines: true });
    expect(result).toBe('a\n\nb');
  });

  it('trims leading and trailing whitespace from the whole text', () => {
    const result = cleanText('\n\n  hello  \n\n', { ...DEFAULT_CLEANUP, trimEdges: true });
    expect(result).toBe('hello');
  });

  it('applies every requested cleanup together', () => {
    const messy = '\n  Hello    world  \n\n\n\n  Second   line  \n\n';
    const result = cleanText(messy, {
      trimLines: true,
      collapseSpaces: true,
      collapseBlankLines: true,
      trimEdges: true,
    });
    expect(result).toBe('Hello world\n\nSecond line');
  });
});

describe('convertCase', () => {
  const sample = 'the Quick BROWN fox';

  it('uppercases and lowercases', () => {
    expect(convertCase(sample, 'upper')).toBe('THE QUICK BROWN FOX');
    expect(convertCase(sample, 'lower')).toBe('the quick brown fox');
  });

  it('title-cases each word', () => {
    expect(convertCase(sample, 'title')).toBe('The Quick Brown Fox');
  });

  it('sentence-cases across multiple sentences and preserves line breaks', () => {
    const result = convertCase('hello world. HOW ARE YOU?\nfine, thanks.', 'sentence');
    expect(result).toBe('Hello world. How are you?\nFine, thanks.');
  });

  it('leaves text unchanged for "none"', () => {
    expect(convertCase(sample, 'none')).toBe(sample);
  });

  it('converts prose to camelCase, snake_case, and kebab-case', () => {
    expect(convertCase(sample, 'camel')).toBe('theQuickBrownFox');
    expect(convertCase(sample, 'snake')).toBe('the_quick_brown_fox');
    expect(convertCase(sample, 'kebab')).toBe('the-quick-brown-fox');
  });

  it('converts between conventions, not just from prose', () => {
    expect(convertCase('helloWorldTest', 'snake')).toBe('hello_world_test');
    expect(convertCase('hello_world_test', 'camel')).toBe('helloWorldTest');
    expect(convertCase('hello-world-test', 'kebab')).toBe('hello-world-test');
  });
});

describe('diffLines', () => {
  it('marks every line as unchanged for identical text', () => {
    const lines = diffLines('a\nb\nc', 'a\nb\nc');
    expect(lines.every((line) => line.type === 'same')).toBe(true);
    expect(lines.map((line) => line.text)).toEqual(['a', 'b', 'c']);
  });

  it('marks every line as removed then added for fully different text', () => {
    const summary = summarizeDiff(diffLines('a\nb', 'x\ny'));
    expect(summary).toEqual({ added: 2, removed: 2 });
  });

  it('treats an empty original as nothing but additions', () => {
    const lines = diffLines('', 'a\nb');
    expect(lines).toEqual([
      { type: 'added', text: 'a' },
      { type: 'added', text: 'b' },
    ]);
  });

  it('treats an empty changed text as nothing but removals', () => {
    const lines = diffLines('a\nb', '');
    expect(lines).toEqual([
      { type: 'removed', text: 'a' },
      { type: 'removed', text: 'b' },
    ]);
  });

  it('produces no lines at all for two empty texts', () => {
    expect(diffLines('', '')).toEqual([]);
  });

  it('detects a pure insertion in the middle', () => {
    const lines = diffLines('a\nc', 'a\nb\nc');
    expect(lines).toEqual([
      { type: 'same', text: 'a' },
      { type: 'added', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('detects a pure deletion in the middle', () => {
    const lines = diffLines('a\nb\nc', 'a\nc');
    expect(lines).toEqual([
      { type: 'same', text: 'a' },
      { type: 'removed', text: 'b' },
      { type: 'same', text: 'c' },
    ]);
  });

  it('handles interleaved changes correctly', () => {
    const lines = diffLines('a\nb\nc\nd', 'a\nx\nc\ny');
    const summary = summarizeDiff(lines);
    expect(summary).toEqual({ added: 2, removed: 2 });
    expect(lines.filter((line) => line.type === 'same').map((line) => line.text)).toEqual([
      'a',
      'c',
    ]);
  });

  it('rejects a comparison over the line cap', () => {
    const huge = Array.from({ length: MAX_DIFF_LINES + 1 }, (_, index) => `line ${index}`).join(
      '\n',
    );
    expect(() => diffLines(huge, 'a')).toThrow();
  });

  it('allows a comparison exactly at the line cap', () => {
    const atCap = Array.from({ length: MAX_DIFF_LINES }, (_, index) => `line ${index}`).join('\n');
    expect(() => diffLines(atCap, atCap)).not.toThrow();
  });
});

describe('summarizeDiff', () => {
  it('counts only added and removed lines, not unchanged ones', () => {
    const summary = summarizeDiff([
      { type: 'same', text: 'a' },
      { type: 'added', text: 'b' },
      { type: 'removed', text: 'c' },
      { type: 'added', text: 'd' },
    ]);
    expect(summary).toEqual({ added: 2, removed: 1 });
  });
});
