import { TextToolError } from './errors';
import {
  type CaseMode,
  type CleanupOptions,
  type DiffLine,
  type DiffSummary,
  MAX_DIFF_LINES,
  type TextStats,
} from './types';

const WORDS_PER_MINUTE = 200;

export function computeStats(text: string): TextStats {
  const trimmed = text.trim();
  const words = trimmed.length === 0 ? 0 : trimmed.split(/\s+/).length;

  return {
    characters: text.length,
    charactersNoSpaces: text.replace(/\s/g, '').length,
    words,
    lines: text.length === 0 ? 0 : text.split('\n').length,
    sentences: countSentences(trimmed),
    readingMinutes: words === 0 ? 0 : Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
  };
}

function countSentences(trimmed: string): number {
  if (trimmed.length === 0) return 0;
  return trimmed.match(/[^.!?]+[.!?]+/g)?.length ?? 1;
}

/** Order matters: line-level and space-level cleanup happen before the final overall
 *  trim, so trimming the edges is the last word rather than something an earlier step
 *  could reintroduce whitespace after. */
export function cleanText(text: string, options: CleanupOptions): string {
  let result = text;

  if (options.trimLines) {
    result = result
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }
  if (options.collapseSpaces) {
    result = result.replace(/[^\S\n]+/g, ' ');
  }
  if (options.collapseBlankLines) {
    result = result.replace(/\n{3,}/g, '\n\n');
  }
  if (options.trimEdges) {
    result = result.trim();
  }

  return result;
}

export function convertCase(text: string, mode: CaseMode): string {
  switch (mode) {
    case 'none':
      return text;
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\b\w+/g, capitalize);
    case 'sentence':
      return toSentenceCase(text);
    case 'camel':
      return toCamelCase(tokenizeWords(text));
    case 'snake':
      return tokenizeWords(text)
        .map((word) => word.toLowerCase())
        .join('_');
    case 'kebab':
      return tokenizeWords(text)
        .map((word) => word.toLowerCase())
        .join('-');
  }
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
}

function toSentenceCase(text: string): string {
  return text.toLowerCase().replace(/(^\s*\w|[.!?]\s+\w)/g, (match) => match.toUpperCase());
}

/** Splits camelCase/PascalCase boundaries into words too, not just whitespace and
 *  `_`/`-` — converting *between* conventions (snake_case in, kebab-case out) is as
 *  much the point as converting plain prose. */
function tokenizeWords(text: string): string[] {
  return text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s_-]+/)
    .filter(Boolean);
}

function toCamelCase(words: readonly string[]): string {
  return words.map((word, index) => (index === 0 ? word.toLowerCase() : capitalize(word))).join('');
}

/**
 * A classic LCS-backtrack line diff. `buildLcsTable` fills the standard dynamic-
 * programming grid; `walkDiff` reads it back from the bottom-right corner, which is
 * why the result is built in reverse and flipped once at the end. Every index read is
 * checked rather than asserted — `noUncheckedIndexedAccess` means the loop bounds
 * alone don't prove safety to the type checker, and writing the checks out keeps the
 * backtrack's actual logic (which side advanced, and why) readable instead of hidden
 * behind non-null assertions.
 */
export function diffLines(original: string, changed: string): readonly DiffLine[] {
  const a = original === '' ? [] : original.split('\n');
  const b = changed === '' ? [] : changed.split('\n');

  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) {
    throw new TextToolError(
      'TooManyLinesError',
      `${Math.max(a.length, b.length)} lines is over the ${MAX_DIFF_LINES}-line limit`,
    );
  }

  return walkDiff(a, b, buildLcsTable(a, b));
}

function buildLcsTable(a: readonly string[], b: readonly string[]): number[][] {
  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );

  for (let i = 1; i <= a.length; i += 1) {
    const row = table[i];
    const prevRow = table[i - 1];
    if (!row || !prevRow) continue;

    for (let j = 1; j <= b.length; j += 1) {
      if (a[i - 1] === b[j - 1]) {
        row[j] = (prevRow[j - 1] ?? 0) + 1;
      } else {
        row[j] = Math.max(prevRow[j] ?? 0, row[j - 1] ?? 0);
      }
    }
  }

  return table;
}

function walkDiff(
  a: readonly string[],
  b: readonly string[],
  table: readonly (readonly number[])[],
): DiffLine[] {
  const result: DiffLine[] = [];
  let i = a.length;
  let j = b.length;

  while (i > 0 || j > 0) {
    const fromA = i > 0 ? a[i - 1] : undefined;
    const fromB = j > 0 ? b[j - 1] : undefined;

    if (fromA !== undefined && fromA === fromB) {
      result.push({ type: 'same', text: fromA });
      i -= 1;
      j -= 1;
      continue;
    }

    const scoreKeepingB = table[i]?.[j - 1] ?? 0;
    const scoreKeepingA = table[i - 1]?.[j] ?? 0;
    const preferB = fromB !== undefined && (fromA === undefined || scoreKeepingB >= scoreKeepingA);

    if (preferB && fromB !== undefined) {
      result.push({ type: 'added', text: fromB });
      j -= 1;
    } else if (fromA !== undefined) {
      result.push({ type: 'removed', text: fromA });
      i -= 1;
    }
  }

  return result.reverse();
}

export function summarizeDiff(lines: readonly DiffLine[]): DiffSummary {
  let added = 0;
  let removed = 0;

  for (const line of lines) {
    if (line.type === 'added') added += 1;
    else if (line.type === 'removed') removed += 1;
  }

  return { added, removed };
}
